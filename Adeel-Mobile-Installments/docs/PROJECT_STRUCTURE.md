# Project Structure Verification

## Project boundary

All new application work belongs inside `Adeel-Mobile-Installments/` in the existing
`AdeelMobile/adeelmobile` repository, on the `main` branch.

The repository was inspected read-only before this document was added. The unrelated
legacy project paths at repository root (including `Departments/`, `Testing/`,
`css/`, and `js/`) are outside this project boundary and must remain untouched.

## Verified project layout

The tree below shows the key application paths; empty `.gitkeep` placeholders and their
scaffolding-only subdirectories are omitted for readability.

```text
Adeel-Mobile-Installments/
├── README.md
├── index.html
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── css/
│   ├── main.css
│   ├── dashboard.css
│   └── users.css
├── docs/
│   └── PROJECT_STRUCTURE.md
├── js/
│   ├── components/
│   ├── config/
│   ├── modules/
│   │   ├── admin/
│   │   │   ├── dashboard/dashboard.js
│   │   │   └── users/
│   │   │       ├── create-user.js
│   │   │       └── all-users.js
│   │   └── auth/login.js
│   ├── services/
│   └── utils/
├── pages/
│   ├── login/index.html
│   └── admin/
│       ├── dashboard/index.html
│       └── users/
│           ├── index.html
│           ├── create-user/index.html
│           └── all-users/index.html
└── supabase/
    ├── migrations/
    └── policies/
```

## Directory responsibilities

| Directory | Responsibility |
|---|---|
| `assets/fonts` | Locally hosted font files, if approved/needed |
| `assets/icons` | Project icons |
| `assets/images` | Brand and interface images |
| `css` | Global design tokens and page/module styles |
| `docs` | Architecture, decisions and QA records |
| `js/components` | Reusable UI behavior/components |
| `js/config` | Public client configuration only; never secrets |
| `js/modules` | Page/module-specific behavior |
| `js/services` | Backend/service adapters |
| `js/utils` | Small shared utilities |
| `pages` | Browser entry pages |
| `supabase/migrations` | Reviewed database migrations; do not apply without approval |
| `supabase/policies` | Reviewed access-policy definitions |

## Step 1 verification result

- [x] Dedicated project root exists.
- [x] Application folders are inside the dedicated project root.
- [x] Existing legacy project folders are outside the new project root.
- [x] Current login, dashboard and users page files are inside the new project root.
- [x] No Supabase database changes were made during this inspection.
- [x] No files outside `Adeel-Mobile-Installments/` were changed.

**Result:** Step 1 — Project structure verification is complete based on the GitHub
repository tree inspected on 2026-11-01.

## Change-control rule

Before adding or editing a file, verify that its path starts with
`Adeel-Mobile-Installments/`. Do not move, rename, delete, or overwrite legacy files.
