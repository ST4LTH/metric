use crate::models::server::{FetchedServers, ResourceData};

pub struct Sorter;

impl Sorter {
    pub fn process_resources(servers: &mut FetchedServers) {
        for (id, server_data) in &servers.servers {
            if server_data.resources.is_empty() {
                continue;
            }
    
            for resource in &server_data.resources {
                let client_count = server_data.clients.unwrap_or(0);
    
                if !servers.resources.contains_key(resource) {
                    servers.resources.insert(
                        resource.clone(),
                        ResourceData {
                            servers: vec![id.clone()],
                            players: client_count, 
                        },
                    );
                    continue;
                }
    
                if let Some(resource_data) = servers.resources.get_mut(resource) {
                    resource_data.servers.push(id.clone());
                    resource_data.players += client_count; 
                }
            }
        }
    }
}