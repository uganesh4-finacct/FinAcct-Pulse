# Global Components UAT Audit — Summary

## 1. BUGS FOUND AND FIXES APPLIED

### BUG 1: No custom 404 page for unknown routes
- **Location:** `src/app` (missing file)
- **Description:** Unknown routes showed the default Next.js 404. Audit required a dedicated 404 page.
- **Fix:** Created `src/app/not-found.tsx` with a clear "404 – Page not found" message and a "Back to Dashboard" link to `/`.

### BUG 2: No route-level error boundary (500-style errors)
- **Location:** `src/app` (missing file)
- **Description:** Errors in the app tree were only caught by `global-error.tsx` (full-page replacement). A segment-level error UI inside the app shell was missing.
- **Fix:** Created `src/app/error.tsx` that displays "Something went wrong", reports to Sentry when available, and provides a "Try again" button that calls `reset()`.

### BUG 3: Executive Dashboard IT card linked to wrong route
- **Location:** `src/app/page.tsx`
- **Description:** IT department card "View IT assets" linked to `/it-assets`, which does not exist. Sidebar uses `/it` for the IT dashboard.
- **Fix:** Changed link from `/it-assets` to `/it` and label from "View IT assets" to "View IT dashboard".

### BUG 4: Notifications page – clicking row did not mark as read or navigate
- **Location:** `src/app/notifications/page.tsx`
- **Description:** Only the External Link button navigated; clicking the notification row did not mark as read or open the link.
- **Fix:** Made each notification row a clickable element (`role="button"`, `tabIndex={0}`). On click (or Enter/Space): mark as read if unread, then navigate to `link_url` if present. Action buttons use `onClick={(e) => e.stopPropagation()}` so they don’t trigger row click.

### BUG 5: Notifications page had no pagination or “Load more”
- **Location:** `src/app/notifications/page.tsx`, `src/app/api/notifications/route.ts`
- **Description:** Only the first 50 notifications were shown with no way to load more.
- **Fix:** API: added `offset` query support and `.range(offset, offset + limit - 1)`, and return `hasMore` in the response. Page: added `offset`, `hasMore`, `loadingMore` state; initial fetch uses `offset=0`; "Load more" button calls `fetchNotifications(offset, false)` to append the next page. Filters still replace the list with `fetchNotifications(0, true)`.

### BUG 6: Forgot password button did nothing
- **Location:** `src/app/login/page.tsx`
- **Description:** "Forgot password?" had no `onClick` or feedback.
- **Fix:** Added `forgotPasswordMessage` state. On click, set message to "Contact your administrator to reset your password." and display it below the button.

---

## 2. MISSING FEATURES ADDRESSED

| Feature | Status |
|--------|--------|
| Custom 404 page | Added `not-found.tsx` |
| Route-level error page (500-style) | Added `error.tsx` with Sentry + Try again |
| Notifications: click row to mark read + navigate | Implemented on `/notifications` |
| Notifications: Load more / pagination | API offset + Load more button |
| Forgot password feedback | Message shown on click |
| Dashboard IT link correct | Fixed to `/it` |

---

## 3. COMPONENTS VERIFIED (NO BUGS FOUND)

### Sidebar Navigation
- Menu items filtered by role and `module_access` (nav-config + Sidebar).
- Links use correct `href` from `SIDEBAR_NAV`.
- Active state: `isActive(item.href)` (path match or prefix).
- Collapse/expand: header button in AppShell toggles `sidebarCollapsed`; sidebar width and logo icon-only when collapsed.
- Sub-menus: collapsible sections with `toggleSection`, state in localStorage.
- User profile at bottom: initial + role badge (or tooltip when collapsed).
- Logout: in UserMenu (header) as "Sign out"; calls Supabase signOut and redirects to `/login`. No separate logout in sidebar (by design).

### Notification Bell
- Bell in header (AppShell).
- Unread count badge when `unreadCount > 0`.
- Click opens dropdown; click outside closes (dropdownRef).
- Recent list from `/api/notifications?limit=5`; polling every 30s.
- Click notification: marks read via `/api/notifications/[id]/read`, navigates if `link_url`, closes dropdown.
- "Mark all read" calls `/api/notifications/mark-all-read`.
- "View all notifications" links to `/notifications`.

### Notifications Page
- Loads with filters (All / Unread / Read and category).
- Click notification row marks as read and navigates (see Bug 4 fix).
- Delete calls `DELETE /api/notifications/[id]`.
- Load more (see Bug 5 fix).
- Empty state when no notifications.

### Executive Dashboard (/)
- Loads as home; data from `/api/executive-dashboard`.
- KPI cards, CEO Attention Board, Department Summary, Recent Activity.
- Quick links from cards and sections; role-appropriate data from API.

### Authentication
- `/login`: email/password form, Supabase `signInWithPassword`.
- Success: redirect to `/`, `router.refresh()`.
- Error: `setError(signInError.message)`.
- Middleware: no session and path !== `/login` → redirect to `/login`; session and path === `/login` → redirect to `/`.
- Session persists via Supabase cookies.
- Logout in UserMenu: signOut and redirect to `/login`.

### Error Handling
- 404: custom `not-found.tsx` (see Bug 1).
- 500/errors: `global-error.tsx` (root) and `error.tsx` (segment); Sentry in both.
- API errors: handled per page (e.g. ErrorBanner, alert, inline message).
- Form validation: per-form (required, inline errors).

### Responsive Design
- Sidebar: mobile (<768px) uses fixed overlay, hamburger to open, tap outside or link to close.
- Dashboard: responsive grid (1 / 2 / 3 / 6 columns by breakpoint).
- Tables: various pages use overflow containers; no global change made.
- Modals/forms: Tailwind responsive classes used across app; no new issues found.

---

## 4. FILES CREATED

| File | Purpose |
|------|--------|
| `src/app/not-found.tsx` | Custom 404 page with message and link to Dashboard |
| `src/app/error.tsx` | Route-level error boundary with Sentry and Try again |

---

## 5. FILES MODIFIED

| File | Changes |
|------|--------|
| `src/app/page.tsx` | IT card link `/it-assets` → `/it`, label "View IT assets" → "View IT dashboard" |
| `src/app/notifications/page.tsx` | Row click marks read + navigates; Load more (offset, hasMore, loadMore); markAsRead/deleteNotification refetch with replace |
| `src/app/api/notifications/route.ts` | Support `offset` query, use `.range(offset, offset+limit-1)`, return `hasMore` |
| `src/app/login/page.tsx` | Forgot password: state `forgotPasswordMessage`, onClick sets message, display below button |

---

## 6. SENTRY

- `global-error.tsx` and `error.tsx` call `Sentry.captureException(error)`.
- Confirm in Sentry dashboard that errors are received after deployment.

---

## 7. TESTING CHECKLIST (DONE)

- [x] Sidebar: role-based items, links, active state, collapse, sub-menus, user profile, role badge, logout (via UserMenu)
- [x] Notification bell: visible, count, dropdown, list, click → read + navigate, Mark all read, View all, polling
- [x] Notifications page: load, filters, click row, delete, Load more, empty state
- [x] Executive dashboard: load, KPIs, quick actions, activity, alerts, IT link fixed
- [x] Auth: login form, validation, redirect, error, protected routes, session, logout
- [x] Error: 404 page, error boundary, Sentry
- [x] Responsive: sidebar on mobile, dashboard grid

All identified bugs were fixed; no known broken behavior remains in the audited global components.
