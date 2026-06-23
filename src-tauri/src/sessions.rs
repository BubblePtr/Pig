use std::{
    env,
    ffi::OsStr,
    fs::File,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use walkdir::WalkDir;

#[derive(Debug, Error)]
pub enum SessionIndexError {
    #[error("HOME is not set and PI_CODING_AGENT_DIR was not provided")]
    MissingHome,
    #[error("failed to read session file {path}: {source}")]
    ReadSession {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to walk sessions directory {path}: {source}")]
    WalkSessions {
        path: PathBuf,
        #[source]
        source: walkdir::Error,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSummary {
    pub id: String,
    pub timestamp: String,
    pub project: String,
}

#[derive(Debug)]
struct IndexedSession {
    summary: SessionSummary,
    sort_timestamp: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct SessionRecord {
    #[serde(rename = "type")]
    record_type: String,
    id: String,
    timestamp: DateTime<Utc>,
    cwd: String,
}

pub fn resolve_agent_dir() -> Result<PathBuf, SessionIndexError> {
    if let Some(agent_dir) = env::var_os("PI_CODING_AGENT_DIR") {
        return Ok(PathBuf::from(agent_dir));
    }

    let home = env::var_os("HOME").ok_or(SessionIndexError::MissingHome)?;
    Ok(PathBuf::from(home).join(".pi").join("agent"))
}

pub fn build_index(dir: impl AsRef<Path>) -> Result<Vec<SessionSummary>, SessionIndexError> {
    let sessions_dir = dir.as_ref().join("sessions");
    if !sessions_dir.exists() {
        return Ok(Vec::new());
    }

    let mut sessions = Vec::new();

    for entry in WalkDir::new(&sessions_dir).follow_links(false) {
        let entry = entry.map_err(|source| SessionIndexError::WalkSessions {
            path: sessions_dir.clone(),
            source,
        })?;
        let path = entry.path();

        if !entry.file_type().is_file() || path.extension() != Some(OsStr::new("jsonl")) {
            continue;
        }

        if let Some(session) = read_session_summary(path)? {
            sessions.push(session);
        }
    }

    sessions.sort_by(|left, right| right.sort_timestamp.cmp(&left.sort_timestamp));

    Ok(sessions
        .into_iter()
        .map(|session| session.summary)
        .collect())
}

fn read_session_summary(path: &Path) -> Result<Option<IndexedSession>, SessionIndexError> {
    let file = File::open(path).map_err(|source| SessionIndexError::ReadSession {
        path: path.to_path_buf(),
        source,
    })?;
    let reader = BufReader::new(file);

    for line in reader.lines() {
        let line = line.map_err(|source| SessionIndexError::ReadSession {
            path: path.to_path_buf(),
            source,
        })?;

        let Ok(record) = serde_json::from_str::<SessionRecord>(&line) else {
            continue;
        };
        if record.record_type != "session" {
            continue;
        }

        let timestamp = record.timestamp.to_rfc3339();
        return Ok(Some(IndexedSession {
            summary: SessionSummary {
                id: record.id,
                timestamp,
                project: derive_project_name(&record.cwd),
            },
            sort_timestamp: record.timestamp,
        }));
    }

    Ok(None)
}

fn derive_project_name(cwd: &str) -> String {
    Path::new(cwd)
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| cwd.to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_index_returns_flat_newest_first_sessions_with_projects() {
        let fixture_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("fixtures/pi-agent");

        let sessions = build_index(fixture_dir).expect("fixture sessions should index");

        assert_eq!(sessions.len(), 3);
        assert_eq!(
            sessions
                .iter()
                .map(|session| session.id.as_str())
                .collect::<Vec<_>>(),
            vec!["newest-session", "middle-session", "oldest-session"]
        );
        assert_eq!(
            sessions
                .iter()
                .map(|session| session.project.as_str())
                .collect::<Vec<_>>(),
            vec!["gamma", "beta", "alpha"]
        );
    }

    #[test]
    fn build_index_returns_empty_when_sessions_directory_is_missing() {
        let temp = tempfile::tempdir().expect("tempdir");

        let sessions = build_index(temp.path()).expect("missing sessions dir is valid");

        assert!(sessions.is_empty());
    }
}
