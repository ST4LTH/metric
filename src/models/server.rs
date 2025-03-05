use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct FetchedServer {
    pub enhancedHostSupport: Option<bool>,
    #[serde(rename = "ignore_icon")]
    pub icon: Option<i64>,
    pub requestSteamTicket: Option<String>,
    pub resources: Vec<String>,
    pub server: Option<String>,
    pub vars: Vars,
    pub version: Option<u32>,
    pub clients: Option<u32>
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
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

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Servers {
    #[serde(flatten)]
    pub servers: HashMap<String, Server>,
}

impl Default for Servers {
    fn default() -> Self {
        Self {
            servers: HashMap::new(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ResourceData {
    pub servers: Vec<String>,
    pub players: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FetchedServers {
    #[serde(flatten)] 
    pub servers: HashMap<String, FetchedServer>,
    pub resources: HashMap<String, ResourceData>,
}

impl Default for FetchedServers {
    fn default() -> Self {
        Self {
            servers: HashMap::new(),
            resources: HashMap::new(),
        }
    }
}