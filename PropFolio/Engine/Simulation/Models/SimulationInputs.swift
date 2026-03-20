//
//  SimulationInputs.swift
//  PropFolio
//
//  User-adjustable what-if inputs. All optional for stable calculations with incomplete data.
//

import Foundation

/// User-facing simulation inputs. Amounts in USD; rates as decimals (e.g. 0.065 = 6.5%).
struct SimulationInputs: Equatable, Sendable {
    // MARK: - Purchase & financing
    var purchasePrice: Decimal?
    /// Down payment as percent of purchase price (0–100). Ignored if downPaymentAmount is set.
    var downPaymentPercent: Decimal?
    /// Down payment as fixed amount. If set, overrides downPaymentPercent.
    var downPaymentAmount: Decimal?
    var interestRateAnnual: Decimal?
    var amortizationTermYears: Int?
    var closingCosts: Decimal?

    // MARK: - Income
    /// Monthly rent per unit. Total monthly rent = rentPerUnit × unitCount.
    var monthlyRentPerUnit: Decimal?
    var unitCount: Int?
    var vacancyRatePercent: Decimal?
    /// Other income (laundry, parking, etc.) per year.
    var otherIncomeAnnual: Decimal?

    /// Square footage (for price per sq ft).
    var squareFeet: Int?

    // MARK: - Operating expenses (annual)
    var taxesAnnual: Decimal?
    var insuranceAnnual: Decimal?
    var propertyManagementAnnual: Decimal?
    var repairsAndMaintenanceAnnual: Decimal?
    var utilitiesAnnual: Decimal?
    var capitalReservesAnnual: Decimal?

    // MARK: - Renovation (one-time)
    /// Line-item plan with low/base/high and contingency. When set, used for total cash and returns; overrides legacy renovationCosts.
    var renovationPlan: RenovationPlan?
    /// Which estimate tier to use for renovation total (default base).
    var renovationEstimateTier: RenovationEstimateTier
    /// Legacy simple totals by category; used only when renovationPlan is nil.
    var renovationCosts: RenovationCosts?

    init(
        purchasePrice: Decimal? = nil,
        downPaymentPercent: Decimal? = nil,
        downPaymentAmount: Decimal? = nil,
        interestRateAnnual: Decimal? = nil,
        amortizationTermYears: Int? = nil,
        closingCosts: Decimal? = nil,
        monthlyRentPerUnit: Decimal? = nil,
        unitCount: Int? = nil,
        vacancyRatePercent: Decimal? = nil,
        otherIncomeAnnual: Decimal? = nil,
        squareFeet: Int? = nil,
        taxesAnnual: Decimal? = nil,
        insuranceAnnual: Decimal? = nil,
        propertyManagementAnnual: Decimal? = nil,
        repairsAndMaintenanceAnnual: Decimal? = nil,
        utilitiesAnnual: Decimal? = nil,
        capitalReservesAnnual: Decimal? = nil,
        renovationPlan: RenovationPlan? = nil,
        renovationEstimateTier: RenovationEstimateTier = .base,
        renovationCosts: RenovationCosts? = nil
    ) {
        self.purchasePrice = purchasePrice
        self.downPaymentPercent = downPaymentPercent
        self.downPaymentAmount = downPaymentAmount
        self.interestRateAnnual = interestRateAnnual
        self.amortizationTermYears = amortizationTermYears
        self.closingCosts = closingCosts
        self.monthlyRentPerUnit = monthlyRentPerUnit
        self.unitCount = unitCount
        self.vacancyRatePercent = vacancyRatePercent
        self.otherIncomeAnnual = otherIncomeAnnual
        self.squareFeet = squareFeet
        self.taxesAnnual = taxesAnnual
        self.insuranceAnnual = insuranceAnnual
        self.propertyManagementAnnual = propertyManagementAnnual
        self.repairsAndMaintenanceAnnual = repairsAndMaintenanceAnnual
        self.utilitiesAnnual = utilitiesAnnual
        self.capitalReservesAnnual = capitalReservesAnnual
        self.renovationPlan = renovationPlan
        self.renovationEstimateTier = renovationEstimateTier
        self.renovationCosts = renovationCosts
    }
}

/// Renovation costs by category (one-time). All optional.
struct RenovationCosts: Equatable, Sendable {
    var kitchen: Decimal?
    var bath: Decimal?
    var exterior: Decimal?
    var interior: Decimal?
    var other: Decimal?

    var total: Decimal {
        [kitchen, bath, exterior, interior, other].compactMap { $0 }.reduce(0, +)
    }

    init(kitchen: Decimal? = nil, bath: Decimal? = nil, exterior: Decimal? = nil, interior: Decimal? = nil, other: Decimal? = nil) {
        self.kitchen = kitchen
        self.bath = bath
        self.exterior = exterior
        self.interior = interior
        self.other = other
    }
}
