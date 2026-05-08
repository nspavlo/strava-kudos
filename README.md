# Project Title

![Icon](images/icon128.png)

## Description

This project is a browser extension that enhances the Strava experience by adding a "Kudo All" button and highlighting the next and previous kudo buttons. It helps users quickly give kudos to multiple activities without having to click each one individually.

## Features

- **Kudo All Button**: Adds a button to give kudos to all visible activities with a single click.
- **Excludes Own Activities**: Automatically excludes the user's own activities from being kudoed.
- **Rate Limiting**: Ensures that kudos are given at a controlled rate to avoid hitting rate limits.
- **Debug Menu**: Provides a debug menu with options to trigger notifications, highlight kudo buttons, and remove all kudos.

## Development

Install dependencies:

```bash
npm install
```

Format code:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

Run linter:

```bash
npm run lint
```

Auto-fix lint issues:

```bash
npm run lint:fix
```

## Load in Chrome (Unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select this project folder (`strava-kudos`).
5. Open Strava and test the extension on your feed.
