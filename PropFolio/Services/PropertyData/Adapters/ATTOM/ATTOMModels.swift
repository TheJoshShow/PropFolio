//
//  ATTOMModels.swift
//  PropFolio
//
//  Request/response for ATTOM (or equivalent) parcel/property API.
//

import Foundation

// MARK: - Request

/// Request: by address or APN. ATTOM accepts address line + city/state/zip.
struct ATTOMPropertyRequest: Encodable {
    let address1: String
    let city: String
    let state: String
    let zip: String
}

// MARK: - Response

struct ATTOMPropertyResponse: Decodable {
    let property: [ATTOMProperty]?
}

struct ATTOMProperty: Decodable {
    let identifier: ATTOMIdentifier?
    let area: ATTOMArea?
    let lot: ATTOMLot?
    let building: ATTOMBuilding?
    let address: ATTOMAddress?
}

struct ATTOMIdentifier: Decodable {
    let apn: String?
    let fips: String?
}

struct ATTOMArea: Decodable {
    let totalSize: Int?
    let buildingSize: Int?
    enum CodingKeys: String, CodingKey {
        case totalSize
        case buildingSize
    }
}

struct ATTOMLot: Decodable {
    let lotSize: Int?
    enum CodingKeys: String, CodingKey {
        case lotSize
    }
}

struct ATTOMBuilding: Decodable {
    let size: Int?
    let rooms: ATTOMRooms?
    let yearBuilt: Int?
    enum CodingKeys: String, CodingKey {
        case size
        case rooms
        case yearBuilt
    }
}

struct ATTOMRooms: Decodable {
    let beds: Int?
    let baths: Decimal?
}

struct ATTOMAddress: Decodable {
    let line1: String?
    let city: String?
    let state: String?
    let postalCode: String?
}
