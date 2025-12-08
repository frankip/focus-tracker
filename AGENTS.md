# Repository Guidelines

This project is a Chrome/Chromium extension for tracking focus sessions and rendering dashboard charts. Follow the guidance below to keep contributions consistent and easy to review.

## Project Structure & Module Organization
- Root contains the extension assets; there is no separate build output.
- `manifest.json` defines permissions and entry points.
- `popup.html`, `popup.js`, `popup.css` power the popup UI.
- `dashboard.html`, `dashboard.js`, `dashboard.css`, `chart.js` handle the dashboard view and chart rendering.
- `background.js` manages persistent logic (storage, alarms, messaging).

## Build, Test, and Development Commands
- There is no build step; files run directly in the extension.
- Load for development: open Chrome → `chrome://extensions` → enable Developer Mode → “Load unpacked” → select this folder. Use “Reload” after changes.
- Package for distribution (optional): `zip -r focus-tracker.zip . -x '*.zip'`. Ensure `manifest.json` and icons are included.

## Coding Style & Naming Conventions
- JavaScript is plain ES6; avoid introducing frameworks.
- Prefer small, focused functions; keep DOM selectors and storage keys in constants.
- Naming: functions use `camelCase`; constants use `SCREAMING_SNAKE_CASE`; DOM ids/classes stay kebab-case to match CSS.
- Indentation: 2 spaces; avoid trailing whitespace. Favor early returns over nested conditionals.

## Testing Guidelines
- Automated tests are not present. Validate changes manually in both popup and dashboard:
  - Confirm storage writes/reads across sessions.
  - Verify charts update after new focus entries and that time formatting remains correct.
  - Check extension permissions warnings after manifest changes.

## Commit & Pull Request Guidelines
- Keep commits scoped to a logical change; use imperative commit messages (e.g., `Add chart redraw on storage update`).
- Reference related issues in the commit body or PR description when available.
- PRs should include: summary of changes, manual test notes (browsers/flows covered), and any UI screenshots for popup/dashboard tweaks.

## Security & Configuration Tips
- Limit permissions in `manifest.json` to what is required; call out any new permission in PR notes.
- Guard storage and message payloads against unexpected values; prefer default fallbacks.
- When adding external libraries, document the source and license and avoid remote code execution permissions.
