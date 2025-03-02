import { master } from './master';
import { FrameReader } from "./components/framereader";
import { fetcher } from "./components/fetcher";
import { serversDataType } from './types';

export class Deferred<T = undefined> {
  resolve!: {
      (): void;
      (v: T): void;
  };
  reject!: (err?: any) => void;

  promise: Promise<T>;

  constructor() {
      this.promise = new Promise<T>((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
      });
  }
}

export function decodeServer(frame: Uint8Array): any {
  return master.Server.decode(frame);
}

const BASE_URL = 'https://servers-frontend.fivem.net/api/servers';
const ALL_SERVERS_URL = `${BASE_URL}/streamRedir/`;
async function readBodyToServers(gameName = 'gta5', onServer: (server: any) => void, body: ReadableStream<Uint8Array>): Promise<void> {
  const deferred = new Deferred<void>();

  let decodeTime = 0;
  let transformTime = 0;
  let onServerTime = 0;

  const frameReader = new FrameReader(
    body,
    (frame) => {
      let s = performance.now();
      const srv = decodeServer(frame);
      decodeTime += performance.now() - s;

      if (srv.EndPoint && srv.Data) {
        const serverGameName = srv.Data?.vars?.gamename;

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
    },
    deferred.resolve,
  );

  frameReader.read();

  await deferred.promise;

  console.log('Times: decode', decodeTime, 'ms, transform', transformTime, 'ms, onServer', onServerTime, 'ms');
}

export async function getAllServers(gameName = 'gta5', onServer: (server: any) => void): Promise<void> {
  console.time('Total getAllServers');

  const { body } = await fetcher.fetch(new Request(ALL_SERVERS_URL));
  if (!body) {
    console.timeEnd('Total getAllServers');
    throw new Error('Empty body of all servers stream');
  }

  await readBodyToServers(gameName, onServer, body);

  console.timeEnd('Total getAllServers');
}

export async function getServerInfo(servers: serversDataType) {
  const endpoints = Object.entries(servers).filter(([key, server]) => {
    return server.connectEndPoints && server.connectEndPoints.length > 0 && !server.connectEndPoints[0].startsWith("https");
  }).map(([key, server]) => ({
    endpoint: server.connectEndPoints[0],
    serverData: server
  }));

  const concurrency = 10;
  const maxRequests = 1000;
  let requestCount = 0;
  const resourceCounts: { [key: string]: { servers: number; players: number } } = {};

  const chunkSize = concurrency;
  const chunks = Math.ceil(endpoints.length / chunkSize);

  for (let i = 0; i < chunks; i++) {
    const chunk = endpoints.slice(i * chunkSize, (i + 1) * chunkSize);
    await Promise.all(
      chunk.map(async ({ endpoint, serverData }) => {
        if (requestCount >= maxRequests) return;
        requestCount++;
        
        try {
          const response = await Promise.race([
            fetcher.fetch(`http://${endpoint}/info.json`),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000)),
          ]);
          if (!response.ok) return;
          const dynamicData = await response.json();
          if (dynamicData.resources && Array.isArray(dynamicData.resources)) {
            dynamicData.resources.forEach((resource:string) => {
              if (typeof resource === 'string') {
                resourceCounts[resource] = {
                  servers: (resourceCounts[resource]?.servers || 0) + 1,
                  players: (resourceCounts[resource]?.players || 0) + (serverData.clients || 0),
                };
              }
            });
          }
        } catch (error) {
          console.log(`Error fetching ${endpoint}:`);
        }
      })
    );
  }

  const topResourcesByServers = Object.entries(resourceCounts)
    .sort((a, b) => b[1].servers - a[1].servers)
    .slice(0, 10);

  console.log('Top 10 Most Common Resources by Number of Servers:');
  topResourcesByServers.forEach(([resource, { servers, players }], index) => {
    console.log(`${index + 1}. ${resource} - Servers: ${servers}, Players: ${players}`);
  });
}

(async () => {
  try {
    const servers: serversDataType = {};
    let total = 0;

    await getAllServers('gta5', (data) => {
      if (data.connectEndPoints && data.hostname) { 
        servers[data.hostname] = data;
        total++;
      }
    });

    const fs = require('fs');
    fs.writeFileSync('servers.json', JSON.stringify(servers, null, 2));
    console.log(`Saved ${total} servers to servers.json`);

    await getServerInfo(servers);
  } catch (error) {
    console.error('Error:', error);
  }
})();