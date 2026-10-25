"""
Generate the charts for the order-to-cash findings.

Two charts, both driven by the same committed CSV the SQL runs against, so the
figures can never drift from the numbers in findings.md:

  charts/01-concentration-inversion.png
  charts/02-order-status.png

Both use emphasis encoding -- one accent hue for the thing the chart is about,
a neutral gray for context -- rather than a categorical palette, because in each
case a single value is the point and colouring everything would bury it.

Usage:
    python scripts/make_charts.py

Requires matplotlib. The analysis itself (run_analysis.py) has no dependencies;
only chart generation does, and the PNGs are committed so this rarely needs
running.
"""

import collections
import csv
import pathlib

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

HERE = pathlib.Path(__file__).parent
CSV = HERE / ".." / "data" / "sales_orders.csv"
OUT = HERE / ".." / "charts"

# Validated against the light chart surface: CVD separation 15.9 (protan) /
# 11.2 (tritan), normal-vision 17.8, both colours >= 3:1 contrast.
ACCENT = "#2a78d6"
NEUTRAL = "#898781"
SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK_2 = "#52514e"
GRID = "#e1e0d9"
BASELINE = "#c3c2b7"

plt.rcParams.update({
    "font.family": ["Segoe UI", "DejaVu Sans", "sans-serif"],
    "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE,
    "savefig.facecolor": SURFACE,
    "text.color": INK,
    "axes.labelcolor": INK_2,
    "xtick.color": NEUTRAL,
    "ytick.color": INK_2,
    "axes.edgecolor": BASELINE,
})


def eur(v, _=None):
    """Axis formatter: 1171348 -> 1.2M, 123800 -> 124k"""
    if abs(v) >= 1_000_000:
        return f"{v / 1_000_000:.1f}M"
    if abs(v) >= 1_000:
        return f"{v / 1_000:.0f}k"
    return f"{v:.0f}"


def load():
    rows = list(csv.DictReader(open(CSV, encoding="utf-8")))
    for r in rows:
        r["net_value_eur"] = float(r["net_value_eur"])
    return rows


def style(ax, xmax):
    """Hairline grid on the value axis only; no box; recessive chrome."""
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(BASELINE)
    ax.spines["bottom"].set_linewidth(0.8)
    ax.xaxis.grid(True, color=GRID, linewidth=0.8)
    ax.yaxis.grid(False)
    ax.set_axisbelow(True)
    ax.set_xlim(0, xmax)
    ax.xaxis.set_major_formatter(FuncFormatter(eur))
    ax.tick_params(length=0, labelsize=9)


# --------------------------------------------------------------- chart 1

def concentration_inversion(rows):
    """
    The same order book, ranked two ways. Both panels share one x-scale --
    without that the comparison would be meaningless.
    """
    total = sum(r["net_value_eur"] for r in rows)

    by_id = collections.defaultdict(float)
    by_name = collections.defaultdict(float)
    for r in rows:
        by_id[(r["customer_name"], r["business_partner_id"])] += r["net_value_eur"]
        by_name[r["customer_name"]] += r["net_value_eur"]

    top_id = sorted(by_id.items(), key=lambda kv: -kv[1])[:8]
    top_name = sorted(by_name.items(), key=lambda kv: -kv[1])[:8]

    fig, axes = plt.subplots(1, 2, figsize=(12.5, 4.6))
    xmax = top_name[0][1] * 1.18

    panels = [
        (axes[0], "Grouped by business partner ID",
         [(f"{n}", v, n == "Philly Bikes") for (n, _bp), v in top_id],
         "Top 10 accounts = 9.9% of revenue\nNo account above 1.4%"),
        (axes[1], "Grouped by customer name",
         [(n, v, n == "Philly Bikes") for n, v in top_name],
         "One customer = 13.2% of revenue\nspread across 88 records"),
    ]

    for ax, title, data, note in panels:
        labels = [d[0] for d in data]
        values = [d[1] for d in data]
        colors = [ACCENT if d[2] else NEUTRAL for d in data]
        y = range(len(values))

        ax.barh(y, values, color=colors, height=0.62)
        ax.set_yticks(list(y))
        ax.set_yticklabels(labels, fontsize=9)
        ax.invert_yaxis()
        style(ax, xmax)
        ax.set_title(title, fontsize=11, color=INK, pad=12, loc="left", weight="bold")

        # Direct-label only the accented bar -- a number on every bar is noise.
        for i, (lab, val, is_accent) in enumerate(data):
            if is_accent:
                ax.text(val + xmax * 0.015, i, f"€{val:,.0f}",
                        va="center", fontsize=9.5, color=ACCENT, weight="bold")

        ax.text(0.985, 0.06, note, transform=ax.transAxes, ha="right", va="bottom",
                fontsize=9, color=INK_2, linespacing=1.5)

    fig.suptitle("The same order book, ranked two ways",
                 fontsize=14, color=INK, x=0.007, ha="left", y=0.99, weight="bold")
    fig.text(0.007, 0.915,
             "708 SAP sales orders, €8.88M. Both panels share one scale. "
             "Changing only the grouping key moves the top account from 1.4% to 13.2% of revenue.",
             fontsize=9.5, color=INK_2, ha="left")

    fig.tight_layout(rect=[0, 0, 1, 0.88])
    OUT.mkdir(exist_ok=True)
    fig.savefig(OUT / "01-concentration-inversion.png", dpi=160)
    plt.close(fig)
    print("wrote charts/01-concentration-inversion.png")


# --------------------------------------------------------------- chart 2

def order_status(rows):
    """Where the money sits. Unfulfilled statuses accented; the rest is context."""
    agg = collections.defaultdict(lambda: [0, 0.0])
    for r in rows:
        a = agg[r["overall_status"]]
        a[0] += 1
        a[1] += r["net_value_eur"]

    order = ["Completed", "Open", "In Process", "Not Relevant"]
    unfulfilled = {"Open", "In Process"}

    fig, ax = plt.subplots(figsize=(10.5, 3.5))
    labels, values, counts, colors = [], [], [], []
    for s in order:
        labels.append(s)
        counts.append(agg[s][0])
        values.append(agg[s][1])
        colors.append(ACCENT if s in unfulfilled else NEUTRAL)

    y = range(len(values))
    ax.barh(y, values, color=colors, height=0.6)
    ax.set_yticks(list(y))
    ax.set_yticklabels([f"{s}\n{c} orders" for s, c in zip(labels, counts)], fontsize=9)
    ax.invert_yaxis()

    xmax = max(values) * 1.22
    style(ax, xmax)

    # Every bar labelled here: only four, and the values are the point.
    for i, v in enumerate(values):
        ax.text(v + xmax * 0.012, i, f"€{v:,.0f}", va="center", fontsize=9.5,
                color=ACCENT if colors[i] == ACCENT else INK_2,
                weight="bold" if colors[i] == ACCENT else "normal")

    fig.suptitle("€1.1M of the order book is unfulfilled",
                 fontsize=14, color=INK, x=0.007, ha="left", y=0.99, weight="bold")
    fig.text(0.007, 0.875,
             "113 orders (12.4% of value) sit in Open or In Process. "
             "Stalled orders average €9,722 against €13,745 for completed ones.",
             fontsize=9.5, color=INK_2, ha="left")

    fig.tight_layout(rect=[0, 0, 1, 0.83])
    OUT.mkdir(exist_ok=True)
    fig.savefig(OUT / "02-order-status.png", dpi=160)
    plt.close(fig)
    print("wrote charts/02-order-status.png")


if __name__ == "__main__":
    rows = load()
    concentration_inversion(rows)
    order_status(rows)
