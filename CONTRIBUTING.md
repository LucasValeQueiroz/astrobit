# Contributing to AstroBit

Contributions are welcome!

## Development Workflow
1. Fork or branch from `main`.
2. Keep `src/engine/` 100% pure and free of DOM/browser globals so every rule stays fast and testable in Node.
3. Run the full test suite before opening a PR:
   ```bash
   node --test tests/*.test.mjs
   ```
4. Open a concise Pull Request describing what changed and how it was verified.
