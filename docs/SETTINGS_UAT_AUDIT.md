# Settings Module – UAT Audit Report

**Date:** March 8, 2025  
**Scope:** End-to-end testing of Settings (User Management, Notification Preferences).

---

## Routes Audited

| Route | Status | Notes |
|-------|--------|------|
| `/settings/users` | ✅ | User list (admin only), Invite, Edit, filters, Deactivate, Resend invite, Entity column |
| `/settings/notifications` | ✅ | Notification types by category, Email/In-app toggles, Save with success message |

---

## 1. List of All Bugs Found and Fixes Applied

### Bug 1 – User Management: Non-admin saw empty list instead of access denied
- **Location:** `src/app/settings/users/page.tsx`
- **Description:** When a non-admin called GET /api/settings/users, the API returned 403 but the page did not show an access-denied message.
- **Fix applied:** On 403, set `accessDenied` state and render an “Access denied” message: “Only admins can access User Management.”

### Bug 2 – User Management: Table missing Entity column
- **Location:** `src/app/settings/users/page.tsx`
- **Description:** Audit required Entity (US/India) in the users table.
- **Fix applied:** Added “Entity” column; display `user.entity` (uppercase) or “—”. API already returned `entity`.

### Bug 3 – User Management: No filter by role, entity, or status
- **Location:** `src/app/api/settings/users/route.ts`, `src/app/settings/users/page.tsx`
- **Description:** Users list could not be filtered.
- **Fix applied:** GET `/api/settings/users` accepts query params `role`, `entity`, `status`. Page has three dropdowns (All roles, All entities, All statuses) and refetches when they change.

### Bug 4 – User Management: No Deactivate button
- **Location:** `src/app/settings/users/page.tsx`
- **Description:** No way to deactivate a user from the list.
- **Fix applied:** Added “Deactivate” button per row (hidden for current user and already inactive). On confirm, PATCH `active: false`, `status: 'inactive'`. Added “Reactivate” for inactive users.

### Bug 5 – User Management: No Resend invite for pending users
- **Location:** `src/app/api/settings/users/[id]/resend-invite/route.ts` (new), `src/app/settings/users/page.tsx`
- **Description:** Pending invites had no “Resend invite” action.
- **Fix applied:** Added POST `/api/settings/users/[id]/resend-invite` (admin-only, validates status === 'invited', calls Supabase `auth.admin.inviteUserByEmail`). Row shows “Resend invite” when `user.status === 'invited'`.

### Bug 6 – User Management: Could edit own role
- **Location:** `src/app/settings/users/page.tsx` (UserModal)
- **Description:** Audit required that users cannot change their own role.
- **Fix applied:** API GET `/api/settings/users` now returns `current_user_id`. Edit modal receives `currentUserId`; when `initialUser.id === currentUserId`, Global Role radios are disabled and label shows “(you cannot change your own role)”.

### Bug 7 – User Management: Invite form missing Entity
- **Location:** `src/app/api/settings/users/invite/route.ts`, `src/app/settings/users/page.tsx` (UserModal)
- **Description:** Invite form had no Entity dropdown.
- **Fix applied:** Invite API accepts `entity` (default `'us'`); new team_member is created with that entity. Modal has Entity dropdown (US/India) in Basic tab; edit modal also has Entity (disabled when editing self to avoid confusion).

### Bug 8 – User Management: No DELETE endpoint
- **Location:** `src/app/api/settings/users/[id]/route.ts`
- **Description:** Audit listed DELETE /api/settings/users/[id].
- **Fix applied:** Added DELETE handler: soft-delete (sets `active: false`, `status: 'inactive'`). Returns 400 if admin tries to deactivate themselves.

### Bug 9 – Notification Preferences: No success message on save
- **Location:** `src/app/settings/notifications/page.tsx`
- **Description:** After saving preferences, there was no feedback.
- **Fix applied:** Added `savedMessage` state; on successful PUT, show “Preferences saved.” for 3 seconds next to the Save button.

---

## 2. Missing Features (Not Implemented / N/A)

- **Last login column:** `team_members` has no `last_login` in the current schema; column was not added. Can be added in a future migration and then displayed.
- **Send email via Resend:** Invites use Supabase `auth.admin.inviteUserByEmail` (Supabase sends the invite email). Resend integration was not added.
- **GET /api/notifications/types:** Audit listed this; notification types are returned by GET `/api/settings/notification-preferences` (types + preferences). A separate “notification types only” endpoint was not added.
- **PATCH /api/settings/notification-preferences:** Audit listed PATCH; implementation uses PUT with a body `{ preferences: [...] }`. Behavior is correct; method name differs.

---

## 3. Files Created

- `src/app/api/settings/users/[id]/resend-invite/route.ts` – POST resend invite (admin-only).
- `docs/SETTINGS_UAT_AUDIT.md` (this file).

---

## 4. Files Modified

| File | Changes |
|------|---------|
| `src/app/api/settings/users/route.ts` | GET: query params `role`, `entity`, `status`; response includes `current_user_id`. |
| `src/app/api/settings/users/[id]/route.ts` | DELETE handler (soft-deactivate). |
| `src/app/api/settings/users/invite/route.ts` | Accept `entity`; create team_member with that entity. |
| `src/app/settings/users/page.tsx` | Access denied UI; filters (role, entity, status); Entity column; Deactivate/Reactivate/Resend invite; pass `currentUserId` to modal; Entity in invite/edit; disable own-role edit. |
| `src/app/settings/notifications/page.tsx` | Success message “Preferences saved.” after save (3s). |

---

## 5. API Endpoints Verified

| Endpoint | GET | POST | PATCH | PUT | DELETE |
|----------|-----|------|-------|-----|--------|
| `/api/settings/users` | ✅ (with role, entity, status filters; returns current_user_id) | — | — | — | — |
| `/api/settings/users/[id]` | ✅ | — | ✅ | — | ✅ (soft-deactivate) |
| `/api/settings/users/invite` | — | ✅ (with entity) | — | — | — |
| `/api/settings/users/[id]/resend-invite` | — | ✅ | — | — | — |
| `/api/settings/notification-preferences` | ✅ | — | — | ✅ (save preferences) | — |

---

## Summary

- **User Management:** Admin-only access is enforced; 403 shows an access-denied message. Table includes Entity; filters by role, entity, and status work. Deactivate, Reactivate, and Resend invite are available; invite and edit include Entity; users cannot change their own role. DELETE soft-deactivates.
- **Notification Preferences:** Types are grouped by category (Operations, Finance, HR, IT, System); Email and In-app toggles work; Save uses PUT and shows a short success message.

All listed bugs have been addressed; remaining gaps are documented above.
