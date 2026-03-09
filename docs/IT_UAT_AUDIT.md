# IT Module – UAT Audit Report

**Date:** March 8, 2025  
**Scope:** End-to-end testing of the IT module (Dashboard, Hardware Inventory, Domain Management).

---

## Routes Audited

| Route | Status | Notes |
|-------|--------|------|
| `/it` | ✅ | IT Dashboard: stats, entity breakdown, alerts, quick links |
| `/it/hardware` | ✅ | Hardware Inventory: list, Add/Edit/Detail, filters, search, asset tag |
| `/it/domains` | ✅ | Domain Management: list, Add/Edit/Detail, filters, delete, expiry colors |

---

## 1. List of All Bugs Found and Fixes Applied

### Bug 1 – IT Dashboard: No quick links to Hardware or Domains
- **Location:** `src/app/it/page.tsx`
- **Description:** No navigation links to Hardware or Domains from the dashboard.
- **Fix applied:** Added a “Quick links” section with “View Hardware” → `/it/hardware` and “View Domains” → `/it/domains`.

### Bug 2 – IT Dashboard: Alert items not clickable
- **Location:** `src/app/it/page.tsx`
- **Description:** Warranty, domain, and SSL alerts were plain list items with no navigation.
- **Fix applied:** Each alert item is now a link: warranty alerts → `/it/hardware`, domain and SSL alerts → `/it/domains`.

### Bug 3 – Hardware: Asset tag not refreshed when entity changes in Add form
- **Location:** `src/app/it/hardware/page.tsx`
- **Description:** Next asset tag was fetched only on open (for US). Changing Entity to India did not update the suggested tag to FA-IN-XXX.
- **Fix applied:** Added a `useEffect` that runs when `addOpen` and `form.entity` change, calling `GET /api/it/hardware/next-asset-tag?entity=US|India` and updating `form.asset_tag`.

### Bug 4 – Hardware: No search by name or asset tag
- **Location:** `src/app/it/hardware/page.tsx`
- **Description:** Table could not be filtered by name or asset tag.
- **Fix applied:** Added `searchQuery` state and a search input; table rows are filtered client-side by name and asset_tag (case-insensitive substring).

### Bug 5 – Hardware: Purchase date column missing in table
- **Location:** `src/app/it/hardware/page.tsx`
- **Description:** Audit required a Purchase date column in the hardware table.
- **Fix applied:** Added “Purchase Date” column to the table header and body, showing `row.purchase_date` or “—”.

### Bug 6 – Hardware: Warranty expiry color coding incomplete
- **Location:** `src/app/it/hardware/page.tsx` – `warrantyDisplay()`
- **Description:** Audit required >90 normal, 30–90 yellow, <30 orange, expired red.
- **Fix applied:** Updated `warrantyDisplay`: expired = red, ≤30 days = amber “Expiring (Xd)”, ≤90 days = yellow, else normal.

### Bug 7 – Hardware: Missing types Tablet and Network
- **Location:** `src/app/it/hardware/page.tsx`
- **Description:** Audit required Laptop, Desktop, Monitor, Phone, Tablet, Printer, Network, Other.
- **Fix applied:** Added `tablet` and `network` to `HARDWARE_TYPES` and to `TYPE_ICONS` (Tablet/Network use Box/Router icons).

### Bug 8 – Domains: No filter by status or registrar
- **Location:** `src/app/it/domains/page.tsx`, `src/app/api/it/domains/route.ts`
- **Description:** Domains list could not be filtered by status or registrar.
- **Fix applied:** Added `statusFilter` and `registrarFilter` state; GET `/api/it/domains` now accepts `status` and `registrar` query params; domains page has status dropdown and registrar text input; list refetches when filters change.

### Bug 9 – Domains: No sort by expiry date
- **Location:** `src/app/api/it/domains/route.ts`
- **Description:** Domains were ordered by domain name only.
- **Fix applied:** Changed default order to `expiry_date` ascending (soonest first). Filtering still uses the same endpoint.

### Bug 10 – Domains: No Delete button
- **Location:** `src/app/it/domains/page.tsx`
- **Description:** Only Edit was available; audit required a Delete button.
- **Fix applied:** Added “Delete” button per row that calls `DELETE /api/it/domains/[id]` with confirmation, then refetches the list.

### Bug 11 – Domains: Expiry and SSL expiry color coding inconsistent
- **Location:** `src/app/it/domains/page.tsx`
- **Description:** Audit required >90 green, 30–90 yellow, <30 orange, expired red for domain and SSL expiry.
- **Fix applied:** Added `expiryColorClass(days)` and applied it to expiry date and SSL expiry date cells (red if expired, amber if ≤30d, yellow if ≤90d, green if >90d).

---

## 2. Missing Features (Addressed or N/A)

- **Dashboard:** Quick links and clickable alerts are implemented. Entity and type breakdowns were already present.
- **Hardware:** Add Hardware form, next-asset-tag for US/India, entity/type/status/assigned filters, Edit/Delete, detail modal were present. Search, purchase date column, warranty colors, and Tablet/Network types were added.
- **Domains:** Add/Edit Domain forms, detail modal were present. Status and registrar filters, sort by expiry, Delete button, and expiry/SSL color coding were added.
- **Vendor field (Hardware):** Audit listed “Vendor” in the Add Hardware form. The `it_hardware` table has no `vendor` column; optional vendor could be stored in `notes` or added via a future migration. Not implemented in this pass to avoid schema change.
- **Grouping (Hardware):** Audit requested grouping by type, entity, status. The current table is flat with filters; grouping could be added later if required.
- **Nameservers (Domains):** Audit listed “Nameservers” in the Add Domain form. The `it_domains` table has no `nameservers` column; not added in this pass.

---

## 3. API Endpoints Verified

| Endpoint | Status |
|----------|--------|
| GET /api/it/dashboard | ✅ Uses v_it_dashboard + alerts from it_hardware / it_domains |
| GET /api/it/hardware | ✅ entity, type, status, assignedTo (assigned/unassigned) |
| GET /api/it/hardware/[id] | ✅ |
| POST /api/it/hardware | ✅ |
| PATCH /api/it/hardware/[id] | ✅ |
| DELETE /api/it/hardware/[id] | ✅ |
| GET /api/it/hardware/next-asset-tag?entity=us | ✅ FA-US-001, FA-US-002, … |
| GET /api/it/hardware/next-asset-tag?entity=india | ✅ FA-IN-001, FA-IN-002, … |
| GET /api/it/domains | ✅ status, registrar query params; order by expiry_date |
| GET /api/it/domains/[id] | ✅ |
| POST /api/it/domains | ✅ |
| PATCH /api/it/domains/[id] | ✅ |
| DELETE /api/it/domains/[id] | ✅ |

---

## 4. Files Modified

| File | Changes |
|------|---------|
| `src/app/it/page.tsx` | Added `Link` import; Quick links (View Hardware, View Domains); alert items wrapped in `Link` to `/it/hardware` or `/it/domains`. |
| `src/app/it/hardware/page.tsx` | Added `searchQuery`, search input, `filteredList`; Purchase Date column; `useEffect` to refetch next-asset-tag when `addOpen` and `form.entity` change; `warrantyDisplay` color rules; HARDWARE_TYPES + TYPE_ICONS for tablet, network. |
| `src/app/it/domains/page.tsx` | Added `statusFilter`, `registrarFilter`; filter UI; `handleDelete` and Delete button; `expiryColorClass`; expiry/SSL date cells use `expiryColorClass`; list fetch uses query params and refetches after add/edit/delete. |
| `src/app/api/it/domains/route.ts` | GET: added `status` and `registrar` query params; order by `expiry_date` ascending. |

---

## 5. Files Created

None. All changes are in existing files.

---

## Summary

- **11 bugs** were found and fixed (dashboard links and alerts; hardware asset-tag refresh, search, purchase date, warranty colors, types; domains filters, sort, delete, expiry colors).
- **4 files** were modified; **0 files** created.
- All listed IT routes and API endpoints are implemented and wired. Optional items (Vendor on hardware, Nameservers on domains, grouping) were not implemented to avoid schema changes and can be added in a follow-up.
