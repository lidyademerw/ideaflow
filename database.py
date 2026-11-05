import sqlite3
from contextlib import contextmanager
from typing import Any, Generator

DATABASE_NAME = "ideas.db"


@contextmanager
def get_connection() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ideas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'todo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                start_date TEXT,
                end_date TEXT
            )
            """
        )
        cursor = conn.execute("PRAGMA table_info(ideas)")
        existing_columns = [row["name"] for row in cursor.fetchall()]
        if "start_date" not in existing_columns:
            conn.execute("ALTER TABLE ideas ADD COLUMN start_date TEXT")
        if "end_date" not in existing_columns:
            conn.execute("ALTER TABLE ideas ADD COLUMN end_date TEXT")


def get_all_ideas() -> list[dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            SELECT id, title, description, status, created_at, start_date, end_date
            FROM ideas
            ORDER BY id DESC
            """
        )
        return [dict(row) for row in cursor.fetchall()]


def create_idea(
    title: str,
    description: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO ideas (title, description, start_date, end_date)
            VALUES (?, ?, ?, ?)
            """,
            (title, description, start_date, end_date),
        )
        idea_id = cursor.lastrowid
        row = conn.execute(
            """
            SELECT id, title, description, status, created_at, start_date, end_date
            FROM ideas
            WHERE id = ?
            """,
            (idea_id,),
        ).fetchone()
        return dict(row)


def update_idea_status(idea_id: int, status: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE ideas SET status = ? WHERE id = ?",
            (status, idea_id),
        )
        if cursor.rowcount == 0:
            return None
        row = conn.execute(
            """
            SELECT id, title, description, status, created_at, start_date, end_date
            FROM ideas
            WHERE id = ?
            """,
            (idea_id,),
        ).fetchone()
        return dict(row) if row else None


def delete_idea(idea_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM ideas WHERE id = ?",
            (idea_id,),
        )
        return cursor.rowcount > 0
