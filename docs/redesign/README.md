# Grit & Grace redesign (work in progress)

Planning, research and mockups for the Grit & Grace redesign. Nothing in this folder is used by the live site.

## Start here

- **Live mockup (62 screens, clickable):** https://claude.ai/artifact/VFzzJNTnkhvaLpmZjon3E4 (private to Jon until shared)
- **`feature-plan.md`**: every feature, why it exists, screen inventory and phasing.

## Folders

| Folder | What's in it |
| --- | --- |
| `research/` | Deep-research prompt, the full research report, and the condensed findings. |
| `canvas/project/` | Source of the mockup canvas: `canvas.json` (layout and the "why" notes) plus one `.dc.html` file per screen. |
| `canvas/assets/` | Illustrations used on the canvas (hero, kids' portraits, virtue images). |
| `mockup-images/` | Earlier static mockups as JPGs (options A/B/C, full site, product loops). |
| `early-mockups/` | HTML source for those earlier static mockups. |

## Status

- Nothing here is approved or built yet. The live site on `main` is unchanged.
- Backup of production before this work: branch `backup/main-2026-09-26`.
- The auto-merge workflow (`.github/workflows/auto-merge-claude.yml`) was removed on this branch, so pushes to `claude/*` branches never merge into `main` automatically.
