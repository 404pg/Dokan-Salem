# FROZEN-SCOPE v1

Decisions recorded during the Supabase migration. Frozen = agreed, do not change without an explicit new decision.

## Admin delete strategy (Phase 4)

Delete actions beyond the current `product_compatibility` icon delete are deferred. The Admin portal talks only to the local Node API (`VITE_DOKAN_API_URL`), whose `DELETE /api/admin/data/:table/:id` route is hard-coded to `product_compatibility`. Proper delete support will be added in Phase 4 against Supabase via RLS.

**Owner's intent:** "delete" means **archive / stop showing**, not hard delete. Records should be hidden or deactivated, never permanently destroyed (order/customer history must survive).

**Preferred UX label:** use **«إزالة»** or **«أرشفة»** instead of **«حذف»**, with a short explanation of what happens (e.g. "سيُخفى من التطبيق ويمكن استعادته"). Avoid the word "حذف" for entities that are only archived.

Per-table decisions (to implement in Phase 4, not now):

- **products**: archive / soft delete via `is_active = false` (hide from app, restorable). Label «إزالة من المتجر».
- **categories**: `is_active = false` (archive). Block only if products exist and must be reassigned first (friendly message with count).
- **branches**: archive via `is_active = false` where possible; if already referenced by orders / maintenance, keep the row and just deactivate (never block the owner's ability to stop showing it, but warn that history is retained).
- **delivery_regions**: archive via `is_active = false` (stop offering for new orders); existing orders keep their region.
- **promotions**: archive via `is_active = false` (stop showing). Hard delete only allowed if it has never been shown and has no linked data (leaf table).
- **customers**: deferred to a later phase — needs a `deleted_at` migration on `profiles` + soft delete / archive (never hard-delete a customer with orders). Phone-number change: update the record; keep history.

All Phase 4 delete/archive actions run against Supabase via RLS (`is_store_admin()`); the local Node API delete route is not extended.

## Phase 4.5 — customer identity (RESOLVED — Task 1-A)

Implemented: `profiles.full_name` added; `save_customer_profile` RPC + `create_cod_order` identity upsert; `fetchProfile()` / `saveProfile()` in the repository; `StoreUser.name`/`phone` hydrated on account refresh; Account screen and checkout use `user.name` > `address.recipientName`. Migration: `20261016000500_profiles_identity.sql`. UI-only fallback (b′) shipped earlier in Task 1.

## Deferred — Phase 4.6 (first-launch profile prompt)

Phase 4.6 — First-launch profile prompt: when `user.name == null`, show a dismissible dialog on first launch to capture name+phone (no address). Reuse `_editAddress` layout. Trigger via post-frame callback in `DokanHome`.

## Deferred — Phase 4.7 (customer confirms delivery)

Phase 4.7 — Customer confirms delivery: add a 'استلمت طلبي' button in the customer app's order detail screen. Calls RPC customer_confirm_delivery(order_id). Deferred.
