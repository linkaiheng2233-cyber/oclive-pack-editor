//! Spawn a directory plugin RPC child (OCLIVE_READY) and POST one JSON-RPC request.
//! Used by the pack editor to call `com.oclive.official_vue_test_runner` without the full desktop plugin DB.

use serde_json::{json, Value};
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Duration;

const READY_PREFIX: &str = "OCLIVE_READY";

fn resolve_plugin_dir(plugin_id: &str, search_roots: &[String]) -> Result<PathBuf, String> {
    let pid = plugin_id.trim();
    if pid.is_empty() {
        return Err("plugin_id required".into());
    }
    for r in search_roots {
        let base = PathBuf::from(r.trim());
        if base.as_os_str().is_empty() {
            continue;
        }
        let a = base.join("plugins").join(pid);
        if a.join("manifest.json").is_file() {
            return Ok(a);
        }
        let b = base.join(pid);
        if b.join("manifest.json").is_file() {
            return Ok(b);
        }
        // Folder name may differ from manifest `id` (e.g. `plugins/official-vue-test-runner/`).
        let plugins_dir = base.join("plugins");
        if let Ok(rd) = std::fs::read_dir(&plugins_dir) {
            for ent in rd.flatten() {
                let p = ent.path();
                if !p.is_dir() {
                    continue;
                }
                let mf = p.join("manifest.json");
                if !mf.is_file() {
                    continue;
                }
                let raw = match std::fs::read_to_string(&mf) {
                    Ok(s) => s,
                    Err(_) => continue,
                };
                let v: Value = match serde_json::from_str(&raw) {
                    Ok(v) => v,
                    Err(_) => continue,
                };
                if v.get("id").and_then(|x| x.as_str()).map(str::trim) == Some(pid) {
                    return Ok(p);
                }
            }
        }
    }
    Err(format!(
        "manifest.json not found for plugin {:?} under search_roots ({} entries)",
        pid,
        search_roots.len()
    ))
}

/// One-shot JSON-RPC: spawn plugin process, read `OCLIVE_READY` URL, POST body, kill child.
pub fn invoke_directory_plugin_jsonrpc(
    plugin_id: String,
    method: String,
    params: Value,
    search_roots: Vec<String>,
) -> Result<Value, String> {
    let dir = resolve_plugin_dir(plugin_id.trim(), &search_roots)?;
    let manifest_raw =
        std::fs::read_to_string(dir.join("manifest.json")).map_err(|e| e.to_string())?;
    let manifest: Value = serde_json::from_str(&manifest_raw).map_err(|e| e.to_string())?;
    let proc = manifest
        .get("process")
        .ok_or_else(|| "manifest.json: missing process".to_string())?;
    let command = proc
        .get("command")
        .and_then(|x| x.as_str())
        .unwrap_or("node");
    let args_v = proc
        .get("args")
        .and_then(|a| a.as_array())
        .ok_or_else(|| "manifest.json: process.args must be array".to_string())?;
    let args: Vec<String> = args_v
        .iter()
        .filter_map(|v| v.as_str().map(String::from))
        .collect();
    if args.is_empty() {
        return Err("manifest.json: process.args empty".into());
    }

    let mut child = Command::new(command)
        .args(&args)
        .current_dir(&dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null())
        .spawn()
        .map_err(|e| format!("spawn {command}: {e}"))?;

    let stdout = child.stdout.take().ok_or("child stdout")?;
    let (tx, rx) = std::sync::mpsc::channel::<Result<String, String>>();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            let t = line.trim();
            if let Some(rest) = t.strip_prefix(READY_PREFIX) {
                let url = rest.trim().to_string();
                if url.starts_with("http://") || url.starts_with("https://") {
                    let _ = tx.send(Ok(url));
                    return;
                }
            }
        }
        let _ = tx.send(Err("no OCLIVE_READY line on stdout".into()));
    });

    let url = match rx.recv_timeout(Duration::from_secs(30)) {
        Ok(Ok(u)) => u,
        Ok(Err(e)) => {
            let _ = child.kill();
            return Err(e);
        }
        Err(_) => {
            let _ = child.kill();
            return Err("timeout waiting for OCLIVE_READY".into());
        }
    };

    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(900))
        .build()
        .map_err(|e| e.to_string())?;
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method.trim(),
        "params": params,
    });
    let resp = client
        .post(&url)
        .header("x-oclive-remote-protocol", "oclive-remote-jsonrpc-v1")
        .json(&body)
        .send()
        .map_err(|e| format!("rpc http: {e}"))?;
    let status = resp.status();
    let text = resp.text().map_err(|e| e.to_string())?;
    let _ = child.kill();

    if !status.is_success() {
        return Err(format!(
            "rpc http status {} — {}",
            status,
            text.chars().take(500).collect::<String>()
        ));
    }
    serde_json::from_str(&text).map_err(|e| {
        format!(
            "rpc json: {e} — {}",
            text.chars().take(400).collect::<String>()
        )
    })
}
