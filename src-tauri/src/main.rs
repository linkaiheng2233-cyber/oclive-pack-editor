#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;

#[derive(Deserialize)]
struct PackFileEntry {
    path: String,
    content: String,
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![write_role_pack_files])
        .run(tauri::generate_context!())
        .expect("error while running oclive-pack-editor");
}
