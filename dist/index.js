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
exports.Deferred = void 0;
exports.decodeServer = decodeServer;
exports.getAllServers = getAllServers;
exports.getServerInfo = getServerInfo;
const master_1 = require("./master");
const framereader_1 = require("./components/framereader");
const fetcher_1 = require("./components/fetcher");
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
exports.Deferred = Deferred;
function decodeServer(frame) {
    return master_1.master.Server.decode(frame);
}
const BASE_URL = 'https://servers-frontend.fivem.net/api/servers';
const ALL_SERVERS_URL = `${BASE_URL}/streamRedir/`;
function readBodyToServers() {
    return __awaiter(this, arguments, void 0, function* (gameName = 'gta5', onServer, body) {
        const deferred = new Deferred();
        let decodeTime = 0;
        let transformTime = 0;
        let onServerTime = 0;
        const frameReader = new framereader_1.FrameReader(body, (frame) => {
            var _a, _b;
            let s = performance.now();
            const srv = decodeServer(frame);
            decodeTime += performance.now() - s;
            if (srv.EndPoint && srv.Data) {
                const serverGameName = (_b = (_a = srv.Data) === null || _a === void 0 ? void 0 : _a.vars) === null || _b === void 0 ? void 0 : _b.gamename;
                if (gameName === serverGameName) {
                    s = performance.now();
                    const aaa = srv.Data;
                    transformTime += performance.now() - s;
                    s = performance.now();
                    onServer(aaa);
                    onServerTime += performance.now() - s;
                }
            }
            decodeTime += performance.now() - s;
        }, deferred.resolve);
        frameReader.read();
        yield deferred.promise;
        console.log('Times: decode', decodeTime, 'ms, transform', transformTime, 'ms, onServer', onServerTime, 'ms');
    });
}
function getAllServers() {
    return __awaiter(this, arguments, void 0, function* (gameName = 'gta5', onServer) {
        console.time('Total getAllServers');
        const { body } = yield fetcher_1.fetcher.fetch(new Request(ALL_SERVERS_URL));
        if (!body) {
            console.timeEnd('Total getAllServers');
            throw new Error('Empty body of all servers stream');
        }
        yield readBodyToServers(gameName, onServer, body);
        console.timeEnd('Total getAllServers');
    });
}
function getServerInfo(servers) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoints = Object.entries(servers).filter(([key, server]) => {
            return server.connectEndPoints && server.connectEndPoints.length > 0 && !server.connectEndPoints[0].startsWith("https");
        }).map(([key, server]) => ({
            endpoint: server.connectEndPoints[0],
            serverData: server
        }));
        const concurrency = 10;
        const maxRequests = 1000;
        let requestCount = 0;
        const resourceCounts = {};
        const chunkSize = concurrency;
        const chunks = Math.ceil(endpoints.length / chunkSize);
        for (let i = 0; i < chunks; i++) {
            const chunk = endpoints.slice(i * chunkSize, (i + 1) * chunkSize);
            yield Promise.all(chunk.map((_a) => __awaiter(this, [_a], void 0, function* ({ endpoint, serverData }) {
                if (requestCount >= maxRequests)
                    return;
                requestCount++;
                console.log(requestCount);
                try {
                    const response = yield Promise.race([
                        fetcher_1.fetcher.fetch(`http://${endpoint}/info.json`),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000)),
                    ]);
                    if (!response.ok)
                        return;
                    const dynamicData = yield response.json();
                    if (dynamicData.resources && Array.isArray(dynamicData.resources)) {
                        dynamicData.resources.forEach((resource) => {
                            var _a, _b;
                            if (typeof resource === 'string') {
                                resourceCounts[resource] = {
                                    servers: (((_a = resourceCounts[resource]) === null || _a === void 0 ? void 0 : _a.servers) || 0) + 1,
                                    players: (((_b = resourceCounts[resource]) === null || _b === void 0 ? void 0 : _b.players) || 0) + (serverData.clients || 0),
                                };
                            }
                        });
                    }
                }
                catch (error) {
                    /*           console.error(`Error fetching ${endpoint}:`, error); */
                }
            })));
        }
        const topResourcesByServers = Object.entries(resourceCounts)
            .sort((a, b) => b[1].servers - a[1].servers)
            .slice(0, 10);
        console.log('Top 10 Most Common Resources by Number of Servers:');
        topResourcesByServers.forEach(([resource, { servers, players }], index) => {
            console.log(`${index + 1}. ${resource} - Servers: ${servers}, Players: ${players}`);
        });
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const servers = {};
        let total = 0;
        yield getAllServers('gta5', (data) => {
            if (data.connectEndPoints && data.hostname) {
                servers[data.hostname] = data;
                total++;
            }
        });
        const fs = require('fs');
        fs.writeFileSync('servers.json', JSON.stringify(servers, null, 2));
        console.log(`Saved ${total} servers to servers.json`);
        yield getServerInfo(servers);
    }
    catch (error) {
        console.error('Error:', error);
    }
}))();
//# sourceMappingURL=index.js.map