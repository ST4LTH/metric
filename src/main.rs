mod models;
mod components;

use serde_json::{self, json};
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use models::server::{FetchedServers, ResourceData};
use std::fs;
use std::sync::{Arc, Mutex};
use std::time::Instant; 
use humantime::format_duration;
use components::fetcher::Fetcher;
use components::sorter::Sorter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let start_time = Instant::now();

    let data = fs::read_to_string("./servers.json")?;

    let mut servers: FetchedServers = Fetcher::fetch_identifiers(serde_json::from_str(&data)?).await;

    Sorter::process_resources(&mut servers);

    let servers_shared = Arc::new(Mutex::new(servers));

    let bind = "127.0.0.1:8080";

    let elapsed_time = start_time.elapsed();
    println!("API startup completed in: {}", format_duration(elapsed_time));
    println!("API running on: http://{}/", bind);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(servers_shared.clone()))
            .route("/top-resources", web::get().to(get_top_resources))
            .route("/resource/{resourceId}", web::get().to(get_resource_by_id))
    })
    .bind(bind)?
    .run()
    .await?;

    Ok(())
}

async fn get_resource_by_id(
    resource_id: web::Path<String>, 
    servers_data: web::Data<Arc<Mutex<FetchedServers>>>,
) -> impl Responder {
    let resource_id = resource_id.into_inner();

    let servers = servers_data.lock().unwrap();

    if let Some(resource_data) = servers.resources.get(&resource_id) {
        let response = json!({
            "resource": resource_id,
            "servers": resource_data.servers.len(),
            "players": resource_data.players,
        });
        HttpResponse::Ok().json(response)
    } else {
        HttpResponse::NotFound().body(format!("Resource '{}' not found", resource_id))
    }
}

async fn get_top_resources(
    servers_data: web::Data<Arc<Mutex<FetchedServers>>>,
) -> impl Responder {
    let servers = servers_data.lock().unwrap();
    let mut resource_vec: Vec<(&String, &ResourceData)> = servers.resources.iter().collect();

    resource_vec.sort_by(|a, b| b.1.servers.len().cmp(&a.1.servers.len()));

    let top_resources: Vec<_> = resource_vec
        .iter()
        .take(10)
        .map(|(resource, data)| {
            json!({
                "resource": resource,
                "servers": data.servers.len(),
                "players": data.players,
            })
        })
        .collect();

    HttpResponse::Ok().json(top_resources)
}