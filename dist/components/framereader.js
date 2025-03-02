"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameReader = void 0;
class FrameReader {
    constructor(stream, onFrame, onEnd) {
        this.stream = stream;
        this.onFrame = onFrame;
        this.onEnd = onEnd;
        this.reader = this.stream.getReader();
        this.lastArray = null;
        this.frameLength = -1;
        this.framePos = 0;
    }
    read() {
        this.doRead();
    }
    doRead() {
        return __awaiter(this, void 0, void 0, function* () {
            const { done, value } = yield this.reader.read();
            if (done || !value) {
                return this.onEnd();
            }
            let array = value;
            while (array.length > 0) {
                const start = 4;
                if (this.lastArray) {
                    const newArray = new Uint8Array(array.length + this.lastArray.length);
                    newArray.set(this.lastArray);
                    newArray.set(array, this.lastArray.length);
                    this.lastArray = null;
                    array = newArray;
                }
                if (this.frameLength < 0) {
                    if (array.length < 4) {
                        this.lastArray = array;
                        this.doRead();
                        return;
                    }
                    this.frameLength = array[0] | (array[1] << 8) | (array[2] << 16) | (array[3] << 24);
                    if (this.frameLength > 65535) {
                        throw new Error('A too large frame was passed.');
                    }
                }
                const end = 4 + this.frameLength - this.framePos;
                if (array.length < end) {
                    this.lastArray = array;
                    this.doRead();
                    return;
                }
                const frame = softSlice(array, start, end);
                this.framePos += (end - start);
                if (this.framePos === this.frameLength) {
                    // reset
                    this.frameLength = -1;
                    this.framePos = 0;
                }
                this.onFrame(frame);
                // more in the array?
                if (array.length > end) {
                    array = softSlice(array, end);
                }
                else {
                    // continue reading
                    this.doRead();
                    return;
                }
            }
        });
    }
}
exports.FrameReader = FrameReader;
function softSlice(arr, start, end) {
    return new Uint8Array(arr.buffer, arr.byteOffset + start, end && end - start);
}
//# sourceMappingURL=framereader.js.map