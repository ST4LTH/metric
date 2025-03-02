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
exports.fetcher = void 0;
var fetcher;
(function (fetcher) {
    function json(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(...args);
            try {
                return yield response.json();
            }
            catch (e) {
                throw new JsonParseError(response.bodyUsed
                    ? 'BODY UNAVAILABLE'
                    : yield response.text(), e);
            }
        });
    }
    fetcher.json = json;
    function text(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield fetch(...args)).text();
        });
    }
    fetcher.text = text;
    function arrayBuffer(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield fetch(...args)).arrayBuffer();
        });
    }
    fetcher.arrayBuffer = arrayBuffer;
    function typedArray(ctor, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const ab = yield arrayBuffer(...args);
            return new ctor(ab);
        });
    }
    fetcher.typedArray = typedArray;
    // Like normal fetch, but will throw an error if !response.ok as well so we can uniformly handle them just like errored ones, woo
    function fetch(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield originalFetch(...args);
            if (!response.ok) {
                throw new HttpError(response);
            }
            return response;
        });
    }
    fetcher.fetch = fetch;
    class HttpError extends Error {
        static is(error) {
            return error instanceof HttpError;
        }
        constructor(response) {
            super(response.statusText);
            this.response = response;
            this.status = response.status;
            this.statusText = response.statusText;
        }
        readJsonBody() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.response.bodyUsed) {
                    return null;
                }
                try {
                    return yield this.response.json();
                }
                catch (e) {
                    return null;
                }
            });
        }
    }
    fetcher.HttpError = HttpError;
    class JsonParseError extends Error {
        static is(error) {
            return error instanceof JsonParseError;
        }
        constructor(originalString, error) {
            super(`Invalid json "${originalString}", ${error.message}`);
            this.originalString = originalString;
            // Preserve stack
            this.stack = error.stack;
        }
    }
    fetcher.JsonParseError = JsonParseError;
})(fetcher || (exports.fetcher = fetcher = {}));
const originalFetch = fetch;
//# sourceMappingURL=fetcher.js.map