# Dokan Saleem — project structure and work log

## What this project contains

Dokan Saleem is an Arabic, right-to-left motorcycle-parts store project. It includes the original design exports, a Flutter customer app, a separate web administration portal, and a local SQL Server/API migration. The earlier Supabase project remains intact as a rollback source.

## Project layout

| Path | Purpose |
| --- | --- |
| `01-design-system/` | Brand, design tokens, and reusable component design references. |
| `02-customer-app/` | Customer-flow design references for browsing, checkout, account, and support. |
| `03-admin-portal/` | Administration-flow design references. |
| `04-user-journeys/` | User-journey design references. |
| `mobile/lib/` | Flutter customer application source. |
| `mobile/assets/catalog/` | Original illustrative product SVGs and PNGs. These are not photographs of real products. |
| `mobile/supabase/migrations/` | Historical PostgreSQL schema, access policies, and order/guest-checkout functions for the retained Supabase project. |
| `mobile/supabase/seeds/` | Historical illustrative catalog and nationwide delivery seeds. |
| `admin/src/` | Web administration application source. |
| `admin/` | Admin portal configuration and build files. |
| `backend/` | Local-network SQL Server database and API used by the Flutter and admin clients. |

The design exports are references, not live catalog or backend records.

## Implemented application behavior

- The Flutter app uses Arabic RTL screens for product browsing, cart, checkout, customer addresses, order history, maintenance requests, and related store flows. The current source uses the local HTTP API and persists guest bearer sessions on the device.
- The customer flow uses temporary guest sessions. It does not send SMS verification codes. Phone numbers are collected for order contact only; WhatsApp verification is not implemented.
- Cash on delivery is the implemented payment method.
- The local SQL Server schema stores catalog, customer data, orders, delivery regions, branches, inventory, promotions, maintenance, and notifications. The API enforces guest/admin authorization and performs checkout and cancellation transactions.
- The admin portal source uses the local API for administrator login, store-management pages, and password changes.
- The application loads active catalog items, categories, and delivery regions from SQL Server. Product availability for ordering depends on active-branch inventory.

## Supabase rollback data

- The store-core and guest-checkout PostgreSQL migrations remain applied to the configured Supabase project.
- Anonymous sign-in was enabled; SMS sign-in is disabled.
- The `catalog-draft-images` bucket and eight illustrative product images remain in Supabase.
- Four inactive category drafts and eight inactive product drafts remain in Supabase. No stock was invented.
- The historical delivery seed contains one active “كافة المناطق” option for each of Iraq's 19 governorates at 5,000 IQD.
- These cloud rows have not been migrated or removed. They are not automatically synchronized with SQL Server.

## Seed files

Run these scripts in the Supabase SQL Editor only after the store-core and guest-checkout migrations have been applied:

- `mobile/supabase/seeds/catalog_drafts.sql` inserts the illustrative draft catalog. Prices are estimates, not verified market quotes.
- `mobile/supabase/seeds/iraq_nationwide_delivery.sql` adds or updates the flat-rate governorate delivery options. The upsert can be rerun safely.

Review actual supplier prices, brands, part numbers, motorcycle compatibility, delivery coverage, and stock before publishing any catalog item or accepting orders for a location the store cannot serve.

## Running and validating

From the repository root, use Node.js 20.19+ (or 22.12+) to run the design catalog and admin scripts. The root `README.md` documents those commands.

From `mobile/`, pass the store API URL with `--dart-define=API_BASE_URL=http://192.168.68.107:4176` when running or building. See `mobile/README.md` for the exact commands and Android/iOS release requirements.

The latest validation completed with `flutter analyze` reporting no issues and all Flutter tests passing. A refreshed debug APK is at `mobile/build/app/outputs/flutter-apk/app-debug.apk`; it is for development/testing only. A Play Store Android release requires a privately held upload key and a signed App Bundle. An iOS archive requires macOS, Xcode, and Apple Developer signing. Neither store-publishable release has been produced as part of this work.

## Local SQL Server migration status

- The user selected local-network-only operation. SQL Server Express 2022, SSMS, and Sqlcmd tools are installed; the SQL Server service is running.
- `backend/sqlserver/001_schema.sql` and `002_seed_store.sql` have been applied using local Windows-authenticated ODBC. SQL Server verification returned four inactive categories, eight inactive illustrative products, and 19 active 5,000 IQD delivery regions. There are no branches or stock rows; one administrator account exists.
- `backend/scripts/setup-api-service-account.ps1` created and verified the dedicated local Windows API account with database read/write access and limited filesystem permissions. It does not start the API or open the firewall.
- The Deco DHCP reservation is verified: the server currently has `192.168.68.107`. A local `backend/.env` with independently generated secrets is configured and ACL-restricted; it is ignored by Git and its values must not be shared. The API is listening under `DokanApiService`; the API-only firewall rule allows `LocalSubnet` only.
- Eight illustrative PNGs are copied into the ignored `backend/data/images/` folder.
- The Node API uses Windows integrated authentication through the installed 64-bit ODBC Driver 17. API health has been verified via both localhost and the reserved LAN address; SQL Server reports connected and one administrator account exists. The one-time bootstrap token was removed from `.env`, but the API process started before bootstrap and has not yet been restarted; restart it to clear the token from process memory.
- Flutter and admin source use the local API. `flutter analyze`, all Flutter tests, and `npm run admin:build` pass. Admin API workflows have been smoke-tested; the production portal bundle points to the reserved LAN API address. The administration portal uses the requested original `logo.jpg`.
- A fresh debug APK was built against `http://192.168.68.107:4176`. It is for local testing only and has not been installed or tested on a physical Android device.
- The API must run under a dedicated, non-administrator Windows account with database read/write permissions only. The current interactive SQL login is a sysadmin; do not expose an API process running under that identity to the LAN.
- The SQL database and image directory are local only. SQL Server network protocols remain disabled; clients connect only to the HTTP API. A dedicated API port should be allowed only on the store's private network.
- No Supabase production data or image objects have been migrated. Keep Supabase intact until row counts, user/order relationships, media, backups, and all client flows have been reconciled.

Remaining cutover work:

1. Restart the API under `DokanApiService` after bootstrap so the removed bootstrap token is cleared from memory.
2. Sign into the admin portal with the administrator's locally stored credentials; test API health and customer workflows from a phone on the Deco Wi-Fi. Do not create a router port-forwarding rule.
3. Add actual branches, products, supplier-verified prices, compatibility, and stock. Do not publish the illustrative draft rows.
4. Complete mobile on-device acceptance testing and backup/restore verification; repeat API/admin/mobile end-to-end checks after entering production data.
5. Migrate and reconcile any live Supabase data and image objects that should be retained. Supabase data is currently untouched.
6. Build a signed Android App Bundle after creating the publisher's upload key; create and sign the iOS archive on macOS. The current APK is a debug-only install for local testing.
7. Keep the old Supabase setup available until the local deployment passes acceptance checks. Local-only operation will not work outside the store network.

## Final delivery notes (2026-10-15)

- `deliverables/Dokan-Saleem-Android-debug.apk` is the refreshed Android test build configured for the reserved LAN API URL. It is not a Google Play release.
- `deliverables/Dokan-Saleem-source.zip` contains the project source, excludes generated build/dependency folders, local environment files, and signing keys, and includes the refreshed Flutter logo source.
- `deliverables/admin-portal/` contains the rebuilt local-network administration portal. It is configured for the store API and must not be exposed to the public internet.
- `admin/dist/` contains the rebuilt administration portal, configured through the local, ignored `admin/.env.local`; do not publish its LAN-only HTTP bundle on the public internet.
- The requested design-system `logo.jpg` is used by the administration UI, the Flutter app, and the regenerated Android launcher icon.
- The API is reachable on `192.168.68.107:4176`, SQL Server health reports connected, the store admin exists, and the bootstrap token has been removed from the environment file. Restart the running API once so the in-memory bootstrap token is also cleared.
- The SQL database currently has four categories and eight illustrative products; none are active. There are no branches or inventory records. The 19 governorate delivery rows cost 5,000 IQD each.
- `flutter analyze`, `flutter test` (3 tests), and `npm run admin:build` completed successfully for this delivery. Real-phone install, checkout, LAN roaming/reconnect, and admin operations have not been accepted on physical devices.

## Missing before production / app-store release

1. Restart API after bootstrap, verify login and change/store the admin password securely. Configure a reliable automatic startup/recovery mechanism for the API instead of relying on an interactive `runas` window.
2. Populate and verify real branch, catalog, stock, compatibility, pricing, delivery coverage, contact details, and actual product photographs. No customer should be offered the illustrative, inactive catalog.
3. Decide which customer, order, catalog, and image records from Supabase must be retained; migrate and reconcile them. Supabase remains unchanged and is not synchronized with SQL Server.
4. Install the APK on real Android phones on the Deco LAN, verify address/network permissions and the complete customer/admin workflows, and test offline behavior, API restarts, backup, and restore. A debug APK was built, but not device-tested.
5. Create a publisher-owned upload keystore, secure it outside the project, configure release signing, and produce/test a signed `.aab`. No store-signed Android artifact is included.
6. Build, sign, and test an iOS archive on macOS with Xcode and an Apple Developer account. This Windows project environment has not produced an iOS release.
7. The backend is local HTTP without TLS and only reachable on the store LAN. Do not use it over public Wi-Fi or the public internet; external access requires a separate HTTPS/VPN deployment and security review.
8. SMS verification, WhatsApp verification, push notifications (FCM/APNs), and email/password recovery are not integrated. The local password reset helper requires trusted server access.
9. Define and publish privacy policy, terms, data retention, backup ownership, incident response, and store-support procedures before accepting real customer data or submitting to stores.
10. The current un-split debug APK is large and is intended only for local testing; use a signed App Bundle for distribution and test its generated delivery variants.

## Security and release reminders

- Never put SQL Server passwords, JWT/bootstrap secrets, or signing-key passwords in Flutter assets, the admin bundle, or source control.
- The admin password previously shared in conversation should be changed immediately and never reused.
- Guest sessions are device-scoped and can be lost if app data is removed. Add abuse controls and complete privacy/legal and operational checks before public launch.
- SMS is disabled; WhatsApp, push notifications, and verified phone ownership are not implemented.
