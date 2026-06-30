use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Welcome to Resonance Compass, {}!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_songs_table",
            sql: "CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY,
                uri TEXT NOT NULL UNIQUE,
                filename TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT NOT NULL DEFAULT 'Unknown Artist',
                album TEXT NOT NULL DEFAULT 'Unknown Album',
                genre TEXT,
                year INTEGER,
                track_number INTEGER,
                duration REAL NOT NULL DEFAULT 0,
                cover_art TEXT,
                lyrics TEXT,
                date_added INTEGER NOT NULL DEFAULT 0,
                last_scanned INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
            CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_mood_events_table",
            sql: "CREATE TABLE IF NOT EXISTS mood_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_id TEXT NOT NULL,
                emoji TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                intensity INTEGER DEFAULT 3,
                comment TEXT,
                context TEXT DEFAULT 'manual',
                FOREIGN KEY (track_id) REFERENCES songs(id)
            );
            CREATE INDEX IF NOT EXISTS idx_mood_track ON mood_events(track_id);
            CREATE INDEX IF NOT EXISTS idx_mood_time ON mood_events(timestamp);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_favorites_table",
            sql: "CREATE TABLE IF NOT EXISTS favorites (
                track_id TEXT PRIMARY KEY,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (track_id) REFERENCES songs(id)
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_playlists_table",
            sql: "CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                track_ids TEXT NOT NULL DEFAULT '[]',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_fragments_table",
            sql: "CREATE TABLE IF NOT EXISTS fragments (
                id TEXT PRIMARY KEY,
                source_track_id TEXT NOT NULL,
                name TEXT NOT NULL,
                start_time REAL NOT NULL,
                end_time REAL NOT NULL,
                duration REAL NOT NULL,
                file_path TEXT,
                emoji TEXT,
                favorite INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (source_track_id) REFERENCES songs(id)
            );",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:compass.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running Resonance Compass");
}
