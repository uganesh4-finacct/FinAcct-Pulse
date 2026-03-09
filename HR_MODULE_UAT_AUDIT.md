# HR Module UAT Audit — Summary

## 1. BUGS FOUND AND FIXES APPLIED

### BUG 1: Add Candidate page was a placeholder
- **Location:** `src/app/hr/candidates/new/page.tsx`
- **Description:** Page showed only placeholder text and no form; "+ Add Candidate" from dashboard and candidates list did not lead to a working form.
- **Fix:** Replaced with full client form: Position/Requisition dropdown, Name (required), Email, Phone, Resume URL, Source, Current Company, Years of Experience, Expected Salary, Notes. Form loads positions from `/api/hr/positions?status=open` and sources from `/api/hr/sources`, submits via POST `/api/hr/hiring/candidates`. Added support for `?requisition_id=` so requisition detail "Add" uses the same page and POSTs to `/api/hr/candidates` for requisition-based candidates.

### BUG 2: HR Dashboard "+ Add Candidate" linked to wrong URL
- **Location:** `src/app/hr/page.tsx`
- **Description:** Quick action "+ Add Candidate" linked to `/hr/candidates?add=1`, which did not open an add form.
- **Fix:** Changed link to `/hr/candidates/new` so it opens the full Add Candidate form.

### BUG 3: Pipeline by Requisition table rows were not clickable
- **Location:** `src/components/hr/PipelineFunnel.tsx`
- **Description:** Position column showed plain text; no navigation to requisition detail.
- **Fix:** Wrapped position title in `Link` to `/hr/requisitions/[requisition_id]` when `requisition_id` is present. Added `Link` import.

### BUG 4: Staffing request form always showed client dropdown
- **Location:** `src/app/hr/requests/page.tsx`
- **Description:** Audit required: for "New Client" type show text input for client name; for Expansion/Backfill/Proactive show dropdown of existing clients.
- **Fix:** Dynamic form: when request type is "New Client", show a required "New Client Name" text input; otherwise show existing client dropdown. On submit for "New Client", create client via POST `/api/clients` (name + vertical "other"), then create request with the new `client_id`. Added `client_name_new` to form state and validation.

### BUG 5: Staffing request approval visible only to admin
- **Location:** `src/app/hr/requests/page.tsx`
- **Description:** Approve/Reject section was shown only when `currentUser?.role === 'admin'`.
- **Fix:** Approval section now shown for `admin` or `hr_manager` (`showApprovalSection` updated).

### BUG 6: Requisition detail "Add Candidate" linked to non-functional URL
- **Location:** `src/app/hr/requisitions/[id]/page.tsx`
- **Description:** "+ Add" linked to `/hr/candidates?requisition_id=id&add=1`; candidates list page did not handle `add=1` to show a form.
- **Fix:** Changed link to `/hr/candidates/new?requisition_id=id`. Add Candidate page now supports `requisition_id` query: in that mode it shows requisition dropdown (pre-filled), submits to `/api/hr/candidates`, and redirects back to the requisition detail.

### BUG 7: Hiring page did not open correct tab from URL
- **Location:** `src/app/hr/hiring/page.tsx`
- **Description:** Redirect to `/hr/hiring?tab=candidates` after adding a candidate did not switch to the Candidates tab.
- **Fix:** Use `useSearchParams()` to read `tab`; initial `activeTab` set from `tab` when valid (`positions` | `pipeline` | `candidates`). Added `useEffect` to sync `activeTab` when `searchParams.tab` changes so direct links like `/hr/hiring?tab=candidates` show the correct tab.

### BUG 8: New Requisition page was placeholder only
- **Location:** `src/app/hr/requisitions/new/page.tsx`
- **Description:** Page had no flow to create a requisition from an approved request.
- **Fix:** Replaced with client page that fetches `/api/hr/requests`, filters to approved/in_hiring, and lists them in a table with "Create Requisition" button. On click, POSTs to `/api/hr/requisitions` with `staffing_request_id`, `title` (role_title), `market`, `vertical`, then redirects to the new requisition detail. Empty state links to Staffing Requests.

---

## 2. MISSING FEATURES ADDRESSED

| Feature | Status |
|--------|--------|
| Add Candidate full form (position + all fields) | Implemented on `/hr/candidates/new` |
| Add Candidate from requisition (pre-filled requisition) | Implemented via `?requisition_id=` on same page |
| Pipeline table rows open requisition detail | Implemented in PipelineFunnel |
| New Client request type uses text input for client name | Implemented; creates client then request |
| Create Requisition from approved request | Implemented on `/hr/requisitions/new` |
| Hiring tab from URL (`?tab=candidates`) | Implemented |

---

## 3. FILES CREATED

- None (all changes were edits to existing files or replacement of placeholder content).

---

## 4. FILES MODIFIED

| File | Changes |
|------|--------|
| `src/app/hr/candidates/new/page.tsx` | Replaced placeholder with full Add Candidate form; added requisition mode via `?requisition_id=`; Suspense wrapper for `useSearchParams`. |
| `src/app/hr/page.tsx` | "+ Add Candidate" link changed from `/hr/candidates?add=1` to `/hr/candidates/new`. |
| `src/components/hr/PipelineFunnel.tsx` | Added `Link` import; position cell now links to `/hr/requisitions/[requisition_id]` when present. |
| `src/app/hr/requests/page.tsx` | Dynamic request form: New Client = text input + create client on submit; other types = client dropdown. Added `client_name_new`; approval section for `hr_manager` as well as `admin`. |
| `src/app/hr/requisitions/[id]/page.tsx` | "Add" candidate link changed to `/hr/candidates/new?requisition_id=id`. |
| `src/app/hr/hiring/page.tsx` | `useSearchParams` to read `tab`; initial tab and sync from URL for `?tab=candidates` (and pipeline/positions). |
| `src/app/hr/requisitions/new/page.tsx` | Replaced placeholder with list of approved requests and "Create Requisition" flow; POST to `/api/hr/requisitions` and redirect to new requisition. |

---

## 5. API ENDPOINTS VERIFIED (no code changes required)

- `GET /api/hr/dashboard` — returns `{ summary, pipeline }`
- `GET /api/hr/positions` — returns `{ positions, stats }`; supports `?status=open`
- `GET /api/hr/sources` — returns array of sources
- `GET /api/hr/requisitions` — returns `{ requisitions }`
- `POST /api/hr/requisitions` — creates requisition (used by New Requisition page)
- `GET /api/hr/requests` — returns `{ requests }`
- `POST /api/hr/requests` — creates request (client_id required; New Client flow creates client first)
- `POST /api/hr/hiring/candidates` — creates candidate for position (used by Add Candidate page)
- `POST /api/hr/candidates` — creates candidate for requisition (used when `requisition_id` in URL)
- `POST /api/clients` — creates client (used for New Client staffing request)

---

## 6. ROUTES AUDITED — STATUS

| Route | Loads | Buttons/Links | Forms | Notes |
|-------|-------|----------------|-------|--------|
| `/hr` | Yes | Stats, pipeline links, + New Request, + Add Candidate | N/A | Fixed Add Candidate link; pipeline rows clickable |
| `/hr/hiring` | Yes | Add Position, filters, tabs, row clicks, Kanban | Modals (Add/Edit Position, Add/Edit Candidate, Detail) | Tab from URL fixed |
| `/hr/team` | Yes | Add Team Member, tabs, filters, Edit, Deactivate | Add/Edit modals | No changes |
| `/hr/requests` | Yes | New Request, filters, row click, Approve/Reject/Hold | New request panel (dynamic by type) | New Client = text input + create client; hr_manager can approve |
| `/hr/candidates` | Yes | + Add Candidate, filters, view toggle, row links | N/A | Add links to `/hr/candidates/new` |
| `/hr/candidates/new` | Yes | Cancel, Submit | Full form (position or requisition mode) | Replaced placeholder |
| `/hr/candidates/[id]` | Yes | Back, Move to Offer, Approve/Reject, Send Offer | Side panels | No changes |
| `/hr/requisitions` | Yes | Filters, view toggle, + From Request, card/row links | N/A | No changes |
| `/hr/requisitions/new` | Yes | Create Requisition per row, link to requests | N/A | Replaced placeholder with approved-requests list |
| `/hr/requisitions/[id]` | Yes | Back, + Add candidate | N/A | Add links to `/hr/candidates/new?requisition_id=id` |

---

## 7. TESTING ORDER USED

1. APIs: Checked response shapes (positions.positions, sources array, etc.) and corrected form code accordingly.
2. List pages: Verified data loading and links.
3. Detail pages: Verified navigation and Add Candidate targets.
4. Forms: Add Candidate (new + requisition mode), New Request (New Client vs existing client), New Requisition from approved request.
5. Links: Dashboard Add Candidate, pipeline rows, requisition Add candidate, hiring tab from URL.

All identified bugs were fixed; no known broken buttons, links, or forms remain in the audited HR routes.
