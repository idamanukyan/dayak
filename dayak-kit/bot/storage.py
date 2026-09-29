"""Google Sheets backend with a local CSV fallback.

Set GOOGLE_SHEET_ID + GOOGLE_CREDENTIALS_JSON (path to service-account json)
to write to Sheets. Without them, rows go to ./data/*.csv so the bot runs on day 1.
"""
from __future__ import annotations

import csv
import os
import threading
from datetime import datetime, timezone
from pathlib import Path

PARENT_COLS = ["id", "ts", "tg_user_id", "tg_username", "lang", "child_age", "hours", "district",
               "nanny_lang", "start", "backup_importance", "phone", "source", "notes",
               "status", "matched_nanny", "fee_paid", "coordinator_notes"]
NANNY_COLS = ["id", "ts", "tg_user_id", "tg_username", "lang", "name", "age", "experience_years",
              "child_ages", "languages", "district", "hours", "rate", "backup_ok", "has_refs", "phone",
              "source", "interview_date", "id_photo", "ref1_checked", "ref2_checked", "vetted",
              "coordinator_notes"]

_lock = threading.Lock()


class Storage:
    def __init__(self) -> None:
        self.sheet_id = os.getenv("GOOGLE_SHEET_ID")
        self.creds = os.getenv("GOOGLE_CREDENTIALS_JSON")
        self.ws: dict = {}
        if self.sheet_id and self.creds and Path(self.creds).exists():
            import gspread
            gc = gspread.service_account(filename=self.creds)
            sh = gc.open_by_key(self.sheet_id)
            for title, cols in (("parents", PARENT_COLS), ("nannies", NANNY_COLS)):
                try:
                    ws = sh.worksheet(title)
                except gspread.WorksheetNotFound:
                    ws = sh.add_worksheet(title, rows=1000, cols=len(cols))
                    ws.append_row(cols)
                if not ws.row_values(1):
                    ws.append_row(cols)
                self.ws[title] = ws
            self.mode = "sheets"
        else:
            Path("data").mkdir(exist_ok=True)
            for title, cols in (("parents", PARENT_COLS), ("nannies", NANNY_COLS)):
                p = Path("data") / f"{title}.csv"
                if not p.exists():
                    with p.open("w", newline="", encoding="utf-8") as f:
                        csv.writer(f).writerow(cols)
            self.mode = "csv"

    def _next_id(self, table: str) -> int:
        if self.mode == "sheets":
            return len(self.ws[table].col_values(1))  # header counts as 1 → first id = 1
        with (Path("data") / f"{table}.csv").open(encoding="utf-8") as f:
            return sum(1 for _ in f)

    def append(self, table: str, row: dict) -> int:
        cols = PARENT_COLS if table == "parents" else NANNY_COLS
        with _lock:
            rid = self._next_id(table)
            row = {**row, "id": rid, "ts": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")}
            values = [str(row.get(c, "")) for c in cols]
            if self.mode == "sheets":
                self.ws[table].append_row(values)
            else:
                with (Path("data") / f"{table}.csv").open("a", newline="", encoding="utf-8") as f:
                    csv.writer(f).writerow(values)
        return rid
