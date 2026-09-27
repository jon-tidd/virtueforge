// The spoken consent statement. Pure, so the browser shows exactly the text
// the server stores. Wording follows the VoiceCapture mockup (F2, step 1).

//
// Prototype scope (Jon's own voice only). The server checks the exact text,
// the script version and a minimum duration; it does NOT yet check what was
// said. Before any real family (pre-launch, with counsel):
//   - script v2 approved by the privacy lawyer: names the voice vendor(s)
//     (BIPA §15(d)), plus an e-signature and written notice (§15(b));
//   - speech-to-text script match, single-speaker check, and speaker match
//     between consent and samples, with results stored on ConsentRecord.
// See engine-design.md §11 and provider-research.md §4.

export const CONSENT_SCRIPT_VERSION = "consent-v1-2026-09";

/** First name only, as in the mockup ("I'm Ruth, …"). */
export function firstName(ownerName: string): string {
  return ownerName.trim().split(/\s+/)[0] ?? "";
}

export function buildConsentStatement(ownerName: string, childrenPhrase: string): string {
  return (
    `I'm ${firstName(ownerName)}, and I'd like Grit & Grace to make my story voice, ` +
    `only for reading stories to ${childrenPhrase}. I can switch it off whenever I want.`
  );
}

/** The label shown every time the voice plays (feature-plan K6). */
export function voiceLabel(ownerName: string): string {
  return `Made from ${firstName(ownerName)}'s recording, with their permission`;
}

/** The label before a name is typed: never "your's". */
export function voiceLabelPreview(ownerName: string): string {
  return firstName(ownerName) ? voiceLabel(ownerName) : "Made from [your name]'s recording, with their permission";
}

export const CHILDREN_PLACEHOLDER = "[the children's names]";

/**
 * The statement with the children's names replaced by a placeholder, for the
 * deletion receipt. Works on any statement built by buildConsentStatement;
 * returns null if the text doesn't have that shape.
 */
export function redactChildren(statement: string): string | null {
  const m = /^([\s\S]*only for reading stories to )([\s\S]*)(\. I can switch it off whenever I want\.)$/.exec(statement);
  return m ? `${m[1]}${CHILDREN_PLACEHOLDER}${m[3]}` : null;
}
