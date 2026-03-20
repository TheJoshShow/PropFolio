//
//  PropFolioApp.swift
//  PropFolio
//
//  App entry point. Configure environment and Supabase at launch; keep business logic elsewhere.
//  When Supabase is configured, show LoginScreen until signed in; otherwise show main app.
//

import SwiftUI

@main
struct PropFolioApp: App {
    @StateObject private var authVM = AuthViewModel()

    init() {
        SupabaseClientManager.configure()
        #if DEBUG
        // Development: default demo data ON so portfolio and flows are testable without APIs.
        UserDefaults.standard.register(defaults: ["useDemoData": true])
        #endif
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if authVM.shouldShowLogin {
                    LoginScreen()
                } else {
                    RootTabView()
                }
            }
            .environmentObject(authVM)
            .appThemeFromColorScheme()
        }
    }
}
