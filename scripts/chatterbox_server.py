"""Self-hosted Chatterbox TTS server for the family story voice prototype.

The `chatterbox-http` adapter (lib/voice/providers/chatterbox.ts) talks to this.
It is stateless: every request carries the reference clip, which is written to
a temp file for Chatterbox's `audio_prompt_path` and deleted before the
response is sent. Nothing is stored, and no text is logged.

Contract (engine-design.md, section 10.3)

    POST /tts          Authorization: Bearer $CHATTERBOX_TOKEN   (required: at least 32 characters)
      multipart/form-data:
        text          one sentence group, at most 350 characters
        model         "chatterbox" | "chatterbox-turbo"
        reference     WAV, the owner's ~12 s reference clip
        exaggeration  float (default 0.5)   ignored by Turbo
        cfg_weight    float (default 0.5)   ignored by Turbo
        temperature   float (default 0.8)
        seed          int (default 1234)
      200 audio/wav (16-bit PCM mono, model.sr)
          X-Watermark: perth   only when PerTh was re-detected on this output
    GET  /health       -> {"ok": true, "models": [...loaded], "device": "cuda"}

Model: https://github.com/resemble-ai/chatterbox (MIT). Every output is meant
to carry Resemble's PerTh watermark; we check it with
perth.PerthImplicitWatermarker().get_watermark(audio, sample_rate=sr)
(0.0 or 1.0) rather than assume it, so the adapter never over-claims.

Run locally (a CUDA GPU, or Apple silicon with CHATTERBOX_DEVICE=mps):

    python -m venv .venv && . .venv/bin/activate
    pip install chatterbox-tts fastapi "uvicorn[standard]" python-multipart numpy
    CHATTERBOX_TOKEN=$(openssl rand -hex 32) uvicorn scripts.chatterbox_server:app --host 127.0.0.1 --port 8000

then in .env.local: CHATTERBOX_URL=http://127.0.0.1:8000 and the same
CHATTERBOX_TOKEN (the adapter only sends it over https, or plain http to this
machine).

Fails closed. The server synthesizes any text in any uploaded voice, so /tts
refuses every request (503) unless CHATTERBOX_TOKEN is set to at least 32
characters, and then refuses any request without it (401). The only way to run
without a token is on this machine: ALLOW_NO_TOKEN_LOCAL=1 and HOST=127.0.0.1
(python scripts/chatterbox_server.py), and even then only loopback clients are
served. A missing or misnamed Modal secret therefore leaves a closed server,
never a free voice-cloning endpoint.

Deploy on Modal (research §3: an L4 is the planning case, about $0.07 a chapter):

    # modal_app.py, next to this file
    import modal
    image = (modal.Image.debian_slim(python_version="3.11")
             .pip_install("chatterbox-tts", "fastapi", "python-multipart", "numpy")
             .add_local_python_source("chatterbox_server"))
    app = modal.App("gg-chatterbox", image=image,
                    secrets=[modal.Secret.from_name("gg-chatterbox")])  # holds CHATTERBOX_TOKEN

    @app.function(gpu="L4", scaledown_window=300, max_containers=1)
    @modal.asgi_app()
    def web():
        from chatterbox_server import app as fastapi_app
        return fastapi_app

    # modal deploy modal_app.py  -> use the printed https URL as CHATTERBOX_URL

Keep Modal's request logging at its defaults (method, path, status). Do not add
body logging: the text contains the children's real names.
"""

from __future__ import annotations

import hmac
import inspect
import io
import logging
import os
import tempfile
import threading
import wave
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, Response
from starlette.concurrency import run_in_threadpool

log = logging.getLogger("chatterbox_server")

MAX_TEXT_CHARS = 350
MIN_TOKEN_CHARS = 32
LOOPBACK = {"127.0.0.1", "::1", "localhost"}
MAX_REFERENCE_BYTES = 10 * 1024 * 1024
MODELS = ("chatterbox", "chatterbox-turbo")

app = FastAPI(title="Grit & Grace Chatterbox", docs_url=None, redoc_url=None, openapi_url=None)

_models: dict[str, Any] = {}
_load_lock = threading.Lock()
# One GPU, one generation at a time: keeps memory predictable and seeds reproducible.
_gen_lock = threading.Lock()
_watermarker: Any = None


def _device() -> str:
    wanted = os.environ.get("CHATTERBOX_DEVICE")
    if wanted:
        return wanted
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
    except Exception:  # pragma: no cover - torch missing is reported on first request
        pass
    return "cpu"


def _load(name: str) -> Any:
    with _load_lock:
        if name in _models:
            return _models[name]
        device = _device()
        if name == "chatterbox-turbo":
            from chatterbox.tts_turbo import ChatterboxTurboTTS

            model = ChatterboxTurboTTS.from_pretrained(device=device)
        else:
            from chatterbox.tts import ChatterboxTTS

            model = ChatterboxTTS.from_pretrained(device=device)
        _models[name] = model
        log.info("loaded %s on %s", name, device)
        return model


def _perth() -> Any:
    global _watermarker
    if _watermarker is None:
        import perth

        _watermarker = perth.PerthImplicitWatermarker()
    return _watermarker


def _token() -> str:
    return os.environ.get("CHATTERBOX_TOKEN", "")


def _no_token_local_allowed() -> bool:
    """Tokenless mode: only when explicitly asked for, and only bound to loopback."""
    return os.environ.get("ALLOW_NO_TOKEN_LOCAL") == "1" and os.environ.get("HOST", "") in LOOPBACK


def _check_token(authorization: str | None, client_host: str | None) -> None:
    expected = _token()
    if not expected:
        if _no_token_local_allowed() and (client_host or "") in LOOPBACK:
            return
        # Fail closed: no token configured means no service.
        raise HTTPException(status_code=503, detail="server not configured")
    if len(expected) < MIN_TOKEN_CHARS:
        raise HTTPException(status_code=503, detail="server not configured")
    given = (authorization or "").removeprefix("Bearer ").strip()
    if not hmac.compare_digest(given.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="unauthorized")


@app.on_event("startup")
def _startup_check() -> None:
    token = _token()
    if not token and not _no_token_local_allowed():
        log.error(
            "CHATTERBOX_TOKEN is not set: /tts will refuse every request (503). "
            "Set a token of at least %d characters, or for a local-only test run "
            "ALLOW_NO_TOKEN_LOCAL=1 HOST=127.0.0.1.",
            MIN_TOKEN_CHARS,
        )
    elif token and len(token) < MIN_TOKEN_CHARS:
        log.error("CHATTERBOX_TOKEN is shorter than %d characters: /tts will refuse every request.", MIN_TOKEN_CHARS)


def _to_mono_float(wav: Any) -> np.ndarray:
    """Chatterbox returns a torch tensor shaped (1, n) or (n,)."""
    arr = wav.detach().cpu().numpy() if hasattr(wav, "detach") else np.asarray(wav)
    arr = np.squeeze(arr).astype(np.float32)
    if arr.ndim > 1:
        arr = arr.mean(axis=0)
    return arr


def _wav_bytes(samples: np.ndarray, sr: int) -> bytes:
    pcm = (np.clip(samples, -1.0, 1.0) * 32767.0).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(int(sr))
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def _generate(model: Any, text: str, ref_path: str, params: dict[str, float]) -> Any:
    # Pass only the knobs this model's generate() accepts (Turbo takes fewer).
    accepted = inspect.signature(model.generate).parameters
    kwargs = {k: v for k, v in params.items() if k in accepted}
    return model.generate(text, audio_prompt_path=ref_path, **kwargs)


@app.get("/health")
def health() -> JSONResponse:
    return JSONResponse({"ok": True, "models": sorted(_models), "device": _device()})


def _synthesize(model_name: str, text: str, ref_path: str, seed: int, params: dict[str, float]) -> tuple[np.ndarray, int]:
    """Blocking work (model load, generation). Runs in a worker thread, serialized by _gen_lock."""
    m = _load(model_name)
    with _gen_lock:
        import torch

        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
        out = _generate(m, text, ref_path, params)
    return _to_mono_float(out), int(m.sr)


@app.post("/tts")
async def tts(
    request: Request,
    text: str = Form(...),
    reference: UploadFile = File(...),
    model: str = Form("chatterbox"),
    exaggeration: float = Form(0.5),
    cfg_weight: float = Form(0.5),
    temperature: float = Form(0.8),
    seed: int = Form(1234),
    authorization: str | None = Header(default=None),
) -> Response:
    _check_token(authorization, request.client.host if request.client else None)
    text = " ".join(text.split())
    if not text or len(text) > MAX_TEXT_CHARS:
        raise HTTPException(status_code=400, detail=f"text must be 1-{MAX_TEXT_CHARS} characters")
    if model not in MODELS:
        raise HTTPException(status_code=400, detail="unknown model")
    if not (0.0 <= exaggeration <= 2.0 and 0.0 <= cfg_weight <= 1.0 and 0.05 <= temperature <= 2.0):
        raise HTTPException(status_code=400, detail="parameter out of range")

    data = await reference.read(MAX_REFERENCE_BYTES + 1)
    if not data or len(data) > MAX_REFERENCE_BYTES or data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise HTTPException(status_code=400, detail="reference must be a WAV file under 10 MB")

    fd, ref_path = tempfile.mkstemp(prefix="gg-ref-", suffix=".wav")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        # Off the event loop: /health and other requests stay responsive while a
        # model loads or generates, and _gen_lock does the serializing.
        samples, sr = await run_in_threadpool(
            _synthesize,
            model,
            text,
            ref_path,
            seed,
            {"exaggeration": exaggeration, "cfg_weight": cfg_weight, "temperature": temperature},
        )
    except HTTPException:
        raise
    except Exception as e:  # never echo the text or the traceback to the caller
        log.error("generation failed: %s", type(e).__name__)
        raise HTTPException(status_code=500, detail="generation failed") from None
    finally:
        try:
            os.unlink(ref_path)
        except FileNotFoundError:
            pass

    headers = {"Cache-Control": "no-store"}
    try:
        score = float(await run_in_threadpool(lambda: _perth().get_watermark(samples, sample_rate=sr)))
        if score >= 0.5:
            headers["X-Watermark"] = "perth"
    except Exception as e:  # a missing/failed detector means we don't claim a watermark
        log.warning("watermark check failed: %s", type(e).__name__)

    return Response(content=_wav_bytes(samples, sr), media_type="audio/wav", headers=headers)


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    logging.basicConfig(level=logging.INFO)
    os.environ.setdefault("HOST", "127.0.0.1")
    uvicorn.run(app, host=os.environ["HOST"], port=int(os.environ.get("PORT", "8000")))
