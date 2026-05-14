#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod plugin_rpc;

use serde::Deserialize;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::OnceLock;
use std::time::Duration;

use oclive_validation::manifest::DiskRoleManifest;
use oclive_validation::merge_role_pack_scene_ids;

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
            .user_agent(concat!("oclive-pack-editor/", env!("CARGO_PKG_VERSION")))
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
    scene_id: Option<String>,
) -> Result<String, String> {
    let base = validate_http_base_url(&base_url)?;
    let url = format!("{}/chat", base);
    let client = http_client();
    let body = serde_json::json!({
        "role_path": role_path,
        "message": message,
        "session_id": session_id,
        "scene_id": scene_id
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
    if v.get("reply").and_then(|x| x.as_str()).is_none() {
        return Err("响应缺少 reply".to_string());
    }
    Ok(text)
}

/// 读取角色目录下 `manifest.json` 的 `scenes` 数组（试聊场景下拉）。
#[tauri::command]
fn read_role_manifest_scenes(role_dir: String) -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::PathBuf;

    let dir = role_dir.trim();
    if dir.is_empty() {
        return Err("角色目录不能为空".to_string());
    }
    let p = PathBuf::from(dir).join("manifest.json");
    if !p.is_file() {
        return Err(format!("未找到 manifest：{}", p.display()));
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    let v: serde_json::Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    let scenes = v
        .get("scenes")
        .and_then(|s| s.as_array())
        .ok_or_else(|| "manifest 缺少 scenes 数组".to_string())?;
    Ok(scenes
        .iter()
        .filter_map(|x| x.as_str().map(str::to_string))
        .collect())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UiSlotVariantInfo {
    slot: String,
    appearance_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    label: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DirectoryPluginInfo {
    id: String,
    version: String,
    provides: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    plugin_type: Option<String>,
    is_shell: bool,
    ui_slot_names: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    ui_slot_variants: Vec<UiSlotVariantInfo>,
}

fn collect_directory_plugins_from_root(
    root: &std::path::Path,
    out: &mut HashMap<String, DirectoryPluginInfo>,
) -> Result<(), String> {
    use std::fs;
    if !root.is_dir() {
        return Ok(());
    }
    for ent in fs::read_dir(root).map_err(|e| e.to_string())? {
        let ent = ent.map_err(|e| e.to_string())?;
        let p = ent.path();
        if !p.is_dir() {
            continue;
        }
        let mf = p.join("manifest.json");
        if !mf.is_file() {
            continue;
        }
        let raw = fs::read_to_string(&mf).map_err(|e| e.to_string())?;
        let v: serde_json::Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
        if v.get("schema_version")
            .and_then(|x| x.as_u64())
            .unwrap_or(0)
            != 1
        {
            continue;
        }
        let id = v
            .get("id")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .trim()
            .to_string();
        if id.is_empty() {
            continue;
        }
        let version = v
            .get("version")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .to_string();
        let provides: Vec<String> = v
            .get("provides")
            .and_then(|x| x.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|i| {
                        i.as_str()
                            .map(str::trim)
                            .filter(|s| !s.is_empty())
                            .map(str::to_string)
                    })
                    .collect()
            })
            .unwrap_or_default();
        let plugin_type = v.get("type").and_then(|x| x.as_str()).map(str::to_string);
        let is_shell = v.get("shell").is_some();
        let mut ui_slot_variants: Vec<UiSlotVariantInfo> = Vec::new();
        let mut ui_slot_names: Vec<String> = Vec::new();
        if let Some(arr) = v.get("ui_slots").and_then(|x| x.as_array()) {
            let mut seen_slot: std::collections::HashSet<String> = std::collections::HashSet::new();
            for o in arr {
                let Some(slot) = o.get("slot").and_then(|s| s.as_str()).map(str::trim) else {
                    continue;
                };
                if slot.is_empty() {
                    continue;
                }
                let appearance_id = o
                    .get("appearance_id")
                    .or_else(|| o.get("appearanceId"))
                    .and_then(|x| x.as_str())
                    .unwrap_or("")
                    .trim()
                    .to_string();
                let label = o
                    .get("label")
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string());
                ui_slot_variants.push(UiSlotVariantInfo {
                    slot: slot.to_string(),
                    appearance_id,
                    label,
                });
                if seen_slot.insert(slot.to_string()) {
                    ui_slot_names.push(slot.to_string());
                }
            }
        }
        out.insert(
            id.clone(),
            DirectoryPluginInfo {
                id,
                version,
                provides,
                plugin_type,
                is_shell,
                ui_slot_names,
                ui_slot_variants,
            },
        );
    }
    Ok(())
}

/// 扫描目录插件：`roles_root` 非空时扫描 **其上一级** 的 `plugins/` 与 **当前工作目录** 的 `plugins/`（与主程序导出后行为一致）；
/// `roles_root` 为空或省略时扫描 **`PLUGINS_GLOBAL_PATH`**（若设置）、**应用数据目录** `plugins/`、以及 **cwd** `plugins/`。
#[tauri::command]
fn list_directory_plugins_for_roles_root(
    app: tauri::AppHandle,
    roles_root: Option<String>,
) -> Result<Vec<DirectoryPluginInfo>, String> {
    use std::path::{Path, PathBuf};
    let mut map = HashMap::new();
    let trimmed = roles_root
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("");

    if !trimmed.is_empty() {
        let root = PathBuf::from(trimmed);
        if let Some(parent) = root.parent() {
            let p = parent.join("plugins");
            collect_directory_plugins_from_root(&p, &mut map)?;
        }
        collect_directory_plugins_from_root(&PathBuf::from("plugins"), &mut map)?;
    } else {
        if let Ok(v) = std::env::var("PLUGINS_GLOBAL_PATH") {
            let t = v.trim();
            if !t.is_empty() {
                collect_directory_plugins_from_root(Path::new(t), &mut map)?;
            }
        }
        if let Some(ad) = app.path_resolver().app_data_dir() {
            collect_directory_plugins_from_root(&ad.join("plugins"), &mut map)?;
        }
        collect_directory_plugins_from_root(&PathBuf::from("plugins"), &mut map)?;
    }

    let mut v: Vec<DirectoryPluginInfo> = map.into_values().collect();
    v.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(v)
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
    cmd.spawn().map_err(|e| format!("启动失败：{}", e))?;
    Ok(())
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path.trim()).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    use std::fs;
    use std::path::Path;
    let p = Path::new(path.trim());
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(p, content.as_bytes()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn directory_plugin_jsonrpc_invoke(
    plugin_id: String,
    method: String,
    params: serde_json::Value,
    search_roots: Vec<String>,
) -> Result<serde_json::Value, String> {
    tokio::task::spawn_blocking(move || {
        plugin_rpc::invoke_directory_plugin_jsonrpc(plugin_id, method, params, search_roots)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RolePackEditorLoad {
    manifest_text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    settings_text: Option<String>,
    merged_scene_ids: Vec<String>,
}

/// 读取角色包根目录下的 `manifest.json`、可选 `settings.json`，并合并 `manifest.scenes` 与 `scenes/` 子目录。
#[tauri::command]
fn load_role_pack_for_editor(role_dir: String) -> Result<RolePackEditorLoad, String> {
    use std::fs;
    use std::path::PathBuf;

    let root = PathBuf::from(role_dir.trim());
    if !root.is_dir() {
        return Err("所选路径不是目录".into());
    }
    let manifest_path = root.join("manifest.json");
    if !manifest_path.is_file() {
        return Err(format!("未找到 manifest.json：{}", manifest_path.display()));
    }
    let manifest_text = fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
    let settings_path = root.join("settings.json");
    let settings_text = if settings_path.is_file() {
        Some(fs::read_to_string(&settings_path).map_err(|e| e.to_string())?)
    } else {
        None
    };
    let scenes_for_merge: Vec<String> = match serde_json::from_str::<DiskRoleManifest>(&manifest_text) {
        Ok(m) => m.scenes,
        Err(_) => Vec::new(),
    };
    let merged_scene_ids =
        merge_role_pack_scene_ids(&root, &scenes_for_merge).map_err(|e| e.to_string())?;
    Ok(RolePackEditorLoad {
        manifest_text,
        settings_text,
        merged_scene_ids,
    })
}

/// 写回 `manifest.json` 与 `settings.json`（后者不存在目录时也会创建）。
#[tauri::command]
fn save_role_pack_editor(role_dir: String, manifest_text: String, settings_text: String) -> Result<(), String> {
    use std::fs;
    use std::path::PathBuf;

    let root = PathBuf::from(role_dir.trim());
    if !root.is_dir() {
        return Err("所选路径不是目录".into());
    }
    let mp = root.join("manifest.json");
    fs::write(&mp, manifest_text.as_bytes()).map_err(|e| e.to_string())?;
    let sp = root.join("settings.json");
    if let Some(parent) = sp.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&sp, settings_text.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            write_role_pack_files,
            write_role_pack_binaries,
            read_text_file,
            write_text_file,
            runtime_tcp_listening,
            runtime_api_health,
            runtime_api_chat,
            read_role_manifest_scenes,
            spawn_oclive_api,
            list_directory_plugins_for_roles_root,
            directory_plugin_jsonrpc_invoke,
            load_role_pack_for_editor,
            save_role_pack_editor,
        ])
        .run(tauri::generate_context!())
        .expect("error while running oclive-pack-editor");
}
