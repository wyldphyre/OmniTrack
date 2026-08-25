# OmniTrack

A standalone web app for tracking reading progress through omnibus books and their constituent child books.

## Project Overview

OmniTrack models omnibus books (collected editions containing multiple books from a series) and calculates reading progress for each child book based on overall omnibus progress.

## Tech Stack

- Single HTML file (`index.html`) containing HTML, CSS, and JavaScript
- `sw.js` service worker for offline caching and PWA update support
- Local Storage for data persistence
- PWA compatible for iOS home screen installation

## Project Structure

```
OmniTrack/
├── index.html      # Complete app (HTML, CSS, JS)
├── sw.js           # Service worker (offline cache, PWA updates)
├── manifest.json   # Web app manifest (Android/desktop installability)
├── icon.svg        # Manifest icon (the runtime canvas icon covers iOS/favicon)
├── README.md       # User documentation
├── LICENSE         # MIT license
└── claude.md       # This file - project context for AI assistants
```

`manifest.json` and `icon.svg` must be deployed alongside `index.html` and `sw.js`.

## Version

Current version: 1.0.14

## Data Model

### OmnibusBook (stored in localStorage)

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier |
| name | string | Descriptive name of the omnibus |
| percentCompleted | number | User-entered progress (0-100) |
| pageCount | number | Total pages in the omnibus |
| books | array | Array of ChildBook objects |

### ChildBook

| Property | Type | Description |
|----------|------|-------------|
| name | string | Name of the child book |
| seriesNumber | number | Position in the series (used for sorting) |
| startPage | number | First page of this book in the omnibus |

### Calculated Properties (computed at render time)

**OmnibusBook.pagesRead:** `round(percentCompleted * pageCount / 100)`

**ChildBook.endPage:**
- If last child in omnibus: `OmnibusBook.pageCount`
- Otherwise: `NextChildBook.startPage - 1`

**ChildBook.totalPages:** `endPage - startPage + 1`

**ChildBook.percentOfBook:** `totalPages / OmnibusBook.pageCount`

**ChildBook.pagesRead:**
- If `OmnibusBook.pagesRead >= ChildBook.endPage`: `ChildBook.totalPages` (completed)
- Else if `OmnibusBook.pagesRead < ChildBook.startPage`: `0` (not started)
- Else: `OmnibusBook.pagesRead - ChildBook.startPage + 1` (in progress)

**ChildBook.percentRead:**
- If `ChildBook.pagesRead <= 0` or `ChildBook.totalPages <= 0`: `0`
- Else: `ChildBook.pagesRead / ChildBook.totalPages`, capped at 100%

All child-book maths is clamped so a malformed record can never produce a
negative, NaN, or out-of-range value in the UI.

## Key Functions

- `loadData()` / `saveData()` - localStorage persistence. `loadData()` validates
  stored records with `isValidOmnibus` and skips (but never erases) malformed
  ones; `saveData()` returns `false` when storage rejects the write.
- `commitChange(mutate)` - runs a mutation, persists it, and rolls the in-memory
  state back if the save failed, so the UI never shows an unsaved change.
  Returns whether the change stuck. All mutating paths go through it except
  `adjustProgress`, which rolls back inline to keep its in-place DOM update.
- `isValidOmnibus(o)` / `isValidOmnibusArray(data)` - shape validation shared by
  the import and load paths
- `validateChildPages(books, pageCount)` - enforces unique series numbers and
  strictly increasing start pages within the page count
- `calculatePagesRead(omnibus)` - calculates pages read from percent
- `calculateChildBookProperties(omnibus)` - computes all child book derived values
- `render()` - renders all omnibus cards to DOM
- `updateOmnibusCard(omnibus)` / `findCard(id)` - update one card's figures in
  place. Cards carry `data-id`. Re-rendering via `innerHTML` would insert fresh
  nodes at their final size, so the progress-bar transition would never run.
- `toggleCollapse(id)` - toggles classes on the live nodes (same reason) and
  measures the panel before expanding so max-height animates from 0
- `adjustProgress(id, increment)` - +/- button handler
- `showCreateSheet()` / `editOmnibus(id)` - sheet management
- `addChildBookForm(name, seriesNumber, startPage, focusName)` - dynamically adds
  child book input fields (Enter key adds another). `focusName` defaults to true
  but is false when pre-filling the edit sheet, so focus isn't stolen.
- `exportData()` - JSON export of the full OmniTrack backup
- `routeImport(data)` - both import buttons route here: an array is treated as a
  full backup (replaces all data, after confirmation), anything else as a single
  ebook-derived omnibus (appended)
- `importData()` / `handleImport()` and `importOmnibusFile()` / `handleOmnibusImport()`
  - file-picker entry points for the settings row and the toolbar button
- `resetData()` - clears all data (with confirmation)
- `playCompletionChime()` - two-note chime synthesized with the Web Audio API
  (no audio file to ship or cache). Only `adjustProgress` fires it, and only
  when a child book crosses to 100% on a change that saved: that handler runs
  from the button's click, which is the user gesture iOS requires before it will
  play anything. Every audio failure is swallowed so it can never interfere with
  recording progress. iOS silences Web Audio when the ring/silent switch is set
  to silent, so the chime is a bonus cue, not a dependable signal.
- `completedChildCount(omnibus)` - how many child books are finished, compared
  before and after a progress change to detect a completion
- `toggleSound()` / `renderSoundToggle()` / `loadSoundSetting()` - the Completion
  Chime setting. Enabling it plays a preview, which also unlocks the audio
  context on iOS.

## Omnibus Import Format

JSON files produced by the companion ebook reader app can be imported via "Import Book" in settings:

```json
{
  "omnibus_title": "string",
  "total_pages": number,
  "page_count_method": "string (informational, ignored)",
  "child_books": [
    { "title": "string", "start_page": number }
  ]
}
```

`seriesNumber` is assigned from array order (1-based). `percentCompleted` defaults to 0.

## UI Components

- **Main view**: List of omnibus cards with progress bars, gear icon for settings
- **Omnibus modal**: Create/edit omnibus with inline child book forms
- **Child modal**: Edit individual child book
- **Confirm modal**: Delete/reset confirmation dialog
- **Settings modal**: Export, import, Completion Chime toggle, and reset data options

## Service Worker Notes

- The page reloads on `controllerchange` only if it was already controlled, so a
  first visit doesn't load twice. A reload arriving while a sheet is open is
  deferred until the sheet closes, so it can't discard in-progress input.
- The fetch handler ignores non-GET requests (`cache.put` rejects on them) and
  falls back to the app shell, then to a synthesized 503, so `respondWith()` is
  never handed `undefined`.
- Bump `CACHE_NAME` in `sw.js` whenever the app version changes.

## localStorage

Data stored under key `omnitrack_data` as JSON array of OmnibusBook objects.
Collapse state is stored under `omnitrack_ui_state`, and the Completion Chime
setting under `omnitrack_sound` (`'on'` / `'off'`, defaulting to on).

## Export Format

Exported JSON filename: `omnitrack-export-YYYY-MM-DDTHH-MM-SS.json`

The export contains the raw `omnibusBooks` array, which can be re-imported to restore data.
