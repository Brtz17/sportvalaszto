# Sportválasztó

Sportválasztó is a website I built to solve a real problem: in Hungary, finding a sports club is genuinely difficult — there's no good, centralized, user-friendly place to browse clubs and find one that fits you. This project is my attempt to fix that.

I started working on it last fall and have been developing it in bursts ever since, in HTML, CSS, and vanilla JavaScript, with no frameworks. The backend runs on **Appwrite** (database, authentication, file storage, and serverless functions).

> Note: the website itself is in Hungarian, since it's built for Hungarian users searching for local sports clubs. This README is in English.

## Features

### Club directory & search (main page)

- Loads every club ("csapat") from the Appwrite database, paginating through results automatically so the list isn't capped at a fixed number of entries.
- Displays each club as a card with its logo, name, city, membership fee, and sport tags.
- Free-text search box that filters clubs live by name, email, city, or sport tags as you type.
- A filter panel (opened from a button, closes on outside click, the close button, or Escape) where you can:
  - Select one or more sports
  - Select one or more cities/districts (Budapest entries are automatically split into districts based on postal code)
  - Set a minimum and/or maximum membership fee, with input validation (no negative numbers, min can't exceed max)
- An "active filters" bar shows the currently applied filters as removable chips, plus a "reset all" button.
- All applied filters and the search term are reflected in the URL as query parameters, so a filtered view can be shared or bookmarked, and filters are restored automatically if you load the page with those parameters already in the link.
- Clicking a club card navigates to that club's detail page.

### Club detail page

- Loads a single club's full data from Appwrite based on the `?id=` URL parameter.
- Anonymously tracks page views per club (date, timestamp, anonymized IP with the last octet zeroed out, user agent, and whether the visit came from a shared link), used later for the club owner's statistics dashboard.
- Displays the club's logo, name, sport tags, and any filled-in contact details: email, phone, website, and full address — each with its own icon.
- Clicking a sport tag on the detail page jumps back to the main page pre-filtered by that sport.
- Shows the membership fee if one is set.
- Renders an interactive map (via Leaflet + OpenStreetMap, loaded dynamically only when needed) that geocodes the club's address using the Nominatim API and drops a marker with a popup on it.
- Shows the club's free-text description if one was written.
- "Report" button: opens a modal where visitors can flag incorrect or inappropriate content on a club's page, optionally tied to their logged-in account.
- "Apply as editor" button: opens a modal where someone can request edit access to a club page by submitting their email (with a check to prevent duplicate applications for the same club).

### Authentication

- Email/password signup with client-side password validation (minimum length, requires uppercase, lowercase, and a number, and confirms the two password fields match).
- Email/password login, plus Google OAuth login.
- Automatically detects the current domain so OAuth redirects work correctly in both development and production.
- Show/hide toggle buttons on password fields.
- Appwrite's English error messages are automatically translated into Hungarian — first checked against a hand-written dictionary of common errors, and if there's no match, run through a free machine translation API as a fallback.

### User dashboard

- After login, shows a personalized view listing every club the user is an editor of, plus any clubs where their membership application is still pending (shown separately, marked "pending," and not yet clickable).
- A statistics dashboard renders a line chart (via Chart.js) of daily page views over the last 30 days for each club the user manages.
- A responsive sidebar/hamburger menu that adapts between desktop and mobile layouts, including a small physics-based bouncing ball animation (with squash effect and a different ball graphic each bounce) on the loading screen.

### Club management (create & edit)

- A form to register a new club: name, contact info, full address, membership fee, sport tag selection, and a logo upload.
- Sport selection uses dynamic searchable dropdowns: you can add multiple sport tags, each dropdown lets you type to filter the list, and new empty dropdowns appear automatically as you fill previous ones (with automatic cleanup of unused empty ones).
- Logo upload with validation (file type and a 5MB size limit), preview before submission, and the ability to remove the preview before saving.
- Editing an existing club: the same fields, plus a rich-text description editor and an accordion-style collapsible section for the main details.
- Editor management: club owners can add or remove additional editors by email, and review pending "apply as editor" requests, accepting or rejecting them directly from the edit page.
- Deleting a club (with confirmation), which also cleans up its logo from storage.
- A check against a "banned users" list in the database that blocks registration if the current user has been blocked from creating clubs.

### Account settings

- Update display name.
- Change password (requires current password, validates the new password and confirmation match).
- Permanently delete the account, handled through a serverless Appwrite function, with a confirmation prompt before proceeding.

### Other

- A service worker is registered on every page for offline/caching support (PWA-style behavior).
- Shared utility functions for showing temporary success/error messages, translating error messages, validating uploaded images, and adjusting dropdown positioning so it never overflows the viewport.

## Tech stack

- **Frontend:** HTML, CSS, vanilla JavaScript (no frameworks)
- **Backend/Database:** Appwrite (Database, Authentication, Storage, Functions)
- **Maps:** Leaflet.js + OpenStreetMap tiles, geocoding via Nominatim
- **Charts:** Chart.js
- **Translation:** Google Translate's unofficial endpoint, as a fallback for untranslated error messages

## Use of AI

I used AI tools (e.g. Claude/ChatGPT) selectively during development, specifically when I got stuck. This ranged from asking for help on a specific problem to having entire code sections generated for me. AI assistance was most heavily used during the visual redesign of the site — a large part of the current UI/CSS direction was shaped with AI help. Outside of that, AI use was occasional and targeted, not used to write the project end-to-end.

## Project structure

```
sportvalaszto/
├── index.html          # Main page: club directory, search, filters
├── csapat.html          # Club detail page
├── login.html            # Login page
├── signup.html           # Signup page
├── profile.html           # User dashboard / club management / settings
├── js/
│   ├── csapat.js           # Club detail page logic
│   ├── main.js              # Directory, search & filter logic
│   ├── login.js              # Login logic
│   ├── signup.js              # Signup logic
│   ├── profile.js              # Dashboard, club CRUD, account settings
│   └── lib/appwrite.js          # Appwrite client setup
├── sw.js                # Service worker
└── README.md
```

## Getting started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/sportvalaszto.git
   ```
2. Set up an Appwrite project with the required database, collections, and storage bucket (see `js/lib/appwrite.js` for the expected project/database IDs).
3. Serve the project with any static file server (since it uses ES modules, it can't be opened directly via `file://`).
4. Open `index.html` in your browser.

## Contributing

Contributions are welcome! Fork the repo, create a branch, make your changes, and open a pull request.

## License

This project is licensed under the MIT License.