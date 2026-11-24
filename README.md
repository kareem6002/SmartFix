# SmartFix 🛠️
Home maintenance & technician booking platform — DEPI React Frontend Web Developer capstone.

**Stack:** React 18 · TypeScript · Vite · Bootstrap 5 · React Router · Node.js · Express · MongoDB (Mongoose) · JWT · Zod · Vitest · Docker · GitHub Actions

## Run with Docker
    node setup.mjs            # first run only: creates .env with generated secrets
    docker compose up --build
App: http://localhost:5173 · API: http://localhost:4000/api · Admin: `admin@smartfix.com` with the generated ADMIN_PASSWORD in your `.env` (see "Running with Docker" below)

## Run locally
    cd server && npm i && npm run dev     # needs MongoDB on :27017
    cd client && npm i && npm run dev
    npm test                              # in server/ and client/

## What's included
| Area | Implemented |
|---|---|
| Auth | Register/login, bcrypt, JWT, role guards (customer/technician/admin) on API and routes |
| Customer | Browse categories & technicians, filter, request + booking, cancel, track status, rate/review |
| Technician | Profile at signup, accept/reject, status flow (accepted → in progress → completed) |
| Admin | Stats, activate/deactivate users, category CRUD, all bookings |
| Extras | Photo attachments on requests (viewable by the assigned technician), 🚨 emergency requests sorted first, double-booking prevention, status state machine, Zod validation, CI, auto-seeded categories |

## API (summary)
`POST /auth/register|login` · `GET/PUT /me` · `GET /categories` (admin: POST/PUT/DELETE) · `GET /technicians?category=` · `POST /requests` · `GET /requests` · `GET /requests/:id/photos` · `PATCH /requests/:id/status` · `POST /reviews` · `GET /admin/stats|users|requests` · `PATCH /admin/users/:id/active`

## Roadmap (Priority 2)
Photo upload (multer), real-time chat (Socket.io), notifications, cost estimates, LLM-based classification, technician availability slots, Kubernetes manifests.


## Languages & the comic guide
- **English / العربية** switch is in the top bar (also on the login screens). The choice is remembered, the page flips to right-to-left for Arabic, and Bootstrap swaps to its RTL build.
- All text lives in `client/src/i18n/en.ts` and `ar.ts` (Arabic is type-checked against English, and `npm test` fails if a key or `{placeholder}` is missing). Server error messages are mapped to translations in `i18n/core.ts`.
- **Comic guide**: after every login/sign-up each role (customer, technician, admin) sees 3 comic pages explaining the buttons, with **Skip** and "Don't show this again". It can be replayed from the profile photo menu → *Quick guide*. The story is data in `client/src/comic/story.ts`; character art is in `client/public/comic/`.

## Photos on the New request page
Customers can attach up to 3 photos of the problem to a request (compressed in the browser before upload). They are stored on the request and the assigned technician (or an admin) can view them on demand via `GET /api/requests/:id/photos`. Photo validation shared by requests and portfolios lives in `server/src/photos.ts` (tests in `photos.test.ts`). The customer always picks the service category themselves.

## Roles, engineers and companies
SmartFix has five kinds of accounts: **customer, technician, engineer, company, admin** (admins are created by the owner; everyone else signs up from the first screen).

**Who works under whom:** a *company* employs *engineers*, and an *engineer* leads *technicians*. Everyone works **alone by default**.
- An engineer opens **My team**, enters a technician's email and sends an invitation; a company does the same with engineers under **Our engineers**.
- Nothing changes until the invited person accepts (Profile -> *Where I work* -> Accept). Accepting replaces their previous employer. They can leave at any time ("Leave and work alone"), and engineers/companies can remove members.
- A technician's profile says *Working alone*, *Working with Eng. X*, and - if that engineer works in a company - *Under company: Y*. An engineer's profile says *Working alone* or *Working in company: Y*. Customers see the same badges on technician cards.
- Code: `server/src/team.ts` (rules + tests in `team.test.ts`), routes `GET/POST /api/team...`, `GET /api/invites`, `POST /api/invites/:id/accept|decline`, `DELETE /api/me/employer`.

Demo accounts (password `demo123`): `company@smartfix.com` (Al Noor Contracting) -> `engineer@smartfix.com` (Tarek Salem) -> technicians `ahmed@smartfix.com` and `omar@smartfix.com`; `layla@smartfix.com` is an engineer working alone.


## First screen (lobby)
Logged-out visitors land on a full-screen photo of the SmartFix lobby (`client/public/art/lobby.webp`) with only an **Enter** button.
Enter zooms the camera onto the receptionist, who greets you in a speech bubble; then a tablet rises where you swipe through the four
sign-up roles (customer, technician, engineer, company) and tap one to reach its login page. Admins use the small "Admin sign in" link on the tablet.
Code: `client/src/pages/Lobby.tsx` + `lobby.css`. To re-aim the zoom, change `FACE_X/FACE_Y` at the top of `Lobby.tsx`.


## Running with Docker
1. Run `node setup.mjs` once. It creates `.env` (from `.env.example`) with a freshly generated `JWT_SECRET` and `ADMIN_PASSWORD`. Secrets are only written to `.env`, never printed. Re-running it never overwrites values you already set.
2. Optional: edit `.env` and set `SEED_DEMO=true` for local demo accounts (password `demo123`; never use in public).
3. `docker compose up --build`
4. The admin account `admin@smartfix.com` is created on first start with the `ADMIN_PASSWORD` from your `.env`. There is no shared default password. If the database already has an admin, its password is unchanged.
5. For a hosted deployment, set `VITE_API_URL` in `.env` to the public API URL before building (it is baked into the client build; rebuild after changing it).
6. Existing databases: seeding never deletes or changes existing users. If you ran an earlier version, the old `admin123` admin and `demo123` demo accounts are still in the `mongo-data` volume. Change those passwords, or reset with `docker compose down -v` (this deletes ALL data).

No Docker? The same `node setup.mjs` + `cd server && npm i && npm run dev` + `cd client && npm i && npm run dev` works with a local MongoDB on :27017.
