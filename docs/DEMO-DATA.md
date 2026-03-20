# Demo Data

Rich demo data for full app testing without live APIs. Use in development to exercise every major feature.

## What’s included

### 1. Strong 4-plex (Maple Ridge)
- **Address:** 2847 Maple Ridge Dr, Austin, TX 78754  
- **Profile:** Small multifamily, strong cash flow  
- **Unit data:** 4 units, 4,800 sq ft, 8 bed / 8 bath, $1,200/mo per unit  
- **Financing:** 25% down, 6.5%, 30-year  
- **Expenses:** Taxes, insurance, PM, R&M, reserves (no utilities)  
- **Score / confidence:** 85 (Strong), 82 (High)  
- **Future value:** Moderate tailwinds  
- **Risks:** Interest rate sensitivity  
- **Opportunities:** Strong cash flow, value-add potential  

### 2. Value-add 6-plex (Oak Hollow)
- **Address:** 910 Oak Hollow Ln, Round Rock, TX 78664  
- **Profile:** Value-add with renovation needs  
- **Unit data:** 6 units, 3,200 sq ft, 6 bed / 6 bath, $500/mo per unit (below market)  
- **Financing:** 25% down, 7%, 30-year  
- **Renovation plan:** Kitchens, bathrooms, flooring, paint, HVAC, permits/contingency; region multiplier 1.05, 12% contingency  
- **Expenses:** Full breakdown  
- **Score / confidence:** 58 (Fair), 58 (Medium)  
- **Future value:** Upside after rehab  
- **Risks:** Negative cash flow during hold, renovation execution  
- **Opportunities:** Purchase below value, rent growth after rehabs  

### 3. Risky condo (Anderson)
- **Address:** 1200 W Anderson Ln #204, Austin, TX 78757  
- **Profile:** Thin-margin / risky deal  
- **Unit data:** 1 unit (condo), 1,100 sq ft, 2 bed / 2 bath, $1,650/mo  
- **Financing:** 15% down, 7.25%, 30-year  
- **Expenses:** Taxes, insurance, PM, R&M, reserves  
- **Score / confidence:** 28 (Poor), 38 (Low)  
- **Future value:** Headwinds  
- **Risks:** DSCR &lt; 1.0, high expense ratio, condo/HOA risk  
- **Opportunities:** Rate or rent improvement could help  

## How to load in development

### Option 1: Portfolio (Settings)
1. Open **Settings**.  
2. Turn on **Use demo data**.  
3. Open **Portfolio**. You’ll see three deals (Maple Ridge, Oak Hollow, Anderson).  
4. Tap any deal to open the **Analysis** screen with full score, confidence, future value, metrics, risks, and opportunities.  

### Option 2: Import flow
1. Open **Import**.  
2. Under **Demo (development)**, tap one of:
   - **Strong 4-plex** — Maple Ridge  
   - **Value-add 6-plex** — Oak Hollow  
   - **Risky condo** — Anderson  
3. The app goes straight to the **import result** (no network). You can Edit, Save to portfolio, or Done.  

## What gets exercised

- **Property details:** Address, unit count, beds/baths, sq ft, rent, list/estimated value, year built, photos (placeholder URLs).  
- **Analysis dashboard:** Deal score and band, archetype badge, confidence meter, future value summary, headline metrics (NOI, cap rate, cash flow, DSCR, etc.), risks and opportunities.  
- **Portfolio:** List and filter by archetype/status; open analysis from a deal; different scores (85, 58, 28) and confidence levels (high, medium, low).  
- **Import:** Load demo from start screen; result view with details and photo gallery; edit and save flow.  
- **Renovation:** Value-add deal includes a `RenovationPlan` with line items (kitchens, bathrooms, flooring, paint, HVAC, permits/contingency) and region/contingency; usable in What-If when that flow is wired to simulation inputs.  

## Code locations

- **Demo definitions:** `PropFolio/Demo/DemoData.swift`  
- **Portfolio deals with full analysis state:** `DemoData.dealsForPortfolio()`  
- **Import results:** `DemoData.demoImportResult(for:)`, `DemoData.allDemoImportResults()`  
- **Simulation inputs (for What-If / engines):** `DemoData.simulationInputsMultifamilyStrong`, `simulationInputsValueAdd`, `simulationInputsThinMargin`  
- **Renovation plan (value-add):** `DemoData.renovationPlanValueAdd`  

## Photos

Demo photo URLs use [picsum.photos](https://picsum.photos) with a fixed seed per property so they are stable. Replace with real asset URLs or bundled images if you prefer.
