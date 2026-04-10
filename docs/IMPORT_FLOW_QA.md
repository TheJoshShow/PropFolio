# Import Property flow — manual QA checklist

Use a **development** build for Metro logs (`[PropFolio import-auth]`, `[PropFolio auth]`).

## Auth & session

1. **Fresh login → Import**  
   Sign in, open Import Property. Confirm credits load, primary action enabled, no auth error banner.

2. **Reopen after background**  
   Send app to background 2–5 minutes, return, open Import. Confirm no “refresh sign-in” failure; import still works.

3. **Long background (token refresh)**  
   Background 30+ minutes (or shorten JWT TTL in Supabase dashboard for a test project). Reopen, open Import. Expect either normal import or a clear “sign in again” path — not an infinite spinner.

4. **Bad network**  
   Airplane mode on, tap Import primary action. Expect a timeout or network message; re-enable network and retry without reinstalling.

## Import paths

5. **Valid Zillow URL**  
   Paste a property page URL, complete flow (address if prompted), confirm property opens.

6. **Valid Redfin URL**  
   Same as Zillow.

7. **Manual address**  
   Search → pick suggestion **or** verify full address; confirm import proceeds.

8. **URL ↔ address switching**  
   Paste URL, then clear and use address (and reverse). Confirm active source hint and primary button state stay correct.

## Session invalidation

9. **Revoked refresh (optional)**  
   In Supabase Dashboard → Authentication → revoke sessions for the test user. Attempt import. Expect sign-out (or redirect home), listing URL restored on next visit to Import if one was typed.

## Regression

10. **Credits pill**  
    Confirm credit count still updates on focus and after successful import (no infinite `creditWalletSyncing`).
