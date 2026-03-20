//
//  Typography.swift
//  PropFolio
//
//  Text styles with Dynamic Type. Use these tokens for all on-screen text.
//

import SwiftUI

enum AppTypography {
    static let largeTitle = Font.system(.largeTitle).weight(.bold)
    static let title1 = Font.system(.title).weight(.semibold)
    static let title2 = Font.system(.title2).weight(.semibold)
    static let title3 = Font.system(.title3).weight(.medium)
    static let headline = Font.system(.headline).weight(.semibold)
    static let body = Font.system(.body)
    static let bodyMedium = Font.system(.body).weight(.medium)
    static let callout = Font.system(.callout)
    static let subheadline = Font.system(.subheadline)
    static let footnote = Font.system(.footnote)
    static let caption = Font.system(.caption)
    static let caption2 = Font.system(.caption2)
    static let metric = Font.system(.title2).weight(.semibold).monospacedDigit()
    static let metricLarge = Font.system(.title).weight(.bold).monospacedDigit()
}
