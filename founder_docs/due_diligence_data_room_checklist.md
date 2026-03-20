# PropFolio — Due Diligence Data Room Checklist

**Purpose:** Structure and contents of a data room for investor or partner due diligence.  
**Audience:** Founders, operations  
**Date:** 2025-03-12

---

## 1. Data Room Structure (Suggested Folders)

| Folder | Contents |
|--------|----------|
| **01_corporate** | Charter, bylaws, good standing, EIN, registered agent, state filings |
| **02_cap_table_and_equity** | Cap table, option plan, founder stock purchase agreements, 83(b) copies, advisor agreements |
| **03_governance** | Board and shareholder consents/minutes, decision policy summary |
| **04_IP_and_contracts** | IP assignments (founder/employee/contractor), key contractor agreements, material commercial contracts |
| **05_product_and_tech** | App description, architecture summary, key integrations (Supabase, RevenueCat, etc.), security/privacy summary |
| **06_financials** | P&L summary, burn, projections (if shared); revenue metrics (MRR, subscribers) |
| **07_legal_and_compliance** | Privacy policy, terms of service, App Store compliance summary; any litigation or claims |
| **08_insurance** | D&O, E&O, cyber (if any) |
| **09_trademark_and_brand** | Trademark filings/registrations; brand asset list |

---

## 2. Document Checklist by Folder

### 01_corporate
- [ ] Certificate of Incorporation (or LLC formation doc)
- [ ] Bylaws or Operating Agreement
- [ ] Good standing certificate (recent)
- [ ] EIN confirmation
- [ ] List of officers and directors

### 02_cap_table_and_equity
- [ ] Cap table (current; fully diluted)
- [ ] Stock purchase agreements (founders)
- [ ] 83(b) elections (redact SSN if needed; or confirm filed)
- [ ] Option plan document
- [ ] Option grant log or key grants
- [ ] Advisor agreements (summary or form; redact personal terms if needed)

### 03_governance
- [ ] Board consents (material decisions: option plan, material contracts, fundraising)
- [ ] Shareholder consents (if any)
- [ ] Summary of founder decision-making and deadlock (or reference to policy)

### 04_IP_and_contracts
- [ ] Founder IP assignments
- [ ] Form PIIA/CIIA (employee)
- [ ] Key contractor SOWs with IP/NDA (or summary table)
- [ ] Material contracts: key SaaS (e.g., Supabase, RevenueCat), partnerships, revenue share

### 05_product_and_tech
- [ ] One-pager: product, platform (iOS), core features, roadmap summary
- [ ] Tech stack and third-party services
- [ ] Security and data handling summary (align with [privacy_and_data_governance_checklist.md](privacy_and_data_governance_checklist.md))

### 06_financials
- [ ] Summary financials (as agreed with investors)
- [ ] Key metrics: MAU, imports, conversion to paid, MRR/ARR if applicable
- [ ] Burn and runway (if shared)

### 07_legal_and_compliance
- [ ] Privacy Policy (URL or PDF)
- [ ] Terms of Service (URL or PDF)
- [ ] App Store compliance: support URL, account deletion, subscription terms (summary or reference to [app_store_launch_governance_checklist.md](app_store_launch_governance_checklist.md))
- [ ] Litigation / claims: none or description

### 08_insurance
- [ ] Policy summaries or declarations pages (if any)

### 09_trademark_and_brand
- [ ] Trademark search or registration status ([brand_assets_and_trademark_tracking_sheet.csv](brand_assets_and_trademark_tracking_sheet.csv) summary)
- [ ] Domain ownership

---

## 3. Best Practices

- **Redact** SSNs, bank account numbers, and personal data before upload.
- **Version** the room (e.g., “Data Room v1 – [date]”) and note what was added/updated.
- **Access:** Use a secure platform (e.g., DocSend, Notion, Dropbox with permissions) and grant access by folder or document set as appropriate.
- **NDA:** Ensure mutual NDA or confidentiality terms are in place before sharing confidential data room materials.
- **Updates:** Keep the room updated as new material contracts or consents are executed.

---

## 4. PropFolio-Specific

- Include reference to **release_blocker_report.md** and **app_store_hardening** docs to show launch readiness.
- Include **product_risk_disclosures_memo.md** so investors see that “informational only; not advice” is documented.
- If asked about data: user auth (Supabase), usage events, RevenueCat for subscriptions; no MLS dependency in MVP; see [privacy_and_data_governance_checklist.md](privacy_and_data_governance_checklist.md).

---

*Part of the PropFolio founder document package. Not legal advice.*
