# PropFolio — Sentry Privacy Decision

**Purpose:** Document Sentry configuration for production and App Store privacy posture.  
**Source:** app_store_compliance_audit.md (§2, §10)  
**Date:** 2025-03-12

---

## 1. Production-safe configuration (current)

Sentry is initialized in `expo-app/app/_layout.tsx` only when:

- `EXPO_PUBLIC_SENTRY_DSN` is set, and  
- `Platform.OS === 'ios'` (no web init).

**Options set for safest production posture:**

| Option | Value | Rationale |
|--------|--------|------------|
| **sendDefaultPii** | `false` | Do not attach user email, IP, or other PII by default. Reduces exposure and aligns with Privacy Policy disclosure. |
| **Replay (mobileReplayIntegration)** | `maskAllText: true`, `maskAllImages: true` | Session replay does not capture visible text or images; reduces risk of capturing credentials or personal data. |
| **environment** | `__DEV__ ? 'development' : 'production'` | Correct environment for filtering and sampling. |
| **integrations** | reactNavigationIntegration, mobileReplayIntegration only | No additional integrations that might add PII. |

**Other settings (unchanged):** tracesSampleRate, profilesSampleRate, replaysOnErrorSampleRate, replaysSessionSampleRate, enableLogs, enableNativeFramesTracking — left at current values; adjust if you need to reduce volume or cost.

---

## 2. What Sentry may receive (for Privacy Policy)

When Sentry is enabled (DSN set), the app may send:

- **Crash and error reports:** Stack traces, error messages, breadcrumbs (navigation, console), device/OS info (e.g. model, OS version). No user email or IP by default when `sendDefaultPii: false`.
- **Session replays:** For sessions where replay is sampled; **text and images are masked** so replay does not contain readable PII or screen content.
- **Performance traces:** If tracing is enabled; endpoint names and timing, not request bodies.

**Recommendation:** Privacy Policy should state that the app uses Sentry (or “a crash and error reporting service”) to collect crash reports, breadcrumbs, and device/OS information to improve stability; that optional session replay is masked; and that no account identifiers or PII are attached by default. If you later enable `sendDefaultPii` or add user IDs, update the Privacy Policy and this document.

---

## 3. Decision log

| Decision | Date | Rationale |
|----------|------|------------|
| **sendDefaultPii: false** | [Prior / this pass] | App Store and privacy audit recommendation; minimizes PII in Sentry. |
| **Replay maskAllText / maskAllImages** | [Prior / this pass] | Ensures replay does not capture sensitive on-screen content. |
| **iOS-only init** | [Prior] | Avoids web init issues; app is iOS-only for production. |
| **Document in Privacy Policy** | 2025-03-12 | Audit required disclosure of what is sent (crashes, breadcrumbs, device/OS, replay masked). |

---

## 4. Code reference

**File:** `expo-app/app/_layout.tsx`  
**Comment:** "Production-safe: no PII; replay masks text/images. See docs/sentry_privacy_decision.md."

Do not enable `sendDefaultPii: true` or remove replay masking without updating the Privacy Policy and this decision doc.

---

*See app_store_hardening_changes.md and final_metadata_requirements.md.*
