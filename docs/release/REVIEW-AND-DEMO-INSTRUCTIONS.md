## PropFolio – App Review & Demo Instructions

Use this when submitting to App Review or giving a guided demo.

### 1. Reviewer context

- **Product intent**
  - PropFolio helps buyers answer: “Should I buy this property?” by running standard real‑estate underwriting math and surfacing a deal score and confidence meter.
  - All financial calculations are deterministic and unit‑tested; no AI is used for numeric results.
- **Business model**
  - Free tier: 2 successful property imports per account.
  - Paid tier: Subscription unlocks unlimited imports and additional convenience features; billing is handled via native in‑app subscriptions (Apple / Google) through RevenueCat.

### 2. Test accounts & modes

- **Demo mode (no server)**
  - If Supabase env vars are not configured, the app starts in a local demo mode:
    - You are automatically “signed in” with a demo user.
    - Import demo properties and all analysis flows work without external APIs.
  - Useful when App Review cannot reach your backend.
- **Real account (optional)**
  - You may provide a test email/password combination tied to your Supabase project for end‑to‑end auth and subscription testing.
  - If provided, note:
    - Email and password.
    - Whether it already has Pro entitlement or not.

### 3. Suggested review flow (short)

1. Launch the app.
2. If on the auth screen, sign up or sign in with the provided test account.
3. From Home, tap **Add property** to open the Import tab.
4. Import a demo property (or type an address) to see the analysis screen: deal score, confidence, metrics, and future value.
5. Open **Settings**:
   - Confirm plan status and remaining free imports.
   - Tap **Manage subscription** (opens system subscription management).
   - Tap **Restore purchases** (if you’ve previously purchased).
   - Scroll to **Delete account** and confirm that deletion signs you out and removes the account from Supabase.

### 4. Free‑to‑paid behavior for reviewers

- Free users:
  - First two successful imports complete normally.
  - On the third import attempt, the server blocks the action and the app:
    - Shows an “Import limit reached” alert.
    - Opens the paywall screen with subscription options.
- Paid users:
  - After purchasing, the paywall verifies entitlement and returns you to the Import flow.
  - Subsequent imports are no longer limited by the free tier.

### 5. Known non‑blocking limitations

- Some external data providers (e.g. Google Places, RentCast, Census) may be disabled in review environments if API keys are not configured.
- When these providers are unavailable, the import flow still completes; autocomplete and certain estimates may be missing or fall back to manual entry.

