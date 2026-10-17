# Local SQL Server backend

This folder contains the SQL Server backend and HTTP API for a **local-network-only** deployment. The Flutter app and administration portal use this API; neither client connects directly to SQL Server. Do not use this local-only setup for customers outside the store network.

## Components

- `sqlserver/001_schema.sql`: SQL Server schema for administrator/guest identities, products and image references, categories, inventory, branches, delivery regions, customers, addresses, orders, compatibility, promotions, maintenance, notifications, and store settings.
- `sqlserver/002_seed_store.sql`: illustrative, inactive products/categories plus the 19 active Iraqi governorate delivery options at 5,000 IQD.
- `src/server.js`: API for guest/admin authentication, catalog and store data, customer accounts and addresses, motorcycles, favorites, orders, maintenance requests, notifications, administration, and local image upload.

The schema and illustrative seed are applied to the local SQL Server instance, and both clients have been changed to use this API instead of Supabase. Backend workflow smoke tests, Flutter analysis/tests, and the admin production build pass. This is a **source-code migration, not a production cutover**: existing Supabase data and media have not been migrated, the catalog has no real active stock, and LAN deployment and on-device acceptance testing remain. Keep Supabase intact as the rollback source until those tasks are complete.

## Local setup

1. Install SQL Server Express and the 64-bit ODBC Driver 17 for SQL Server.
2. Apply `sqlserver/001_schema.sql`, then `sqlserver/002_seed_store.sql`. Both scripts are repeatable.
3. Copy `.env.example` to `.env`, set the server's reserved private LAN IP for `PUBLIC_API_URL`, and generate separate random secrets for `JWT_SECRET` and `ADMIN_BOOTSTRAP_TOKEN`. Set a strong initial admin password; do not reuse the password previously shared in chat.
4. The API uses Windows integrated authentication. In an elevated PowerShell window, run `.\scripts\setup-api-service-account.ps1` from `backend/`. It creates or resets the dedicated `DokanApiService` local account, grants it database read/write roles on `DokanSaleem`, and grants it read/execute access to the backend plus modify access to `data/images/`. It does not start the API or expose a firewall port. Do not run the network-facing API as a SQL Server sysadmin.
5. Because the backend is under the interactive user's Desktop, run `.\scripts\grant-api-path-access.ps1` from an elevated PowerShell window as well. It grants the API account read/execute access on `C:\Users\Owner` and its `Desktop` directory only; it does not grant access to other profile files.
6. Copy `.env.example` to `.env` and set a reserved private API address, exact admin origins, and strong independent secrets. Keep `.env` readable only by administrators and the API account.
7. To permit phones on the store LAN to reach the API, create an inbound firewall rule in elevated PowerShell, limited to the local subnet:

   ```powershell
   New-NetFirewallRule -DisplayName 'Dokan Saleem API (Local Subnet)' -Direction Inbound -Protocol TCP -LocalPort 4176 -RemoteAddress LocalSubnet -Profile Any -Action Allow
   ```

   Do not create a Deco port-forwarding rule or expose the API to the internet.
8. Run `.\scripts\start-api.cmd` from an elevated-by-account `runas` session as `DokanApiService`; the command window remains open and displays startup errors:

   ```powershell
   runas /user:PG\DokanApiService "cmd.exe /k C:\Users\Owner\Desktop\Dokan\backend\scripts\start-api.cmd"
   ```
9. Run `.\scripts\bootstrap-admin.ps1` from a separate PowerShell window under the regular administrator account. It prompts for the admin email and a hidden new password, uses the local bootstrap token without displaying it, and removes the token from `.env` after successful account creation. Stop the API with `Ctrl+C` and restart it under `DokanApiService`; once an administrator exists, the API can start without the bootstrap token.
10. Verify `GET /api/health` from the server and another device on the private Wi-Fi, and configure clients with that reserved private API address.

## Administrator password recovery

If the administrator has forgotten the current password, run `node .\scripts\reset-admin-password.js` from `backend/` in an interactive PowerShell or Command Prompt window. It prompts for the administrator email and new password (masked, with confirmation) and updates only the matching administrator row in SQL Server. It requires the current Windows account to have database write permission. Do not pass passwords as command-line arguments or share them in chat.

The SQL Server instance can remain on local shared memory; do not expose its port to customer devices or the public internet. Use a reserved private IP for the API host and allow the API port only on the private store network. If the server is powered off or a client leaves the store network, the local-only app cannot reach the backend.

## Images

Product images belong in the backend's `data/images/` folder and their HTTP paths are stored in `products.image_urls`. The admin upload route limits images to PNG/JPEG/WebP and 5 MB per image. Back up this folder together with the database. Existing Supabase image objects need to be downloaded and copied during cutover; local image URLs will be reachable only while clients are on the same LAN.
