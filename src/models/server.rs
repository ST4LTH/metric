use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub struct ResourceCountsType {
    pub servers: u32,
    pub players: u32
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FetchedServer {
    pub enhancedHostSupport: Option<bool>,
    #[serde(rename = "ignore_icon")]
    pub icon: Option<i64>,
    pub requestSteamTicket: Option<String>,
    pub resources: Vec<String>,
    pub server: Option<String>,
    pub vars: Vars,
    pub version: Option<u32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Server {
    pub svMaxclients: Option<u32>,
    pub clients: Option<u32>,
    pub hostname: Option<String>,
    pub gametype: Option<String>,
    pub mapname: Option<String>,
    pub server: String,
    pub iconVersion: Option<i64>, 
    pub vars: Vars,
    pub enhancedHostSupport: bool,
    pub upvotePower: Option<u32>,
    pub connectEndPoints: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Vars {
    pub Discord: Option<String>,
    pub Owner: Option<String>,
    pub sv_licenseKeyToken: Option<String>,
    pub sv_maxClients: Option<String>,
    pub sv_pureLevel: Option<String>,
    pub onesync_enabled: Option<String>,
    pub sv_disableClientReplays: Option<String>,
    pub sv_lan: Option<String>,
    pub locale: Option<String>,
    pub sv_projectName: Option<String>,
    pub sv_scriptHookAllowed: Option<String>,
    pub banner_detail: Option<String>,
    pub gamename: Option<String>,
    pub banner_connecting: Option<String>,
    pub sv_enforceGameBuild: Option<String>,
    pub sv_projectDesc: Option<String>,
    pub tags: Option<String>,
    pub premium: Option<String>,
    pub activitypubFeed: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Servers {
    #[serde(flatten)] // Use flatten to handle dynamic keys
    pub servers: HashMap<String, Server>,
}