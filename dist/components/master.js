"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = decode;
exports.decodeData = decodeData;
/*eslint-disable block-scoped-var, id-length, no-control-regex, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
const $protobuf = __importStar(require("protobufjs/minimal"));
// Define field numbers as constants to eliminate magic numbers <button class="citation-flag" data-index="3"><button class="citation-flag" data-index="4"><button class="citation-flag" data-index="7">
const ENDPOINT_FIELD = 1;
const SERVER_DATA_FIELD = 2;
// Server decoder function
function decode(reader, length) {
    if (!(reader instanceof $protobuf.Reader))
        reader = $protobuf.Reader.create(reader);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = { EndPoint: "", Data: {} };
    while (reader.pos < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
            case ENDPOINT_FIELD:
                message.EndPoint = reader.string();
                break;
            case SERVER_DATA_FIELD:
                message.Data = decodeData(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
        }
    }
    return message;
}
// ServerData decoder function
function decodeData(reader, length) {
    // Implement actual decoding logic based on your .proto schema <button class="citation-flag" data-index="6"><button class="citation-flag" data-index="10">
    const message = {};
    // Add decoding logic here
    return message;
}
//# sourceMappingURL=master.js.map