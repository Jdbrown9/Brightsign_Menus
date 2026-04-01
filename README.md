# Catering Menu Manager for BrightSign

This version is designed for nontechnical staff.

## Staff workflow

1. Open the website
2. Edit item names or prices
3. Click **Publish Changes**
4. Done

If publishing is not configured on that computer, staff can click **Download Update Package** and send the file to the admin.

## What this project includes

- simple staff-facing menu editor
- one RSS feed per item
- copy button for each feed URL
- hidden admin setup area
- optional one-click GitHub publishing
- fallback export package

## Important note

GitHub Pages is static hosting, so it cannot update public feed files by itself. This project solves that in one of two ways:

### Option A
Admin sets up GitHub token once on a dedicated computer. Staff then just click **Publish Changes**.

### Option B
Staff click **Download Update Package**, and an admin uploads the generated file contents to GitHub using a helper workflow.

## Recommended real-world use

If this will live on one office computer or one tablet browser, have an admin fill in:

- GitHub owner
- repo name
- branch
- site base URL
- GitHub token

After that, staff only need the top section of the page.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `menu.json`
- `feeds/*.xml`
- `.nojekyll`
