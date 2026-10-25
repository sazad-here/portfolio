"""
Load the cleaned sales-order extract into SQLite and run every query in ../sql/.

Usage:
    python run_analysis.py
"""

import csv
import pathlib
import sqlite3

HERE = pathlib.Path(__file__).parent
CSV = HERE / ".." / "data" / "sales_orders.csv"
SQL_DIR = HERE / ".." / "sql"

SCHEMA = """
CREATE TABLE sales_orders (
    sales_order             INTEGER PRIMARY KEY,
    customer_name           TEXT,
    business_partner_id     TEXT,
    customer_reference      TEXT,
    document_date           TEXT,
    requested_delivery_date TEXT,
    requested_lead_days     INTEGER,
    overall_status          TEXT,
    net_value_eur           REAL
);
"""


def load():
    con = sqlite3.connect(":memory:")
    con.executescript(SCHEMA)
    with open(CSV, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    con.executemany(
        "INSERT INTO sales_orders VALUES (:sales_order,:customer_name,:business_partner_id,"
        ":customer_reference,:document_date,:requested_delivery_date,"
        ":requested_lead_days,:overall_status,:net_value_eur)",
        [{k: (v if v != "" else None) for k, v in r.items()} for r in rows],
    )
    con.commit()
    return con


def run(con, path):
    sql = path.read_text(encoding="utf-8")
    title = sql.splitlines()[0].lstrip("- ").strip()
    print("\n" + "=" * 78)
    print(f"{path.name}  |  {title}")
    print("=" * 78)
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    widths = [
        max(len(c), max((len(f"{r[i]}") for r in rows), default=0)) for i, c in enumerate(cols)
    ]
    print("  ".join(c.ljust(widths[i]) for i, c in enumerate(cols)))
    print("  ".join("-" * w for w in widths))
    for r in rows:
        print("  ".join(f"{v}".ljust(widths[i]) for i, v in enumerate(r)))


if __name__ == "__main__":
    con = load()
    total = con.execute("SELECT COUNT(*), ROUND(SUM(net_value_eur),2) FROM sales_orders").fetchone()
    print(f"loaded {total[0]} orders, EUR {total[1]:,.2f} total net value")
    for path in sorted(SQL_DIR.glob("*.sql")):
        run(con, path)
