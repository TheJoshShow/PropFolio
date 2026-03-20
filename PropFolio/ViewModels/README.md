# ViewModels

**What belongs here:** Screen-level state and business coordination. One ViewModel per main screen or flow. **Subfolders mirror Screens/** (Onboarding, Dashboard, PropertyImport, PropertyDetail, WhatIf, Portfolio) so each feature has a clear place.

- **ViewModels/Onboarding/:** OnboardingViewModel — state, completion, navigation to main app.
- **ViewModels/Dashboard/:** DashboardViewModel — portfolio summary, refresh.
- **ViewModels/PropertyImport/:** PropertyImportViewModel — URL/address input, fetch, loading/error/success, save.
- **ViewModels/PropertyDetail/:** PropertyDetailViewModel — property + underwriting outputs, confidence, future value.
- **ViewModels/WhatIf/:** WhatIfViewModel — sliders, live recalculation, optional save scenario.
- **ViewModels/Portfolio/:** PortfolioViewModel — list, refresh, delete.

ViewModels call Services and Engine; they do not contain UI. Use @Published / ObservableObject or Observable. Keep logic testable (inject services).
