# Dokan Saleem

This repository contains the original 36 design exports, their browsable reference catalog, a native Flutter customer app, and a separate web-based store administration portal.

See [stracture.md](./stracture.md) for the project map and migration status.

The customer app and admin portal source now target the local SQL Server API. Flutter analysis/tests, the admin production build, and local API workflow smoke tests pass. This is not a completed production cutover: real Supabase data has not been migrated, the catalog has no real active stock, LAN deployment is not configured, and mobile on-device acceptance tests remain. Supabase remains intact as a rollback source. See [backend/README.md](./backend/README.md) before starting the API.

## Sections

- `01-design-system` — brand cover, design tokens, and components
- `02-customer-app` — customer onboarding, shopping, account, and support screens
- `03-admin-portal` — admin login, store operations, reports, and tablet layout
- `04-user-journeys` — connected user journey reference

## Run

Install Node.js 20.19 or newer (or 22.12 or newer), then run from this folder:

```sh
npm.cmd start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The catalog supports section browsing, screen search, direct links, and in-page previews. To work on the admin portal, configure `admin/.env.local` from `admin/.env.example`, then run:

```sh
npm.cmd run admin:dev
```

Start the API separately from `backend/` after configuring `backend/.env` from `.env.example`. In `admin/.env.local`, set `VITE_DOKAN_API_URL` to the API origin. Open the Vite URL printed in the terminal. Create the first administrator by calling `POST /api/admin/bootstrap` with the one-time bootstrap token, then remove that token from the environment and restart the API. Do not use a SQL Server administrator account to run the network-facing API.

To build the portal for the reference catalog server:

```sh
npm.cmd run admin:build
npm.cmd start
```

Then open [http://127.0.0.1:4173/admin/](http://127.0.0.1:4173/admin/). The admin portal requires a local SQL API administrator. Email-based recovery is not configured; if the admin password is forgotten, use the local recovery script documented in [backend/README.md](./backend/README.md#administrator-password-recovery).

## Flutter customer app

The native customer app, local API configuration, and Android/iOS release prerequisites are documented in [mobile/README.md](./mobile/README.md). The app uses temporary anonymous customer sessions and does not send SMS verification codes; WhatsApp verification is a future integration.

The 36 exports remain visual design references; they are not production catalog data or a connected backend.
