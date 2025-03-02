
export type serversDataType = { [key: string]: serverDataType }
export type serverDataType  = {
    svMaxclients: number,
    clients: number,
    hostname: string,
    gametype: string,
    mapname: string,
    server: string,
    iconVersion: number,
    vars: {
      sv_projectName: string,
      banner_connecting: string,
      banner_detail: string,
      sv_projectDesc: string,
      tags: string,
      activitypubFeed: string,
      gamename: "gta5",
      sv_enforceGameBuild: string,
      sv_scriptHookAllowed: string,
      premium: string,
      locale: string
    },
    enhancedHostSupport: boolean,
    upvotePower: number,
    connectEndPoints: string[]
}