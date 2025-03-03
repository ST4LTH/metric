mod models;
mod components;

use std::fs;
use serde_json;
use models::server::{Servers, ResourceCountsType};
use std::collections::HashMap;
use std::time::{Instant}; 
use humantime::format_duration;
use components::fetcher::Fetcher;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let start_time = Instant::now();

    let data = fs::read_to_string("./servers.json")?;

    let servers: Servers = serde_json::from_str(&data)?;

    let mut resource_counts: HashMap<String, ResourceCountsType> = HashMap::new();

    Fetcher::fetch(servers, &mut resource_counts).await?;

    let mut resource_vec: Vec<(&String, &ResourceCountsType)> = resource_counts.iter().collect();

    resource_vec.sort_by(|a, b| b.1.servers.cmp(&a.1.servers));
    
    println!("\nTop 10 Most Used Resources by Servers:");
    for (i, (resource, counts)) in resource_vec.iter().take(10).enumerate() {
        println!(
            "{}. {} - Servers: {}, Players: {}",
            i + 1, resource, counts.servers, counts.players
        );
    }

    let elapsed_time = start_time.elapsed(); 
    println!("Time taken to fetch and print top 10 servers: {}", format_duration(elapsed_time));

    Ok(())
}
