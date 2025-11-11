import os, sqlite3, json, datetime

DB_PATH = os.environ.get("DATABASE_URL", "sqlite:///./poderes.db").replace("sqlite:///", "")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        '''CREATE TABLE IF NOT EXISTS poder (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            provider TEXT,
            provider_envelope_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'''
    )
    conn.commit()
    conn.close()

def insert_poder(data: dict) -> int:
    now = datetime.datetime.utcnow().isoformat()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT INTO poder (data_json, status, created_at, updated_at) VALUES (?, 'draft', ?, ?)",
                (json.dumps(data, ensure_ascii=False), now, now))
    conn.commit()
    pid = cur.lastrowid
    conn.close()
    return pid

def get_poder(pid: int):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, data_json, status, provider, provider_envelope_id, created_at, updated_at FROM poder WHERE id = ?", (pid,))
    row = cur.fetchone()
    conn.close()
    if not row: return None
    return {
        "id": row[0],
        "data": json.loads(row[1]),
        "status": row[2],
        "provider": row[3],
        "provider_envelope_id": row[4],
        "created_at": row[5],
        "updated_at": row[6],
    }

def update_poder(pid: int, **updates):
    allowed = {"status", "provider", "provider_envelope_id", "data_json"}
    sets = []
    params = []
    for k, v in updates.items():
        if k == "data":
            k = "data_json"; v = json.dumps(v, ensure_ascii=False)
        if k in allowed:
            sets.append(f"{k} = ?"); params.append(v)
    sets.append("updated_at = ?"); params.append(datetime.datetime.utcnow().isoformat())
    sql = "UPDATE poder SET " + ", ".join(sets) + " WHERE id = ?"
    params.append(pid)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    conn.close()
