use crate::models::server::{Servers, Server, FetchedServer, ResourceCountsType};

use std::collections::HashMap;
use tokio::task::JoinSet;
use std::time::Duration;
use reqwest::Client;

pub struct Fetcher;

impl Fetcher {
    pub async fn fetch(
        servers: Servers,
        resource_counts: &mut HashMap<String, ResourceCountsType>
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut stop: usize = 0; // stop value
        const MAX_PROCESSED: usize = 500; // maximum fetched
        let mut join_set: JoinSet<Option<(String, Vec<String>)>> = JoinSet::new();
        let max_concurrency = 200; // Concurrent tasks 
        let client = Client::builder()
            .timeout(Duration::from_secs(3)) // Timeout
            .build()?;

        'crone: for (_host, server_data) in servers.servers {
            if server_data.connectEndPoints.is_empty() {
                println!("No endpoints available for this server.");
                continue;
            }

            if let Some(endpoint) = server_data.connectEndPoints.first() {

                if endpoint.starts_with("http") {
                    continue
                }

                let url = format!("http://{}/info.json", endpoint);

                if join_set.len() >= max_concurrency {
                    while let Some(result) = join_set.join_next().await {
                        Self::process_result(result, resource_counts, &mut stop, &server_data)?;
                        if stop >= MAX_PROCESSED {
                            break 'crone; 
                        }
                    }
                }

                let client_clone = client.clone();
                join_set.spawn(async move {
                    match client_clone.get(&url).send().await {
                        Ok(response) => {
                            if response.status().is_success() {
                                match response.json::<FetchedServer>().await {
                                    Ok(server) => Some((url, server.resources)),
                                    Err(e) => {
                                        eprintln!("Failed to deserialize response from {}: {}", url, e);
                                        None
                                    }
                                }
                            } else {
                                eprintln!(
                                    "Failed to connect to endpoint {}: HTTP Status {}",
                                    url,
                                    response.status()
                                );
                                None
                            }
                        }
                        Err(err) => {
                            eprintln!("Error connecting to endpoint {}: {}", url, err);
                            None
                        }
                    }
                });
            }
        }

        Ok(())
    }

    pub fn process_result(
        result: Result<Option<(String, Vec<String>)>, tokio::task::JoinError>,
        resource_counts: &mut HashMap<String, ResourceCountsType>,
        stop: &mut usize,
        server_data: &Server,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if let Ok(Some((_url, resources))) = result {
            for resource in resources {
                let entry = resource_counts.entry(resource.clone()).or_insert(ResourceCountsType { servers: 0, players: 0 });
                entry.servers += 1;
    
                if let Some(client_count) = server_data.clients {
                    entry.players += client_count;
                }
            }
    
            *stop += 1;
            println!("Processed {} servers.", stop);
        }
        Ok(())
    }
}