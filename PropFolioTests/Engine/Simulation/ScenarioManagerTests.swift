//
//  ScenarioManagerTests.swift
//  PropFolioTests
//
//  Save, set baseline, add, remove, compare.
//

import XCTest
@testable import PropFolio

final class ScenarioManagerTests: XCTestCase {

    var inputsA: SimulationInputs!
    var inputsB: SimulationInputs!

    override func setUp() {
        super.setUp()
        inputsA = SimulationInputs(purchasePrice: 300_000, monthlyRentPerUnit: 2_000, unitCount: 1, taxesAnnual: 5_000, insuranceAnnual: 1_200, repairsAndMaintenanceAnnual: 1_800, capitalReservesAnnual: 4_000)
        inputsB = SimulationInputs(purchasePrice: 320_000, monthlyRentPerUnit: 2_100, unitCount: 1, taxesAnnual: 5_500, insuranceAnnual: 1_300, repairsAndMaintenanceAnnual: 2_000, capitalReservesAnnual: 4_200)
    }

    func testSaveScenario_addsToList_andCanSetBaseline() {
        var scenarios: [Scenario] = []
        let (scenario1, next1) = ScenarioManager.saveScenario(name: "Base", inputs: inputsA, isBaseline: true, into: scenarios)
        scenarios = next1
        XCTAssertEqual(scenarios.count, 1)
        XCTAssertTrue(scenario1.isBaseline)
        XCTAssertTrue(scenarios[0].isBaseline)

        let (scenario2, next2) = ScenarioManager.saveScenario(name: "What-if", inputs: inputsB, isBaseline: false, into: scenarios)
        scenarios = next2
        XCTAssertEqual(scenarios.count, 2)
        XCTAssertFalse(scenario2.isBaseline)
        XCTAssertTrue(ScenarioManager.baseline(from: scenarios)?.name == "Base")
    }

    func testSetBaseline_clearsOtherBaseline() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 100_000
        inputs.monthlyRentPerUnit = 1_000
        inputs.unitCount = 1
        inputs.taxesAnnual = 2_000
        let (_, list1) = ScenarioManager.saveScenario(name: "A", inputs: inputs, isBaseline: true, into: [])
        var list = list1
        var inputs2 = inputs
        inputs2.purchasePrice = 110_000
        let (s2, list2) = ScenarioManager.saveScenario(name: "B", inputs: inputs2, isBaseline: false, into: list)
        list = list2
        XCTAssertEqual(ScenarioManager.baseline(from: list)?.name, "A")

        list = ScenarioManager.setBaseline(id: s2.id, in: list)
        XCTAssertEqual(ScenarioManager.baseline(from: list)?.name, "B")
        let baselineCount = list.filter { $0.isBaseline }.count
        XCTAssertEqual(baselineCount, 1)
    }

    func testRemoveScenario() {
        var inputs = SimulationInputs()
        inputs.purchasePrice = 100_000
        inputs.monthlyRentPerUnit = 1_000
        inputs.unitCount = 1
        inputs.taxesAnnual = 2_000
        let (s1, list1) = ScenarioManager.saveScenario(name: "One", inputs: inputs, isBaseline: true, into: [])
        var list = list1
        let (s2, list2) = ScenarioManager.saveScenario(name: "Two", inputs: inputs, isBaseline: false, into: list)
        list = list2
        XCTAssertEqual(list.count, 2)

        list = ScenarioManager.removeScenario(id: s1.id, from: list)
        XCTAssertEqual(list.count, 1)
        XCTAssertEqual(list.first?.name, "Two")
    }

    func testCompare_returnsSideBySideResults() {
        var a = SimulationInputs()
        a.purchasePrice = 300_000
        a.downPaymentPercent = 20
        a.interestRateAnnual = 0.06
        a.amortizationTermYears = 30
        a.monthlyRentPerUnit = 2_000
        a.unitCount = 1
        a.vacancyRatePercent = 0
        a.taxesAnnual = 4_000
        a.insuranceAnnual = 1_200
        let base = Scenario(name: "Base", isBaseline: true, inputs: a)

        var b = a
        b.monthlyRentPerUnit = 2_200
        let comp = Scenario(name: "Higher rent", isBaseline: false, inputs: b)

        let comparison = ScenarioManager.compare(baseline: base, comparison: comp)
        XCTAssertNotNil(comparison.resultLeft.noi)
        XCTAssertNotNil(comparison.resultRight.noi)
        let deltaNOI = comparison.delta(metric: .noi)
        XCTAssertNotNil(deltaNOI)
        XCTAssertTrue((deltaNOI ?? 0) > 0)
    }
}
