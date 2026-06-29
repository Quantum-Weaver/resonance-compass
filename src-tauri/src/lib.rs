use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Welcome to Resonance Echoes, {}.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_echoes_table",
            sql: "CREATE TABLE IF NOT EXISTS echoes (
                id TEXT PRIMARY KEY,
                body TEXT NOT NULL,
                sense_id TEXT NOT NULL DEFAULT 'other',
                subcategory_id TEXT,
                emoji TEXT,
                intensity INTEGER NOT NULL DEFAULT 3,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_echoes_created ON echoes(created_at);
            CREATE INDEX IF NOT EXISTS idx_echoes_sense ON echoes(sense_id);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "recreate_echoes_phase1_schema",
            sql: "DROP TABLE IF EXISTS echoes;
            CREATE TABLE IF NOT EXISTS echoes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sense TEXT NOT NULL DEFAULT 'other',
                subcategory TEXT NOT NULL DEFAULT 'custom',
                emoji TEXT NOT NULL DEFAULT '',
                note TEXT,
                intensity INTEGER NOT NULL DEFAULT 3,
                timestamp INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_echoes_timestamp ON echoes(timestamp);
            CREATE INDEX IF NOT EXISTS idx_echoes_sense ON echoes(sense);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "ensure_echoes_clean_schema",
            sql: "DROP TABLE IF EXISTS echoes;
            CREATE TABLE IF NOT EXISTS echoes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sense TEXT NOT NULL DEFAULT 'other',
                subcategory TEXT NOT NULL DEFAULT 'custom',
                emoji TEXT NOT NULL DEFAULT '',
                note TEXT,
                intensity INTEGER NOT NULL DEFAULT 3,
                timestamp INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_echoes_timestamp ON echoes(timestamp);
            CREATE INDEX IF NOT EXISTS idx_echoes_sense ON echoes(sense);",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:echoes.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running Resonance Echoes");
}
