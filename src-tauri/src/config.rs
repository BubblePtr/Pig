use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigInventoryError {
    #[error("failed to read settings file {path}: {source}")]
    ReadSettings {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to parse settings file {path}: {source}")]
    ParseSettings {
        path: PathBuf,
        #[source]
        source: serde_json::Error,
    },
    #[error("failed to read directory {path}: {source}")]
    ReadDirectory {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigInventory {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_thinking_level: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme: Option<String>,
    pub packages: Vec<String>,
    pub extensions: Vec<ExtensionInfo>,
    pub skills: Vec<SkillInfo>,
    pub prompt_templates: Vec<TemplateInfo>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionInfo {
    pub name: String,
    pub source: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillInfo {
    pub name: String,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateInfo {
    pub name: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawExtension {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    id: Option<String>,
    #[serde(default = "default_enabled")]
    enabled: bool,
}

fn default_enabled() -> bool {
    true
}

pub fn build_config_inventory(
    dir: impl AsRef<Path>,
) -> Result<ConfigInventory, ConfigInventoryError> {
    let dir = dir.as_ref();
    let settings = read_settings(dir)?;
    let packages = named_array(&settings, "packages");
    let extensions = build_extensions(&settings, dir)?;
    let skills = list_named_entries(&dir.join("skills"))?
        .into_iter()
        .map(|name| SkillInfo {
            name,
            source: "directory".to_owned(),
        })
        .collect();

    Ok(ConfigInventory {
        default_model: string_setting(
            &settings,
            &["defaultModel", "default_model", "model", "currentModel"],
        ),
        default_provider: string_setting(
            &settings,
            &["defaultProvider", "default_provider", "provider"],
        ),
        default_thinking_level: string_setting(
            &settings,
            &[
                "defaultThinkingLevel",
                "default_thinking_level",
                "thinkingLevel",
            ],
        ),
        theme: string_setting(&settings, &["theme"]),
        packages,
        extensions,
        skills,
        prompt_templates: Vec::new(),
    })
}

fn read_settings(dir: &Path) -> Result<Value, ConfigInventoryError> {
    let path = dir.join("settings.json");
    let text = match fs::read_to_string(&path) {
        Ok(text) => text,
        Err(source) if source.kind() == std::io::ErrorKind::NotFound => {
            return Ok(Value::Null);
        }
        Err(source) => {
            return Err(ConfigInventoryError::ReadSettings { path, source });
        }
    };

    serde_json::from_str(&text)
        .map_err(|source| ConfigInventoryError::ParseSettings { path, source })
}

fn string_setting(settings: &Value, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| settings.get(*key)?.as_str())
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}

fn named_array(settings: &Value, key: &str) -> Vec<String> {
    let Some(items) = settings.get(key).and_then(Value::as_array) else {
        return Vec::new();
    };

    let mut names = items.iter().filter_map(named_value).collect::<Vec<_>>();
    names.sort();
    names.dedup();
    names
}

fn named_value(value: &Value) -> Option<String> {
    if let Some(text) = value.as_str() {
        return non_empty(text);
    }

    let object = value.as_object()?;
    ["name", "id", "package", "path"]
        .iter()
        .find_map(|key| object.get(*key)?.as_str())
        .and_then(non_empty)
}

fn non_empty(value: &str) -> Option<String> {
    let value = value.trim();
    if value.is_empty() {
        None
    } else {
        Some(value.to_owned())
    }
}

fn build_extensions(
    settings: &Value,
    dir: &Path,
) -> Result<Vec<ExtensionInfo>, ConfigInventoryError> {
    let mut extensions = BTreeMap::<String, ExtensionInfo>::new();

    if let Some(items) = settings.get("extensions").and_then(Value::as_array) {
        for item in items {
            if let Some(extension) = extension_from_setting(item) {
                extensions.insert(extension.name.clone(), extension);
            }
        }
    }

    for name in list_named_entries(&dir.join("extensions"))? {
        extensions
            .entry(name.clone())
            .and_modify(|extension| extension.source = "settings,directory".to_owned())
            .or_insert(ExtensionInfo {
                name,
                source: "directory".to_owned(),
                enabled: true,
            });
    }

    Ok(extensions.into_values().collect())
}

fn extension_from_setting(value: &Value) -> Option<ExtensionInfo> {
    if let Some(name) = value.as_str().and_then(non_empty) {
        return Some(ExtensionInfo {
            name,
            source: "settings".to_owned(),
            enabled: true,
        });
    }

    let raw = serde_json::from_value::<RawExtension>(value.clone()).ok()?;
    let name = raw.name.or(raw.id).and_then(|value| non_empty(&value))?;

    Some(ExtensionInfo {
        name,
        source: "settings".to_owned(),
        enabled: raw.enabled,
    })
}

fn list_named_entries(dir: &Path) -> Result<Vec<String>, ConfigInventoryError> {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(source) if source.kind() == std::io::ErrorKind::NotFound => {
            return Ok(Vec::new());
        }
        Err(source) => {
            return Err(ConfigInventoryError::ReadDirectory {
                path: dir.to_path_buf(),
                source,
            });
        }
    };

    let mut names = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|source| ConfigInventoryError::ReadDirectory {
            path: dir.to_path_buf(),
            source,
        })?;
        let Some(name) = entry.file_name().to_str().and_then(non_empty) else {
            continue;
        };
        if name.starts_with('.') {
            continue;
        }
        names.push(name);
    }
    names.sort();
    names.dedup();
    Ok(names)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture_dir() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("fixtures/pi-agent")
    }

    #[test]
    fn build_config_inventory_reads_settings_and_local_inventory_without_auth_json() {
        let inventory = build_config_inventory(fixture_dir()).expect("fixture inventory");

        assert_eq!(inventory.default_model.as_deref(), Some("gpt-5-codex"));
        assert_eq!(inventory.default_provider.as_deref(), Some("openai"));
        assert_eq!(inventory.default_thinking_level.as_deref(), Some("high"));
        assert_eq!(inventory.theme.as_deref(), Some("system"));
        assert_eq!(
            inventory.packages,
            vec!["@pi/code".to_owned(), "@pi/docs".to_owned()]
        );
        assert_eq!(
            inventory.extensions,
            vec![
                ExtensionInfo {
                    name: "code-runner".to_owned(),
                    source: "settings,directory".to_owned(),
                    enabled: true,
                },
                ExtensionInfo {
                    name: "terminal-tools".to_owned(),
                    source: "settings".to_owned(),
                    enabled: true,
                },
            ]
        );
        assert_eq!(
            inventory.skills,
            vec![
                SkillInfo {
                    name: "review".to_owned(),
                    source: "directory".to_owned(),
                },
                SkillInfo {
                    name: "summarize".to_owned(),
                    source: "directory".to_owned(),
                },
            ]
        );
        assert!(inventory.prompt_templates.is_empty());
    }

    #[test]
    fn build_config_inventory_allows_missing_settings_and_directories() {
        let temp = tempfile::tempdir().expect("tempdir");
        let inventory = build_config_inventory(temp.path()).expect("empty inventory");

        assert_eq!(inventory.default_model, None);
        assert!(inventory.packages.is_empty());
        assert!(inventory.extensions.is_empty());
        assert!(inventory.skills.is_empty());
        assert!(inventory.prompt_templates.is_empty());
    }
}
