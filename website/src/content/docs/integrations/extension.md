---
title: Browser Extension
description: Using the Designer Mode Chrome extension
---

The browser extension lets you use Designer Mode on any website — no build tool changes needed.

## Install

1. Clone the repo and build:
   ```bash
   cd packages/extension
   pnpm install && pnpm build
   ```

2. Open Chrome → `chrome://extensions`

3. Enable **Developer mode**

4. Click **Load unpacked** → select `packages/extension/dist`

## Usage

1. Navigate to any page
2. Click the Designer Mode icon in the toolbar
3. Click **Activate** in the popup
4. Click any element on the page to inspect it

## Settings

Click **Settings** in the popup to configure:

- **Relay Host** — default `127.0.0.1`
- **Relay Port** — default `3334`
- **Auto-activate** — automatically enable on all pages

## How It Works

The extension injects a content script that:
1. Auto-detects the framework (React, Vue, or falls back to vanilla)
2. Initializes the Designer Mode panel
3. Communicates with the popup for activation state

The extension uses Manifest V3 and requires the `storage`, `activeTab`, and `scripting` permissions.
