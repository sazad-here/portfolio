"""
Generate the chart for the web-session analysis.

    charts/01-pages-vs-spend.png

One series, so no legend -- the title names it. Points carry a surface ring
because pages viewed is an integer axis and marks overlap heavily.

Usage:
    python make_chart.py

Requires matplotlib. analysis.py itself has no dependencies; only this does,
and the PNG is committed.
"""

import csv
import pathlib
import statistics as st

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = pathlib.Path(__file__).parent
DATA = HERE / "data" / "heavenly_chocolates.csv"
OUT = HERE / "charts"

ACCENT = "#2a78d6"
ACCENT_DARK = "#1c5cab"   # sequential step 550 -- same hue, darker
SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK_2 = "#52514e"
GRID = "#e1e0d9"
BASELINE = "#c3c2b7"
NEUTRAL = "#898781"

plt.rcParams.update({
    "font.family": ["Segoe UI", "DejaVu Sans", "sans-serif"],
    "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE,
    "savefig.facecolor": SURFACE,
    "text.color": INK,
    "axes.labelcolor": INK_2,
    "xtick.color": NEUTRAL,
    "ytick.color": NEUTRAL,
})


def main():
    rows = list(csv.DictReader(open(DATA, encoding="utf-8")))
    pages = [float(r["pages_viewed"]) for r in rows]
    amount = [float(r["amount_spent_usd"]) for r in rows]

    # Simple least squares on one predictor.
    mx, my = st.mean(pages), st.mean(amount)
    slope = sum((x - mx) * (y - my) for x, y in zip(pages, amount)) / \
            sum((x - mx) ** 2 for x in pages)
    intercept = my - slope * mx
    fitted = [intercept + slope * x for x in pages]
    ss_res = sum((y - f) ** 2 for y, f in zip(amount, fitted))
    ss_tot = sum((y - my) ** 2 for y in amount)
    r2 = 1 - ss_res / ss_tot

    fig, ax = plt.subplots(figsize=(9, 5.2))

    xs = [min(pages) - 0.4, max(pages) + 0.4]
    ax.plot(xs, [intercept + slope * x for x in xs],
            color=ACCENT_DARK, linewidth=2, zorder=2)
    ax.scatter(pages, amount, s=90, color=ACCENT, zorder=3,
               edgecolors=SURFACE, linewidths=2)   # 2px surface ring

    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("bottom", "left"):
        ax.spines[side].set_color(BASELINE)
        ax.spines[side].set_linewidth(0.8)
    ax.yaxis.grid(True, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    ax.tick_params(length=0, labelsize=9)

    ax.set_xlabel("Pages viewed in the session", fontsize=10, labelpad=10)
    ax.set_ylabel("Amount spent ($)", fontsize=10, labelpad=10)
    ax.set_xticks(range(int(min(pages)), int(max(pages)) + 1))
    ax.set_xlim(*xs)
    ax.yaxis.set_major_formatter(lambda v, _: f"${v:.0f}")

    # The fitted line here is the SIMPLE regression, so its slope is the
    # unadjusted effect. The partial coefficient from the two-predictor model in
    # analysis.py is smaller ($9.30) because pages and time are correlated
    # (r = 0.60). Both numbers are stated so the pair never looks like an error.
    # No leader line: with a single fitted line on the plot, an arrow would read
    # as a second series.
    ax.text(0.035, 0.955,
            f"unadjusted fit: +${slope:.2f} per page",
            transform=ax.transAxes, fontsize=10.5, color=ACCENT_DARK,
            weight="bold", va="top")
    ax.text(0.035, 0.885,
            "+$9.30 once time on site is controlled for",
            transform=ax.transAxes, fontsize=9.5, color=INK_2, va="top")
    ax.text(0.985, 0.05, f"r = {r2 ** 0.5:.2f}   ·   R² = {r2:.2f}   ·   n = {len(rows)}",
            transform=ax.transAxes, ha="right", fontsize=9.5, color=INK_2)

    fig.suptitle("Pages viewed predicts spend; time on site mostly does not",
                 fontsize=14, color=INK, x=0.007, ha="left", y=0.985, weight="bold")
    fig.text(0.007, 0.905,
             "Adding time on site to this model lifts R² by only 3.4 points, so the lever is "
             "catalogue exposure, not dwell time.",
             fontsize=9.5, color=INK_2, ha="left")

    fig.tight_layout(rect=[0, 0, 1, 0.88])
    OUT.mkdir(exist_ok=True)
    fig.savefig(OUT / "01-pages-vs-spend.png", dpi=160)
    plt.close(fig)
    print("wrote charts/01-pages-vs-spend.png")


if __name__ == "__main__":
    main()
