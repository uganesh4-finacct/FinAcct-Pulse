# Sales & Marketing Module – UAT Audit Report

**Date:** March 8, 2025  
**Scope:** End-to-end testing of Sales (Pipeline, Proposals) and Marketing (Dashboard, Campaigns, Leads, Referrals).

---

## Routes Audited

| Route | Status | Notes |
|-------|--------|------|
| `/sales/pipeline` | ✅ | Deals list, Kanban, Add/Edit/Delete deal, filters, search, stage probability |
| `/sales/proposals` | ✅ | Proposals list, Add/Edit, filter by status, Delete |
| `/marketing` | ✅ | Dashboard with KPIs, links to Campaigns, Leads, Referrals, Add Lead |
| `/marketing/campaigns` | ✅ | Campaigns list, Add/Edit/Delete, filters by status and platform |
| `/marketing/leads` | ✅ | Leads list, Add/Edit/Delete, Convert to Deal, filters |
| `/marketing/referrals` | ✅ | Referral sources table; Add Referral noted as coming soon |

---

## 1. List of All Bugs Found and Fixes Applied

### Bug 1 – Sales Pipeline: No filter by stage or owner
- **Location:** `src/app/api/sales/deals/route.ts`, `src/app/sales/pipeline/page.tsx`
- **Description:** Deals list could not be filtered by stage or owner.
- **Fix applied:** GET `/api/sales/deals` now accepts query params `stage` and `owner_id`. Pipeline page has filter dropdowns for stage and owner; list refetches when filters change.

### Bug 2 – Sales Pipeline: No search by company name
- **Location:** `src/app/sales/pipeline/page.tsx`
- **Description:** No way to search deals by company name.
- **Fix applied:** Added `searchCompany` state and search input; `filteredDeals` is derived client-side (case-insensitive substring match on `company_name`). Kanban uses `filteredDeals`.

### Bug 3 – Sales Pipeline: Probability not auto-updated when stage changes
- **Location:** `src/app/sales/pipeline/page.tsx` (DealModal)
- **Description:** Audit required stage-based probability defaults (e.g. Discovery 50%, Negotiation 75%, Won 100%, Lost 0%).
- **Fix applied:** Added `STAGE_PROBABILITY` map; when Stage dropdown changes, Probability field is set to the corresponding value (Discovery 50, Proposal 50, Negotiation 75, Won 100, Lost 0).

### Bug 4 – Sales Pipeline: No Delete deal
- **Location:** `src/app/api/sales/deals/[id]/route.ts`, `src/app/sales/pipeline/page.tsx`
- **Description:** Deal detail modal had no way to delete a deal.
- **Fix applied:** Added `DELETE /api/sales/deals/[id]`. DealModal accepts `onDelete`; when editing a deal, a "Delete" button is shown with confirmation; on success, modal closes and list refetches.

### Bug 5 – Proposals: No filter by status
- **Location:** `src/app/api/sales/proposals/route.ts`, `src/app/sales/proposals/page.tsx`
- **Description:** Proposals list could not be filtered by status.
- **Fix applied:** GET `/api/sales/proposals` accepts `status` query param. Proposals page has status filter dropdown and refetches when it changes.

### Bug 6 – Proposals: No Delete proposal
- **Location:** `src/app/api/sales/proposals/[id]/route.ts`, `src/app/sales/proposals/page.tsx`
- **Description:** No way to delete a proposal.
- **Fix applied:** Added `DELETE /api/sales/proposals/[id]`. Each proposal row has a "Delete" button with confirmation; on success, list refetches.

### Bug 7 – Marketing Dashboard: Wrong link for New Lead; missing Leads link
- **Location:** `src/app/marketing/page.tsx`
- **Description:** "New Lead" linked to `/marketing/new` (may not exist). No explicit "Leads" quick link.
- **Fix applied:** Replaced "New Lead" with "Add Lead" linking to `/marketing/leads`. Added a "Leads" link to `/marketing/leads`. Kept Campaigns and Referrals links.

### Bug 8 – Campaigns: No filter by status or type
- **Location:** `src/app/api/marketing/campaigns/route.ts`, `src/app/marketing/campaigns/page.tsx`
- **Description:** Campaigns list could not be filtered by status or platform/type.
- **Fix applied:** GET `/api/marketing/campaigns` accepts `status` and `type` (maps to platform) query params. Campaigns page has status and platform filter dropdowns; list refetches when filters change.

### Bug 9 – Campaigns: No Delete campaign
- **Location:** `src/app/api/marketing/campaigns/[id]/route.ts`, `src/app/marketing/campaigns/page.tsx`
- **Description:** No way to delete a campaign.
- **Fix applied:** Added `DELETE /api/marketing/campaigns/[id]`. Each campaign row has a "Delete" button with confirmation; on success, list refetches.

### Bug 10 – Marketing Leads: No Convert to Deal
- **Location:** `src/app/marketing/leads/page.tsx`
- **Description:** Qualified leads had no "Convert to Deal" action.
- **Fix applied:** Added `convertToDeal(lead)` that POSTs to `/api/sales/deals` with company/contact/lead_id/notes, then PATCHes the lead to status `Won`. "Convert to Deal" button shown for leads with status Qualified, Proposal_Sent, or Negotiating.

### Bug 11 – Marketing Leads: No Delete lead
- **Location:** `src/app/api/marketing/leads/[id]/route.ts`, `src/app/marketing/leads/page.tsx`
- **Description:** No way to delete a lead.
- **Fix applied:** Added `DELETE /api/marketing/leads/[id]`. Each lead row has a "Delete" button with confirmation; on success, list refetches.

### Bug 12 – Marketing Leads: Email not required in Add Lead form
- **Location:** `src/app/marketing/leads/page.tsx` (LeadModal)
- **Description:** Audit required Name and Email required for Add Lead.
- **Fix applied:** Contact Email field is now required (HTML `required` and validation in `handleSubmit`). Contact Name label marked as required for consistency.

### Bug 13 – Referrals: No indication that Add Referral is not yet available
- **Location:** `src/app/marketing/referrals/page.tsx`
- **Description:** Page showed referral sources table only; audit asked for "Add Referral" or a "Coming Soon" note.
- **Fix applied:** Added short copy: "Add Referral and bonus tracking coming soon. Referral sources are populated from lead source data."

---

## 2. Missing Features (Not Implemented / Out of Scope)

- **Sales Pipeline – Table view:** Only Kanban view exists; no table view toggle. Audit listed table view as optional ("if exists").
- **Sales Pipeline – Source field:** Deals table has `lead_id` but no free-text `source` (e.g. Referral, Website). Adding source would require a DB migration.
- **Sales Pipeline – Stages:** DB uses Discovery, Proposal, Negotiation, Won, Lost. Audit’s Lead/Qualified/Closed Won/Closed Lost would require schema change.
- **Proposals – Line items / Expired status:** Proposal form uses single amount, not line items. DB `sales_proposals.status` CHECK does not include "Expired"; no migration added.
- **Proposals – Create Proposal from Deal:** No "Create Proposal" button inside the Deal modal that pre-fills deal; user can create a proposal from Proposals page and select the deal.
- **Marketing Campaigns – Type dropdown:** Form uses Platform (Google, Meta, LinkedIn). Audit’s Email, Social, Content, Event, Referral, Webinar would require type/options expansion.
- **Referrals – Add Referral / bonus tracking:** Not implemented; noted as coming soon on the page.

---

## 3. Files Created

- `docs/SALES_MARKETING_UAT_AUDIT.md` (this file)

---

## 4. Files Modified

| File | Changes |
|------|---------|
| `src/app/api/sales/deals/route.ts` | GET: added `stage`, `owner_id` query params |
| `src/app/api/sales/deals/[id]/route.ts` | Added DELETE handler |
| `src/app/sales/pipeline/page.tsx` | Search by company; filters (stage, owner); stage→probability; Delete deal in modal; pass `onDelete` to DealModal |
| `src/app/api/sales/proposals/route.ts` | GET: added `status` query param |
| `src/app/api/sales/proposals/[id]/route.ts` | Added DELETE handler |
| `src/app/sales/proposals/page.tsx` | Filter by status; Delete button per row |
| `src/app/marketing/page.tsx` | "New Lead" → "Add Lead" to `/marketing/leads`; added "Leads" link |
| `src/app/api/marketing/campaigns/route.ts` | GET: added `status`, `type` query params |
| `src/app/api/marketing/campaigns/[id]/route.ts` | Added DELETE handler |
| `src/app/marketing/campaigns/page.tsx` | Filters (status, platform); Delete button per row |
| `src/app/api/marketing/leads/[id]/route.ts` | Added DELETE handler |
| `src/app/marketing/leads/page.tsx` | Convert to Deal for qualified leads; Delete button per row; email required in Add Lead |
| `src/app/marketing/referrals/page.tsx` | Added "Add Referral coming soon" note |

---

## 5. API Endpoints Verified

| Endpoint | GET | POST | PATCH | DELETE |
|----------|-----|------|-------|--------|
| `/api/sales/deals` | ✅ (supports `stage`, `owner_id`) | ✅ | — | — |
| `/api/sales/deals/[id]` | ✅ | — | ✅ | ✅ (added) |
| `/api/sales/lead-options` | ✅ | — | — | — |
| `/api/sales/proposals` | ✅ (supports `status`) | ✅ | — | — |
| `/api/sales/proposals/[id]` | ✅ | — | ✅ | ✅ (added) |
| `/api/marketing/campaigns` | ✅ (supports `status`, `type`) | ✅ | — | — |
| `/api/marketing/campaigns/[id]` | ✅ | — | ✅ | ✅ (added) |
| `/api/marketing/leads` | ✅ (supports source, status, dateFrom, dateTo) | ✅ | — | — |
| `/api/marketing/leads/[id]` | ✅ | — | ✅ | ✅ (added) |

---

## Summary

- **Sales Pipeline:** Filters (stage, owner), company search, stage-based probability, and deal delete are implemented. Kanban and Add/Edit deal modals work; Delete is in the modal with confirmation.
- **Proposals:** Status filter and per-row Delete with confirmation are implemented. Create/Edit proposal and link to deal work.
- **Marketing Dashboard:** Links to Campaigns, Leads, Referrals, and Add Lead (to `/marketing/leads`) are correct.
- **Campaigns:** Status and platform filters and per-row Delete are implemented.
- **Leads:** Convert to Deal (for Qualified/Proposal_Sent/Negotiating), Delete lead, and required email in Add Lead are implemented.
- **Referrals:** Page describes referral sources; Add Referral is noted as coming soon.

All listed bugs have been addressed; remaining gaps are documented as missing features or future work.
