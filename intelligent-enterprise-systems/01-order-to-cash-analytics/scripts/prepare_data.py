"""
Convert the raw SAP S/4HANA sales-order export into an analysis-ready CSV.

Source: a SAPUI5 "Export to Spreadsheet" download from the Manage Sales Orders
Fiori app (Global Bike demo dataset, client 310).

Three problems with the raw export, all typical of Fiori spreadsheet downloads:
  1. Dates arrive as Excel serial numbers (46139), not dates.
  2. Sold-to party packs the customer name and the SAP business partner ID into
     one string: "The Bike Zone 771 (1004142)".
  3. Net value is a text column, so it will not aggregate.

Usage:
    python prepare_data.py "../../../Sales Orders.xlsx" ../data/sales_orders.csv
"""

import csv
import re
import sys
import zipfile
from datetime import date, timedelta
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
EXCEL_EPOCH = date(1899, 12, 30)  # Excel's day 0, accounting for the 1900 leap-year bug

SOLD_TO = re.compile(r"^(?P<name>.*?)\s*\((?P<bp>\d+)\)\s*$")


def read_sheet(path):
    """Return the first worksheet as a list of {cell_ref: value} dicts, one per row."""
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.iter(NS + "si"):
                shared.append("".join(t.text or "" for t in si.iter(NS + "t")))

        root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in root.iter(NS + "row"):
            cells = {}
            for c in row.iter(NS + "c"):
                v = c.find(NS + "v")
                if v is None or v.text is None:
                    continue
                col = re.match(r"([A-Z]+)", c.get("r")).group(1)
                cells[col] = shared[int(v.text)] if c.get("t") == "s" else v.text
            if cells:
                rows.append(cells)
        return rows


def serial_to_iso(serial):
    """Excel serial number -> ISO date string. Returns '' for blanks."""
    if not serial:
        return ""
    return (EXCEL_EPOCH + timedelta(days=int(float(serial)))).isoformat()


def split_sold_to(raw):
    """'The Bike Zone 771 (1004142)' -> ('The Bike Zone 771', '1004142')"""
    m = SOLD_TO.match(raw or "")
    if m:
        return m.group("name").strip(), m.group("bp")
    return (raw or "").strip(), ""


def main(src, dst):
    rows = read_sheet(src)
    header, data = rows[0], rows[1:]
    print(f"read {len(data)} order rows from {src}")

    out = []
    for r in data:
        name, bp = split_sold_to(r.get("B", ""))
        doc_date = serial_to_iso(r.get("G"))
        req_date = serial_to_iso(r.get("D"))

        # Lead time = days between order creation and requested delivery.
        lead_days = ""
        if doc_date and req_date:
            lead_days = (date.fromisoformat(req_date) - date.fromisoformat(doc_date)).days

        out.append(
            {
                "sales_order": r.get("A", ""),
                "customer_name": name,
                "business_partner_id": bp,
                "customer_reference": r.get("C", ""),
                "document_date": doc_date,
                "requested_delivery_date": req_date,
                "requested_lead_days": lead_days,
                "overall_status": r.get("E", ""),
                "net_value_eur": float(r.get("F", 0) or 0),
            }
        )

    with open(dst, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys()))
        w.writeheader()
        w.writerows(out)

    print(f"wrote {len(out)} rows to {dst}")
    print(f"date range: {min(r['document_date'] for r in out if r['document_date'])} "
          f"to {max(r['document_date'] for r in out if r['document_date'])}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
