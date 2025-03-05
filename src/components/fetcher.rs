use crate::models::server::{FetchedServer, FetchedServers, Server, Servers};

use std::collections::HashMap;
use actix_web::web::head;
use tokio::task::JoinSet;
use url::Url;
use std::time::Duration;
use reqwest::Client;

pub struct Fetcher;

impl Fetcher {
    pub async fn fetch_data(url: &str) -> Option<FetchedServer> {
        let client = Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .timeout(Duration::from_secs(5))
            .build()
            .expect("Failed to build the HTTP client");

        let url = format!("{}info.json", url);

        match client.get(&url).send().await {
            Ok(response) => {
                if response.status().is_success() {
/*                     match response.json::<FetchedServer>().await {
                        return response
                    } */
                    match response.json::<FetchedServer>().await {
                        Ok(server) => {
                            return Some(server)
                        },
                        Err(e) => {
                            eprintln!("Failed to deserialize response from {}: {}", url, e);
                        }
                    }
                } else {
                    eprintln!(
                        "Failed to connect to endpoint {}: HTTP Status {}",
                        url,
                        response.status()
                    );
                }
            }
            Err(err) => {
                eprintln!("Error connecting to endpoint {}: {}", url, err);
            }
        }
    
        None
    }
    
    pub async fn fetch_redirect_token(url: &str) -> Option<String> {
        let client = Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .timeout(Duration::from_secs(5))
            .build()
            .expect("Failed to build the HTTP client");
    
        match client.get(url).send().await {
            Ok(response) => {
                if response.status().is_redirection() {
                    if let Some(location) = response.headers().get("Location") {
                        if let Ok(location_str) = location.to_str() {
                            if let Ok(redirect_url) = Url::parse(location_str) {
                                if let Some(token) = redirect_url.path_segments().and_then(|segments| segments.last()) {
                                    return Some(token.to_string());
                                }
                            }
                        }
                    }
                } else {
                    eprintln!("Response is not a redirect: {}", response.status());
                }
            }
            Err(err) => {
                eprintln!("Error sending request: {}", err);
            }
        }
    
        None
    }
    
    pub async fn fetch_identifiers(servers: Servers) -> FetchedServers {
        let mut stop = 0; // maximum count
        const MAX_PROCESSED: usize = 5000000; // maximum fetched
        const MAX_CONCURRENCY: usize = 200; // Concurrent tasks 

        let mut join_set: JoinSet<Option<(String, FetchedServer)>> = JoinSet::new();
        let mut table: FetchedServers = FetchedServers::default();
    
        'crone: for (_host, server_data) in servers.servers {
            if stop > MAX_PROCESSED {
                break 'crone
            }
            stop += 1;

            if server_data.connectEndPoints.is_empty() {
                println!("{}: No endpoints available for this server.", stop);
                continue;
            }
            
            if let Some(endpoint) = server_data.connectEndPoints.get(0) {
                if endpoint.starts_with("http") {
                    println!("{}: Skipping HTTP endpoint: {}", stop, endpoint);
                    continue;
                }

                let url = format!("http://{}/", endpoint);

                while join_set.len() >= MAX_CONCURRENCY {
                    if let Some(result) = join_set.join_next().await {
                        if let Some((token, fetched_server)) = result.unwrap_or(None) {
                            table.servers.insert(token, fetched_server);
                        }
                    }
                }

                let server_data = server_data.clone();
                let url_clone = url.clone();
                let endpoint: String = endpoint.clone();

                join_set.spawn(async move {
                    if let Some(token) = Self::fetch_redirect_token(&url_clone).await {
                        println!("{}: Extracted token: {}", stop, token);

                        if let Some(mut data) = Self::fetch_data(&url_clone).await {
                            data.clients = Some(server_data.clients.unwrap_or(0)); 

                            Some((token, data))
                        } else {
                            println!("{}: Failed data fetch.", stop);
                            None
                        }
                    } else {
                        if let Some(mut data) = Self::fetch_data(&url_clone).await {
                            data.clients = Some(server_data.clients.unwrap_or(0)); 

                            Some((endpoint, data));
                        }

                        println!("{}: Failed data fetch.", stop);
                        None
                    }
                });
            } else {
                println!("{}: No valid endpoints available for this server.", stop);
            }
        }
    
        while let Some(result) = join_set.join_next().await {
            if let Some((token, server_data)) = result.unwrap_or(None) {
                table.servers.insert(
                    token,
                    server_data,
                );
            }
        }
    
        table
    }
}