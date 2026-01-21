# OmniTrack

A standalone web app for tracking reading progress through omnibus books and their constituent child books.

## Project Overview

OmniTrack models omnibus books (collected editions containing multiple books from a series) and calculates reading progress for each child book based on overall omnibus progress.

## Tech Stack

- Single HTML file containing HTML, CSS, and JavaScript
- Local Storage for data persistence
- Must be Progressive Web App (PWA) compatible for iOS home screen installation

## Data Model

### OmnibusBook

| Property | Type | Description |
|----------|------|-------------|
| Name | string | Descriptive name of the omnibus |
| PercentCompleted | number | User-entered progress (0-100) |
| PageCount | number | Total pages in the omnibus |
| PagesRead | calculated | `PercentCompleted * PageCount / 100` |

### ChildBook

| Property | Type | Description |
|----------|------|-------------|
| Name | string | Name of the child book |
| SeriesNumber | number | Position in the series (used for sorting) |
| StartPage | number | First page of this book in the omnibus |
| EndPage | calculated | See calculation below |
| TotalPages | calculated | `EndPage - StartPage + 1` |
| PercentOfBook | calculated | `TotalPages / OmnibusBook.PageCount` |
| PagesRead | calculated | See calculation below |
| PercentRead | calculated | See calculation below |

### Calculated Property Formulas

**ChildBook.EndPage:**
- If last child in omnibus: `OmnibusBook.PageCount`
- Otherwise: `NextChildBook.StartPage - 1`

**ChildBook.PagesRead:**
- If `OmnibusBook.PagesRead >= ChildBook.EndPage`: `ChildBook.TotalPages` (book completed)
- Else if `OmnibusBook.PagesRead < ChildBook.StartPage`: `0` (book not started)
- Else: `OmnibusBook.PagesRead - ChildBook.StartPage + 1` (book in progress)

**ChildBook.PercentRead:**
- If `ChildBook.PagesRead <= 0`: `0`
- Else: `ChildBook.PagesRead / ChildBook.TotalPages`

## UI Requirements

### Main View
- Display all omnibus books as cards
- Each card shows:
  - Omnibus name
  - Progress bar for omnibus completion
  - Plus/minus buttons to adjust PercentCompleted by 1% increments
  - List of child books with individual progress bars

### Omnibus Creation
- Form to enter Name and PageCount
- Ability to add multiple child books during creation (Name, SeriesNumber, StartPage for each)
- First child book assumed to start at page 1

### Child Book Display
- Sorted by SeriesNumber within each omnibus
- Show progress bar linked to PercentRead

### Editing
- Edit omnibus books (Name, PageCount, PercentCompleted)
- Edit child books (Name, SeriesNumber, StartPage)
- Delete omnibus books
- Delete child books

## Behavior

- When PercentCompleted changes on an omnibus:
  1. Recalculate OmnibusBook.PagesRead
  2. Recalculate all child book calculated properties
- All data persisted to Local Storage
- Changes saved automatically

## iOS Home Screen Requirements

- Include appropriate meta tags for web app capability
- Include viewport meta tag for proper mobile display
- App should work offline once loaded
