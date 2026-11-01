# Phase 1 — Foundation QA

Date: 2026-11-01  
Repository: `AdeelMobile/adeelmobile`  
Project boundary: `Adeel-Mobile-Installments/`  
Test branch/commit: `main` / `31e8f9f`  
Live test project: `adeelmobile-admin`

## Repository/static checks

| Step | Scope | Result | Evidence |
|---:|---|---|---|
| 1 | Independent project structure | PASS | Project tree inspected; work remains inside `Adeel-Mobile-Installments/` |
| 2 | Root entry and login preview | PASS | Android browser opened the root URL and displayed the safe sign-in preview |
| 3 | Admin dashboard route | PASS | Android browser displayed the safe sign-in preview after opening the dashboard route |
| 4 | Create User route | PASS | Android browser displayed the safe sign-in preview; unfinished form was not exposed |
| 5 | All Users route | PASS | Android browser displayed the safe sign-in preview |
| 6 | Mobile vertical scrolling | PASS | User confirmed page scrolls up/down |
| 7 | Horizontal overflow | PASS | User confirmed page does not move left/right |
| 8 | Text readability | PASS WITH NOTE | User confirmed text is readable; font feels slightly small and is deferred to the final UI Control Panel phase |

## Live URLs tested by user

- `https://adeelmobile-admin.pages.dev/`
- `https://adeelmobile-admin.pages.dev/pages/admin/dashboard/`
- `https://adeelmobile-admin.pages.dev/pages/admin/users/create-user/`
- `https://adeelmobile-admin.pages.dev/pages/admin/users/all-users/`

All four URLs displayed the expected safe sign-in information preview.

## Deployment evidence

- Cloudflare project: `adeelmobile-admin`
- Production branch: `main`
- Commit: `31e8f9f`
- Cloudflare deployment ID: `206c3ffb-2144-4019-a722-85ced3dc21ea`
- Deployment URL: `https://206c3ffb.adeelmobile-admin.pages.dev`
- User-confirmed deployment status: SUCCESS
- User-confirmed stable domain: `https://adeelmobile-admin.pages.dev`

## Security review status

- The earlier `adeelmobile-installments.pages.dev` domain was reported by Google Search Console for **Deceptive pages**.
- The user submitted a Google Search Console review request after the cleanup.
- Google's final decision has not yet been reported in this QA record.
- The new `adeelmobile-admin.pages.dev` URL loaded the safe preview during the user's tests. This does not replace Google's review/clearance for the older domain.
- Never ask the user to bypass a Chrome Dangerous Site interstitial or enter credentials while a warning is shown.
- The admin `_redirects` rule is temporary route hiding only; it is not server-side authentication or authorization.

## Remaining Phase 1 checks

- Google Search Console/Safe Browsing review decision for the older flagged domain.
- If Google still reports the old domain as unsafe, keep Phase 1 blocked until Google resolves it.
- Additional desktop/wide-screen and browser back/refresh checks can be included in the final regression pass if needed.

## Phase 1 status

**Manual Android checks reported by the user: PASS for the four tested routes, vertical scroll, no horizontal overflow, and readable text.**

**Overall Phase 1: BLOCKED / NOT PASS / NOT FROZEN** while the Google security review remains pending. Do not represent the new testing URL as clearance for the old flagged domain.

## Security remediation history

- Removed the public preview username/password form and its unused client-side handler.
- Replaced all four unfinished public admin HTML previews with information-only notices and added `noindex, nofollow`.
- Removed the unused user-creation form script.
- Kept the temporary `_redirects` rule for `/pages/admin/*`.
- No Supabase schema, records, storage, RLS policies, Auth users, or Auth settings were changed during Phase 1.
