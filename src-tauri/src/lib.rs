pub mod sessions;

use sessions::{build_index, resolve_agent_dir, SessionSummary};

#[tauri::command]
fn list_sessions() -> Result<Vec<SessionSummary>, String> {
    let agent_dir = resolve_agent_dir().map_err(|error| error.to_string())?;
    build_index(agent_dir).map_err(|error| error.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_sessions])
        .run(tauri::generate_context!())
        .expect("failed to run Pig");
}
