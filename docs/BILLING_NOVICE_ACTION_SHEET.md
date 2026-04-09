# PropFolio billing — novice action sheet

Step-by-step reference after the billing audit and code fixes. Work through sections **3–7** in order; use **1–2** for context.

---

## 1. What was broken

- **Right after paying**, some users could still look “locked out” because the app required the **database** to say “active” before trusting Apple/RevenueCat—even when the phone already knew the subscription was valid. The **webhook** that updates the database can arrive a few seconds (or minutes) late.
- **Subscribe** could show long, technical error text copied from the store/RevenueCat instead of a short, clear message.
- If a **wrong type of RevenueCat key** (a **secret** key) slipped into the app, purchase errors could be confusing instead of pointing to “use the **public** Apple key.”
- **Logging** used slightly different console labels in different places, which made debugging harder.

*None of this was “Apple is broken”—it was mostly **timing** (server vs phone), **wording**, and **configuration** (which key goes where).*

---

## 2. What Cursor fixed in code

- **Unlock rule:** The app now treats you as a member if **either** the PropFolio server **or** RevenueCat says you have the **`propfolio_pro`** entitlement—so a successful purchase on the phone can unlock the app **before** the database catches up.  
  *Exception:* If the server marks a **billing problem** (failed payment, etc.) and membership is inactive, the app still locks until that’s resolved.
- **Calmer errors:** If membership checkout can’t start (no product loaded), you get a **short** message (“pull to refresh…”) instead of a wall of technical text. Developers still get details in logs.
- **Secret-key errors:** Purchase errors that mention RevenueCat **7243** or **secret API key** are mapped to the same clear “use the **public** key” message you see elsewhere.
- **One place for log labels:** Console search strings for billing are centralized so they don’t drift.

*Your **prices**, **products**, and **business model** in code were already defined; this pass fixed **access timing**, **messaging**, and **debug consistency**.*

---

## 3. What you still need to do manually

You (or whoever owns the accounts) must:

1. Put the **correct RevenueCat public Apple SDK key** into **every place the app is built** (local `.env` **and** EAS, if you use TestFlight/production builds).
2. In **RevenueCat**, create/configure **entitlement**, **offerings**, and **packages** so they match what the code expects (IDs and App Store product IDs).
3. In **App Store Connect**, create the **same** in-app purchase product IDs and attach them to your app; get agreements/tax/banking in order so products can load.
4. In **Supabase** (if you use the webhook), set **REVENUECAT_WEBHOOK_SECRET** and ensure the webhook URL in RevenueCat is correct.
5. **Rebuild** the iOS app after changing any `EXPO_PUBLIC_*` variable (keys and offering overrides are baked in at **build time**, not when you open the app).

The code cannot log into RevenueCat or App Store Connect for you.

---

## 4. Exactly where to log in and update settings

| Task | Where to go |
|------|-------------|
| RevenueCat **public** Apple key (starts with `appl_`) | [app.revenuecat.com](https://app.revenuecat.com) → your **project** → **API keys** → **Apple App Store** → copy the **public** / **SDK** key (**not** the secret `sk_` key). |
| RevenueCat **entitlement** | Same project → **Entitlements** → create or edit **`propfolio_pro`** (exact spelling). |
| RevenueCat **offerings** | **Offerings** → identifiers **`propfolio_subscription`** (membership) and **`propfolio_credits`** (credit packs), unless you override with env vars (see below). |
| RevenueCat **webhook** | **Project settings** → **Integrations** / webhooks → URL pointing to your Supabase **revenuecat-webhook** function; header must match your secret. |
| App Store **products** | [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → your app **PropFolio** (`com.propfolio.mobile`) → **Monetization** → **In-app purchases** (or **Subscriptions** in the subscription group). |
| **EAS** secrets for builds | [expo.dev](https://expo.dev) → your **account/organization** → **PropFolio** project → **Secrets** (or edit **eas.json** / build profile **env** if you use that pattern). |
| **Local** dev env | Your computer: project folder → create or edit **`.env`** (copy from **`.env.example`**). **Never commit real keys** to git. |
| **Supabase** webhook secret | [supabase.com](https://supabase.com) → your project → **Project Settings** → **Edge Functions** → **Secrets** → `REVENUECAT_WEBHOOK_SECRET`. |

---

## 5. What values to copy/paste

### RevenueCat → your app (EAS + optional .env)

- **`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`** = the **public Apple SDK key** from RevenueCat.  
  - **Must** start with **`appl_`**.  
  - **Never** paste a key that starts with **`sk_`** or **`rcsk_`** into the app—that is a **secret** key and will cause errors (e.g. **7243**).

### Optional overrides (only if your dashboard IDs differ from defaults)

- **`EXPO_PUBLIC_RC_SUBSCRIPTION_OFFERING_ID`** default: `propfolio_subscription`  
- **`EXPO_PUBLIC_RC_CREDITS_OFFERING_ID`** default: `propfolio_credits`  

If you rename offerings in RevenueCat, set these to **match exactly** (case-sensitive).

### App Store Connect product IDs (must match code)

Defined in **`src/services/revenuecat/productIds.ts`**:

| Role | Product ID |
|------|------------|
| Monthly membership | `com.propfolio.subscription.monthly` |
| Credit pack (1) | `com.propfolio.credits.1` |
| Credit pack (5) | `com.propfolio.credits.5` |
| Credit pack (10) | `com.propfolio.credits.10` |
| Credit pack (20) | `com.propfolio.credits.20` |

### RevenueCat entitlement (exact ID)

- **`propfolio_pro`** — attach **only** the **subscription** product to this entitlement, **not** the consumable credit products.

### Webhook (Supabase + RevenueCat)

- Generate a long random string; put the **same** value in:  
  - Supabase secret **`REVENUECAT_WEBHOOK_SECRET`**  
  - RevenueCat webhook **Authorization: Bearer &lt;that value&gt;** (per your function’s docs).

---

## 6. When you need to rebuild the app

Rebuild (new EAS build / new binary) **whenever** you change:

- **`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`** (or Android key)
- **`EXPO_PUBLIC_RC_SUBSCRIPTION_OFFERING_ID`** or **`EXPO_PUBLIC_RC_CREDITS_OFFERING_ID`**
- Any other **`EXPO_PUBLIC_*`** that the billing code reads

**Why:** Expo bakes these into the native app at **build time**. Changing only `.env` on your laptop does **not** change an already-installed TestFlight build.

You do **not** need a new build for:

- Tweaking **RevenueCat offerings** (same offering IDs, same products linked)—often a **pull-to-refresh** on the paywall is enough after RC/ASC changes propagate.
- **Price** or **localization** changes in App Store Connect (after Apple processes them).

---

## 7. How to test properly on iPhone

1. **Do not use Expo Go** for real billing tests (see section 9).
2. Install **either**:  
   - **TestFlight** build from EAS (**preview** or **production** profile), **or**  
   - **EAS development build** (dev client) on a **physical iPhone** or a simulator that supports StoreKit as documented for your setup.
3. Use a **Sandbox Apple ID** when the system asks (Settings → App Store → Sandbox Account on the device, for testing).
4. **Sign in** to PropFolio with a real test user so RevenueCat uses the same user id as Supabase (per your app’s auth).
5. Open **Membership / Paywall**: you should see **prices**, not endless loading or “billing isn’t configured” (if keys and products are right).
6. Tap **Subscribe** and complete the sandbox purchase.
7. Confirm you reach the **main app** (portfolio, etc.) without waiting only for the server.
8. **Restore purchases**: from paywall or settings; should restore entitlement if the subscription is still valid.
9. **Credits**: with an **active membership**, open **Buy credit packs**; completing a pack purchase should **add credits**, not replace membership.

**Dev-only:** In a **development** build, **Settings → Developer → Billing diagnostics** shows a structured snapshot; in Metro/Xcode search **`[PropFolio/billingDiagnostics]`** and **`[PropFolio/paywallBilling]`**.

---

## 8. What success should look like

- Paywall shows **subscription price(s)** from Apple (not “—” for everything forever).
- After subscribing, you get **full app access** (membership), and **import credits** are a **separate** balance (wallet).
- **Restore** works when you reinstall or use a new device (same Apple ID / subscription).
- RevenueCat dashboard shows the **customer** and **active entitlement** `propfolio_pro` after purchase.
- Within a short time, **Supabase** `user_subscription_status` (or your mirror table) shows **entitlement active** if the webhook is configured.

---

## 9. Common mistakes to avoid

| Mistake | Why it hurts |
|--------|----------------|
| Using a **secret** RevenueCat key (`sk_…`) in **`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`** | RevenueCat rejects it in the mobile SDK (error **7243**). Only **`appl_`** public Apple SDK keys belong in the app. |
| Only editing **`.env`** locally but not **EAS Secrets** | TestFlight/production builds **never see** your laptop `.env`. They only see what was in the environment **when EAS built the IPA**. |
| Testing billing in **Expo Go** | Expo Go doesn’t include your app’s native StoreKit / purchases setup the same way. **Purchases won’t work** there; use **dev client** or **TestFlight**. |
| Wrong **offering identifier** in RevenueCat vs app | The app looks for **`propfolio_subscription`** and **`propfolio_credits`** by default. A typo means **no packages** or wrong offering. |
| Attaching **credit consumables** to **`propfolio_pro`** | Membership could get confused with consumables. **Only** the **monthly subscription** product should unlock **`propfolio_pro`**. |
| App Store product IDs **don’t match** `productIds.ts` | Store returns products the app doesn’t recognize → mismatch / empty subscription line in the app. |
| Expecting **credits** to unlock the app | **Membership** unlocks the app; **credits** only fuel **imports**. Buying credits without membership won’t unlock portfolio (by design). |
| Forgetting **Agreements, Tax, and Banking** in App Store Connect | Products can stay invisible or unavailable until Apple’s account setup is complete. |

---

## Quick “start here” order

1. RevenueCat: **public `appl_` key** → copy.  
2. EAS: create/update **`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`** secret → **new iOS build**.  
3. RevenueCat: **entitlement `propfolio_pro`** + offerings **`propfolio_subscription`** / **`propfolio_credits`** + packages linked to **exact** ASC product IDs.  
4. App Store Connect: create those **same** product IDs; wait until they’re valid for testing.  
5. Install new build on **iPhone** (TestFlight or dev client) → test subscribe → test restore → test credits **with** membership.

For a tighter technical checklist, see **`docs/BILLING_VERIFICATION_CHECKLIST.md`**.
