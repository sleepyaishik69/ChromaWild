# Contributing

Thanks for considering a contribution to ChromaWild. Small fixes, accessibility improvements, documentation, and new outdoor subjects are welcome.

## Set up

1. Install Node.js 20.9 or newer and npm.
2. Install Ollama and pull `gemma2:2b` if you want to try generated quests (`ollama pull gemma2:2b`).
3. Copy `.env.example` to `.env.local` and adjust local settings if needed.
4. Run `npm ci`, then `npm run dev`.

## Before opening a pull request

- Keep changes focused and describe the user-facing behavior they affect.
- Run `npm run check` and `npm run build` locally.
- Include clear steps to reproduce a bug or review a UI change.
- Never commit API keys, `.env.local`, personal data, or real user photos.
- For a substantial change, open an issue or discussion first so the approach can be agreed on.

There is no automated test suite at this time. If your contribution adds one, document how to run it.

## Pull requests

Use a descriptive title and explain what changed and why. Add screenshots for visual changes when useful. Keep unrelated formatting or generated-file changes out of the diff.
