#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;
use std::sync::OnceLock;
use std::time::Duration;

fn validate_http_base_url(base: &str) -> Result<String, String> {
    let b = base.trim();
    if b.is_empty() {
        return Err("base_url 不能为空".to_string());
    }
    if !b.starts_with("http://") && !b.starts_with("https://") {
        return Err("base_url 必须以 http:// 或 https:// 开头".to_string());
    }
    Ok(b.trim_end_matches('/').to_string())
}

fn http_client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(10))
            .pool_idle_timeout(Duration::from_secs(90))
            .build()
            .expect("reqwest client init")
    })
}

/// 探测 `host:port` 上是否有 TCP 服务在 accept（短超时，用于自动启动前避免重复占用）。
#[tauri::command]
fn runtime_tcp_listening(host: String, port: u16) -> bool {
    use std::net::{SocketAddr, TcpStream, ToSocketAddrs};
    let host = host.trim();
    if host.is_empty() {
        return false;
    }
    let spec = format!("{}:{}", host, port);
    let mut addrs = match spec.to_socket_addrs() {
        Ok(a) => a,
        Err(_) => return false,
    };
    let addr: SocketAddr = match addrs.next() {
        Some(a) => a,
        None => return false,
    };
    TcpStream::connect_timeout(&addr, Duration::from_millis(450)).is_ok()
}

#[derive(Deserialize)]
struct PackFileEntry {
    path: String,
    content: String,
}

#[derive(Deserialize)]
struct BinaryFileEntry {
    path: String,
    base64: String,
}

/// Writes `{roles_root}/{path}` for each entry (same layout as `buildRolePackFiles` in the frontend).
#[tauri::command]
fn write_role_pack_files(roles_root: String, files: Vec<PackFileEntry>) -> Result<(), String> {
    use std::fs;
    use std::path::PathBuf;

    let root = PathBuf::from(&roles_root);
    if !root.is_dir() {
        return Err("所选路径不是目录".to_string());
    }

    for f in files {
        let rel = f.path.replace('\\', "/");
        let rel = rel.trim_start_matches('/');
        if rel.is_empty() {
            return Err("空相对路径".to_string());
        }
        for part in rel.split('/') {
            if part.is_empty() || part == "." || part == ".." {
                return Err(format!("非法相对路径：{}", f.path));
            }
        }
        let dest = root.join(rel);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&dest, f.content.as_bytes()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 写入二进制文件（如 `assets/images/*.png`），`base64` 为标准编码内容。
#[tauri::command]
fn write_role_pack_binaries(roles_root: String, files: Vec<BinaryFileEntry>) -> Result<(), String> {
    use base64::Engine;
    use std::fs;
    use std::path::PathBuf;

    let root = PathBuf::from(&roles_root);
    if !root.is_dir() {
        return Err("所选路径不是目录".to_string());
    }

    for f in files {
        let rel = f.path.replace('\\', "/");
        let rel = rel.trim_start_matches('/');
        if rel.is_empty() {
            return Err("空相对路径".to_string());
        }
        for part in rel.split('/') {
            if part.is_empty() || part == "." || part == ".." {
                return Err(format!("非法相对路径：{}", f.path));
            }
        }
        let dest = root.join(rel);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(f.base64.trim())
            .map_err(|e| format!("base64 解码失败：{}", e))?;
        fs::write(&dest, bytes).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn runtime_api_health(base_url: String) -> Result<String, String> {
    let base = validate_http_base_url(&base_url)?;
    let url = format!("{}/health", base);
    let client = http_client();
    let r = client
        .get(&url)
        .timeout(Duration::from_secs(4))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !r.status().is_success() {
        return Err(format!("HTTP {}", r.status()));
    }
    r.text().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn runtime_api_chat(
    base_url: String,
    role_path: String,
    message: String,
    session_id: Option<String>,
) -> Result<String, String> {
    let base = validate_http_base_url(&base_url)?;
    let url = format!("{}/chat", base);
    let client = http_client();
    let body = serde_json::json!({
        "role_path": role_path,
        "message": message,
        "session_id": session_id
    });
    let r = client
        .post(&url)
        .timeout(Duration::from_secs(300))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = r.status();
    let text = r.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(text);
    }
    let v: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("解析 JSON：{}", e))?;
    v.get("reply")
        .and_then(|x| x.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "响应缺少 reply".to_string())
}

/// 启动本机 oclive 可执行文件（`--api --port`），用于试聊前拉起运行时。
#[tauri::command]
fn spawn_oclive_api(exe_path: String, port: u16, host: String) -> Result<(), String> {
    if exe_path.trim().is_empty() {
        return Err("可执行文件路径不能为空".to_string());
    }
    let host = host.trim();
    let host = if host.is_empty() { "127.0.0.1" } else { host };
    if runtime_tcp_listening(host.to_string(), port) {
        return Err(format!(
            "端口 {} 已在监听。若已是 oclive API，请使用「检测 API」；否则请换端口或结束占用进程。",
            port
        ));
    }
    let mut cmd = std::process::Command::new(&exe_path);
    cmd.arg("--api").arg("--port").arg(port.to_string());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NEW_CONSOLE: u32 = 0x00000010;
        cmd.creation_flags(CREATE_NEW_CONSOLE);
    }
    cmd.spawn()
        .map_err(|e| format!("启动失败：{}", e))?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            write_role_pack_files,
            write_role_pack_binaries,
            runtime_tcp_listening,
            runtime_api_health,
            runtime_api_chat,
            spawn_oclive_api,
        ])
        .run(tauri::generate_context!())
        .expect("error while running oclive-pack-editor");
}
