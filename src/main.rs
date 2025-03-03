mod models;

use std::fs;
use serde_json;
use models::server::Servers;
use models::server::Server;
use models::server::FetchedServer;
use std::collections::HashMap;
use tokio::task::JoinSet;

pub struct ResourceCountsType {
    pub servers: u32,
    pub players: u32
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let data = fs::read_to_string("./servers.json")?;

    let servers: Servers = serde_json::from_str(&data)?;

    let mut stop = 0;
    let mut resource_counts: HashMap<String, ResourceCountsType> = HashMap::new();

    let mut join_set: JoinSet<Option<(String, Vec<String>)>> = JoinSet::new();
    let max_concurrency = 10;

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
                    process_result(result, &mut resource_counts, &mut stop, &server_data);
                    if stop >= 10000 {
                        break 'crone;
                    }
                }
            }

            join_set.spawn(async move {
                match reqwest::get(&url).await {
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

    let mut resource_vec: Vec<(&String, &ResourceCountsType)> = resource_counts.iter().collect();

    resource_vec.sort_by(|a, b| b.1.servers.cmp(&a.1.servers));
    
    println!("\nTop 10 Most Used Resources by Servers:");
    for (i, (resource, counts)) in resource_vec.iter().take(10).enumerate() {
        println!(
            "{}. {} - Servers: {}, Players: {}",
            i + 1, resource, counts.servers, counts.players
        );
    }

    Ok(())
}

fn process_result(
    result: Result<Option<(String, Vec<String>)>, tokio::task::JoinError>,
    resource_counts: &mut HashMap<String, ResourceCountsType>,
    stop: &mut usize,
    server_data: &Server,
) {
    if let Ok(Some((url, resources))) = result {
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
}