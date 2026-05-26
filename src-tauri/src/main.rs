#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod plugin_rpc;

use serde::Deserialize;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::OnceLock;
use std::time::Duration;

use oclive_validation::blueprint_migrate::build_blueprint_v2_from_legacy_dir;
use oclive_validation::blueprint_v2::{
    slot_registry_to_plugin_backends, validate_blueprint_v2_json_with_context,
    BlueprintV2ValidateContext, SlotRegistryEntry, PIPELINE_BLUEPRINT_FILENAME,
};
use oclive_validation::disk_role_settings::DiskRoleSettings;
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

const REPLY_QUALITY_ANCHOR_REL: &str = "prompts/reply_quality_anchor.md";

/// 读取角色目录下 `pipeline.ocblueprint` 的 `meta.scenes`（试聊场景下拉）。
#[tauri::command]
fn read_role_manifest_scenes(role_dir: String) -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::PathBuf;

    let dir = role_dir.trim();
    if dir.is_empty() {
        return Err("角色目录不能为空".to_string());
    }
    let p = PathBuf::from(dir).join(PIPELINE_BLUEPRINT_FILENAME);
    if !p.is_file() {
        return Err(format!(
            "未找到 v2 蓝图 {}：{}",
            PIPELINE_BLUEPRINT_FILENAME,
            p.display()
        ));
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    let v: serde_json::Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    let scenes = v
        .get("meta")
        .and_then(|m| m.get("scenes"))
        .and_then(|s| s.as_array())
        .ok_or_else(|| "pipeline.ocblueprint 缺少 meta.scenes 数组".to_string())?;
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

fn blueprint_to_legacy_parts(bp: &serde_json::Value) -> Result<(String, String), String> {
    let meta = bp
        .get("meta")
        .ok_or_else(|| "pipeline.ocblueprint 缺少 meta".to_string())?;
    let mut manifest = serde_json::json!({
        "id": meta.get("id"),
        "name": meta.get("name"),
        "version": meta.get("version"),
        "author": meta.get("author"),
        "description": meta.get("description"),
        "default_personality": meta.get("personality"),
        "user_relations": meta.get("relations"),
        "default_relation": meta.get("default_relation"),
        "scenes": meta.get("scenes"),
        "evolution": meta.get("evolution"),
        "memory_config": meta.get("memory_config"),
        "identity_binding": meta.get("identity_binding"),
        "dev_only": meta.get("dev_only"),
        "knowledge": meta.get("knowledge"),
        "life_trajectory": meta.get("life_trajectory"),
        "life_schedule": meta.get("life_schedule"),
        "min_runtime_version": meta.get("min_runtime_version"),
        "creator_message_to_downloader": meta.get("creator_message_to_downloader"),
    });
    if let Some(m) = meta.get("ollama_model") {
        manifest["ollama_model"] = m.clone();
    }

    let slot_registry = bp
        .get("slot_registry")
        .ok_or_else(|| "pipeline.ocblueprint 缺少 slot_registry".to_string())?;
    let slot_registry: std::collections::BTreeMap<String, SlotRegistryEntry> =
        serde_json::from_value(slot_registry.clone())
            .map_err(|e| format!("slot_registry 解析失败: {}", e))?;
    let pb = serde_json::to_value(slot_registry_to_plugin_backends(&slot_registry))
        .map_err(|e| e.to_string())?;
    let mut settings = serde_json::json!({
        "schema_version": 1,
        "model": meta.get("ollama_model").unwrap_or(&serde_json::json!("qwen2.5:7b")),
        "identity_binding": meta.get("identity_binding").unwrap_or(&serde_json::json!("per_scene")),
        "interaction_mode": meta.get("interaction_mode").unwrap_or(&serde_json::json!("immersive")),
        "evolution": meta.get("evolution"),
        "memory_config": meta.get("memory_config"),
        "remote_presence": meta.get("remote_presence"),
        "autonomous_scene": meta.get("autonomous_scene"),
        "plugin_backends": pb,
    });
    if let Some(rc) = bp.get("runtime_config") {
        if let Some(obj) = rc.as_object() {
            for (k, v) in obj {
                settings[k] = v.clone();
            }
        }
    }
    if let Some(anchor) = meta.get("reply_quality_anchor").and_then(|x| x.as_str()) {
        if !anchor.trim().is_empty() {
            settings["reply_quality_anchor"] = serde_json::json!(anchor);
        }
    }

    let manifest_text = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
    let settings_text = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    Ok((format!("{}\n", manifest_text), format!("{}\n", settings_text)))
}

/// 保存时保留旧 `pipeline.ocblueprint` 中由主应用写入的扩展字段。
fn merge_preserved_blueprint_fields(
    new_bp: &mut serde_json::Value,
    old_bp: Option<&serde_json::Value>,
) {
    let Some(old) = old_bp else {
        return;
    };
    let Some(new_obj) = new_bp.as_object_mut() else {
        return;
    };
    for key in ["includes", "groups", "expert_overlay", "runtime_config"] {
        if let Some(v) = old.get(key) {
            if !v.is_null() {
                new_obj.insert(key.to_string(), v.clone());
            }
        }
    }
}

fn write_blueprint_from_legacy_parts(
    root: &std::path::Path,
    manifest_text: &str,
    settings_text: &str,
) -> Result<(), String> {
    use std::fs;

    let blueprint_path = root.join(PIPELINE_BLUEPRINT_FILENAME);
    let old_bp: Option<serde_json::Value> = if blueprint_path.is_file() {
        let text = fs::read_to_string(&blueprint_path).map_err(|e| e.to_string())?;
        Some(serde_json::from_str(&text).map_err(|e| e.to_string())?)
    } else {
        None
    };

    let manifest_path = root.join("manifest.json");
    let settings_path = root.join("settings.json");
    fs::write(&manifest_path, manifest_text.as_bytes()).map_err(|e| e.to_string())?;
    fs::write(&settings_path, settings_text.as_bytes()).map_err(|e| e.to_string())?;

    let mut bp = build_blueprint_v2_from_legacy_dir(root).map_err(|e| e.join("\n"))?;
    merge_preserved_blueprint_fields(&mut bp, old_bp.as_ref());
    let blueprint_text = serde_json::to_string_pretty(&bp).map_err(|e| e.to_string())?;
    fs::write(
        root.join(PIPELINE_BLUEPRINT_FILENAME),
        format!("{}\n", blueprint_text).as_bytes(),
    )
    .map_err(|e| e.to_string())?;

    if let Ok(mut settings) = serde_json::from_str::<DiskRoleSettings>(settings_text) {
        if let Some(anchor) = settings.reply_quality_anchor.take() {
            if !anchor.trim().is_empty() {
                let anchor_path = root.join(REPLY_QUALITY_ANCHOR_REL);
                if let Some(parent) = anchor_path.parent() {
                    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                }
                fs::write(&anchor_path, format!("{}\n", anchor.trim())).map_err(|e| e.to_string())?;
            }
        }
    }

    let _ = fs::remove_file(&manifest_path);
    let _ = fs::remove_file(&settings_path);
    let _ = fs::remove_file(root.join("personality.json"));
    Ok(())
}

/// 读取角色包根目录下的 v2 `pipeline.ocblueprint`，拆为编辑器 manifest/settings 视图。
#[tauri::command]
fn load_role_pack_for_editor(role_dir: String) -> Result<RolePackEditorLoad, String> {
    use std::fs;
    use std::path::PathBuf;

    let root = PathBuf::from(role_dir.trim());
    if !root.is_dir() {
        return Err("所选路径不是目录".into());
    }
    let blueprint_path = root.join(PIPELINE_BLUEPRINT_FILENAME);
    if blueprint_path.is_file() {
        let blueprint_text = fs::read_to_string(&blueprint_path).map_err(|e| e.to_string())?;
        let bp: serde_json::Value =
            serde_json::from_str(&blueprint_text).map_err(|e| e.to_string())?;
        let (manifest_text, settings_text) = blueprint_to_legacy_parts(&bp)?;
        let anchor_path = root.join(REPLY_QUALITY_ANCHOR_REL);
        let mut settings_text = settings_text;
        if anchor_path.is_file() {
            let anchor = fs::read_to_string(&anchor_path).map_err(|e| e.to_string())?;
            if !anchor.trim().is_empty() {
                let mut s: serde_json::Value =
                    serde_json::from_str(settings_text.trim()).map_err(|e| e.to_string())?;
                s["reply_quality_anchor"] = serde_json::json!(anchor.trim());
                settings_text = format!(
                    "{}\n",
                    serde_json::to_string_pretty(&s).map_err(|e| e.to_string())?
                );
            }
        }
        let scenes_for_merge: Vec<String> = bp
            .get("meta")
            .and_then(|m| m.get("scenes"))
            .and_then(|s| s.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|x| x.as_str().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default();
        let merged_scene_ids =
            merge_role_pack_scene_ids(&root, &scenes_for_merge).map_err(|e| e.to_string())?;
        return Ok(RolePackEditorLoad {
            manifest_text,
            settings_text: Some(settings_text),
            merged_scene_ids,
        });
    }

    let manifest_path = root.join("manifest.json");
    if manifest_path.is_file() {
        return Err(
            "检测到 legacy manifest.json 格式。请先用 `oclive pack migrate-to-blueprint` 迁移后再编辑。"
                .into(),
        );
    }
    Err(format!(
        "未找到 {}：{}",
        PIPELINE_BLUEPRINT_FILENAME,
        blueprint_path.display()
    ))
}

/// 写回 v2 `pipeline.ocblueprint`（及 `prompts/reply_quality_anchor.md`）；不保留 legacy 三件套。
#[tauri::command]
fn save_role_pack_editor(role_dir: String, manifest_text: String, settings_text: String) -> Result<(), String> {
    let root = std::path::PathBuf::from(role_dir.trim());
    if !root.is_dir() {
        return Err("所选路径不是目录".into());
    }
    write_blueprint_from_legacy_parts(&root, &manifest_text, &settings_text)
}

#[tauri::command]
fn validate_blueprint_v2_json(
    manifest_text: String,
    settings_text: String,
    merged_scene_ids: Vec<String>,
    host_runtime_version: String,
    role_id: String,
) -> Result<(), String> {
    let mut disk: DiskRoleManifest =
        serde_json::from_str(&manifest_text).map_err(|e| format!("manifest 解析失败: {}", e))?;
    let settings: DiskRoleSettings = serde_json::from_str(&settings_text)
        .map_err(|e| format!("settings 解析失败: {}", e))?;
    settings.apply_to_manifest(&mut disk);
    let _ = merged_scene_ids;

    let dir = std::env::temp_dir().join(format!(
        "oclive-pack-editor-validate-{}",
        std::process::id()
    ));
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    std::fs::write(dir.join("manifest.json"), manifest_text.as_bytes()).map_err(|e| e.to_string())?;
    std::fs::write(dir.join("settings.json"), settings_text.as_bytes()).map_err(|e| e.to_string())?;
    let bp = build_blueprint_v2_from_legacy_dir(&dir).map_err(|e| e.join("\n"))?;
    let _ = std::fs::remove_dir_all(&dir);

    let blueprint_text = serde_json::to_string_pretty(&bp).map_err(|e| e.to_string())?;
    let folder = role_id.trim();
    let folder_opt = if folder.is_empty() {
        None
    } else {
        Some(folder)
    };
    validate_blueprint_v2_json_with_context(
        &blueprint_text,
        BlueprintV2ValidateContext {
            folder_name: folder_opt,
            host_version: if host_runtime_version.trim().is_empty() {
                None
            } else {
                Some(host_runtime_version.trim())
            },
            ..Default::default()
        },
    )
    .map_err(|e| e.join("\n"))
}

#[cfg(test)]
mod blueprint_save_tests {
    use super::merge_preserved_blueprint_fields;
    use serde_json::json;

    #[test]
    fn merge_preserves_includes_groups_expert_overlay_runtime_config() {
        let old = json!({
            "schema_version": 2,
            "meta": { "id": "x" },
            "slot_registry": {},
            "includes": [{ "path": "blueprint/includes/expert_routing.json", "target": "expert_routing", "mode": "merge" }],
            "groups": { "g1": { "label": "G", "type": "llm", "members": ["llm_a"] } },
            "expert_overlay": { "routing_path": "blueprint/includes/expert_routing.json" },
            "runtime_config": { "expert_hints": {} }
        });
        let mut new_bp = json!({
            "schema_version": 2,
            "meta": { "id": "x", "name": "new" },
            "slot_registry": { "llm": { "type": "llm", "label": "L", "backend": "ollama", "position": 0 } }
        });
        merge_preserved_blueprint_fields(&mut new_bp, Some(&old));
        assert_eq!(new_bp["meta"]["name"], "new");
        assert_eq!(new_bp["includes"].as_array().unwrap().len(), 1);
        assert!(new_bp.get("groups").is_some());
        assert!(new_bp.get("expert_overlay").is_some());
        assert!(new_bp.get("runtime_config").is_some());
    }

    #[test]
    fn merge_skips_when_no_old_blueprint() {
        let mut new_bp = json!({ "schema_version": 2, "meta": { "id": "x" }, "slot_registry": {} });
        merge_preserved_blueprint_fields(&mut new_bp, None);
        assert!(new_bp.get("includes").is_none());
    }
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
            validate_blueprint_v2_json,
        ])
        .run(tauri::generate_context!())
        .expect("error while running oclive-pack-editor");
}
