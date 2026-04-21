# 🕴️ erin-runbook

> **Q BRANCH · Records Division**
>
> *"For your eyes only. Also your hands — when something breaks at 2AM and your first thought is 'I wrote this down somewhere, right?'"*

🔴 **DOSSIER:** [`LIVE`](https://erin-runbook.pages.dev) · 🟢 **CLEARANCE:** operator-only · 📡 **TRANSMISSION:** fresh

---

## 🎯 The mission

Every homelab has failure modes. Every operator forgets the fix at 2AM. This is the cure — a searchable archive of every procedure that keeps the rack humming, written for the future-me who'll need it when DNS is suddenly pointing at a VPN that expired six months ago and the kids' Disney+ stopped working.

Because the operator who **built** a thing is not the same operator who has to **fix** it at 3AM with one hand, a cup of cold coffee, and a child standing in the doorway asking why *Bluey* is "broken."

## 🗂️ The file system

| Asset | Visibility | Purpose |
|---|---|---|
| 🌐 `erin-runbook` (this) | Public | The themed reader |
| 🔒 `erin-runbook-data` | Private | The actual procedures |
| ⚡ Cloudflare Pages | Public | Runtime |
| 🔑 PAT → CF secret | Edge-only | Proxy authorization |

## 🧰 Stack

- 🔥 Cloudflare Pages — static + Pages Functions
- 📝 GitHub Contents API — markdown as the database
- ⚙️ GitHub Actions — auto-deploy every push to `main`
- 🎭 Zero frameworks. Zero build step. Zero patience for 2AM debugging.

## 🤐 Clearance

Viewer-side: public. Dossier content: *not.* If you can read the actual procedures, we need to have a conversation.

## 🌐 Related ops

- 🏢 [xconsultingwork.com](https://xconsultingwork.com) — how rent happens
- 🧪 [cf-examples.pages.dev](https://cf-examples.pages.dev) — what I build when nobody's paying me to

---

*🍸 Shaken, not AGPL-ed. UI is MIT. Dossier is operator-proprietary.*
