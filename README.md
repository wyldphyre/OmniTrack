# OmniTrack

A standalone web app for tracking reading progress through omnibus books and their constituent child books.

## What is an Omnibus Book?

An omnibus book is a collected edition containing multiple books from a series, sometimes even the entire series, in a single volume. OmniTrack helps you track your progress through the omnibus while automatically calculating how far you've read into each individual child book.

## Features

- Track multiple omnibus books
- Add child books with series number and start page
- Automatic calculation of child book progress based on omnibus progress
- Progress adjustment with +/- buttons (1% increments)
- Edit and delete omnibus and child books
- Press Enter when adding child books to quickly add another
- Export/import data as JSON for backup
- Data persists to local storage
- Works offline once loaded
- iOS home screen support (PWA)

## Usage

1. Open `index.html` in a web browser
2. Tap the + button to create a new omnibus book
3. Enter the omnibus name and total page count
4. Add child books with their names, series numbers, and start pages (press Enter to add more)
5. Use the +/- buttons to update your reading progress

### Settings

Tap the gear icon in the top right to access settings:

- **Export Data**: Download all your data as a JSON file
- **Import Data**: Restore data from a previously exported JSON file
- **Reset All Data**: Clear all omnibus books (requires confirmation)

### iOS Home Screen Installation

1. Open `index.html` in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will work offline and behave like a native app

## How Progress is Calculated

When you update your progress in the omnibus book, OmniTrack automatically calculates:

- **Pages Read**: Percent completed × total pages
- **Child Book End Page**: Derived from the next child book's start page (or total pages for the last book)
- **Child Book Progress**: Based on how many omnibus pages you've read relative to each child book's page range
