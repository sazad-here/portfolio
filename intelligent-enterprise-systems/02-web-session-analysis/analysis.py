"""
Heavenly Chocolates web-session analysis.

50 customer sessions: time on site, pages viewed, amount spent, day of week,
browser. Reproduces the descriptive work, then adds the two things the original
coursework stopped short of: a multiple regression, and a reconciliation of the
two conflicting copies of the source data.

Standard library only -- OLS is solved directly via normal equations so the
script runs anywhere without numpy.

Usage:
    python analysis.py
"""

import csv
import pathlib
import statistics as st

DATA = pathlib.Path(__file__).parent / "data" / "heavenly_chocolates.csv"


# ---------------------------------------------------------------- statistics

def correl(xs, ys):
    """Pearson r."""
    mx, my = st.mean(xs), st.mean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = (sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys)) ** 0.5
    return num / den


def ols(y, xcols):
    """
    Least squares with an intercept, solved by Gauss-Jordan on the normal
    equations. Returns (coefficients, r_squared). coefficients[0] is intercept.
    """
    n = len(y)
    X = [[1.0] + [col[i] for col in xcols] for i in range(n)]
    k = len(X[0])

    xtx = [[sum(X[i][a] * X[i][b] for i in range(n)) for b in range(k)] for a in range(k)]
    xty = [sum(X[i][a] * y[i] for i in range(n)) for a in range(k)]

    aug = [xtx[i] + [xty[i]] for i in range(k)]
    for col in range(k):
        pivot = max(range(col, k), key=lambda r: abs(aug[r][col]))
        aug[col], aug[pivot] = aug[pivot], aug[col]
        div = aug[col][col]
        aug[col] = [v / div for v in aug[col]]
        for r in range(k):
            if r != col:
                factor = aug[r][col]
                aug[r] = [v - factor * aug[col][j] for j, v in enumerate(aug[r])]
    beta = [row[-1] for row in aug]

    my = st.mean(y)
    fitted = [sum(beta[j] * X[i][j] for j in range(k)) for i in range(n)]
    ss_res = sum((y[i] - fitted[i]) ** 2 for i in range(n))
    ss_tot = sum((v - my) ** 2 for v in y)
    return beta, 1 - ss_res / ss_tot


# ---------------------------------------------------------------- reporting

def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def main():
    rows = list(csv.DictReader(open(DATA, encoding="utf-8")))

    time = [float(r["time_min"]) for r in rows]
    time_alt = [float(r["time_min_assignment_variant"]) for r in rows]
    pages = [float(r["pages_viewed"]) for r in rows]
    amount = [float(r["amount_spent_usd"]) for r in rows]

    section("1. Descriptive statistics (n = %d)" % len(rows))
    print(f"{'variable':<22}{'mean':>10}{'median':>10}{'std dev':>10}{'min':>10}{'max':>10}")
    for name, col in (("time on site (min)", time), ("pages viewed", pages),
                      ("amount spent ($)", amount)):
        print(f"{name:<22}{st.mean(col):>10.2f}{st.median(col):>10.2f}"
              f"{st.stdev(col):>10.2f}{min(col):>10.2f}{max(col):>10.2f}")

    section("2. Source data conflict")
    # Round before comparing -- the raw floats differ in the 15th decimal place
    # on several rows purely from Excel's binary representation, which is noise.
    diffs = [(i + 1, t, a) for i, (t, a) in enumerate(zip(time, time_alt))
             if round(t, 4) != round(a, 4)]
    print("Two copies of this dataset exist and their Time columns disagree.\n")
    print(f"{'customer':<10}{'Analysis.xlsx':>16}{'Assignment.xlsx':>18}")
    for cid, t, a in diffs:
        print(f"{cid:<10}{t:>16.1f}{a:>18.1f}")
    print(f"\nRows 49 and 50 in Assignment.xlsx duplicate the Time values of "
          f"rows 1 and 2 exactly ({time_alt[0]}, {time_alt[1]}).")
    print("That is the signature of a paste error, not a measurement difference.\n")
    print(f"{'statistic':<28}{'Analysis':>12}{'Assignment':>14}")
    print(f"{'mean time':<28}{st.mean(time):>12.4f}{st.mean(time_alt):>14.4f}")
    print(f"{'r(time, amount)':<28}{correl(time, amount):>12.4f}{correl(time_alt, amount):>14.4f}")
    print(f"{'r(time, pages)':<28}{correl(time, pages):>12.4f}{correl(time_alt, pages):>14.4f}")
    print(f"{'r(pages, amount)':<28}{correl(pages, amount):>12.4f}{correl(pages, amount):>14.4f}")
    print("\nOnly statistics involving Time move. The headline finding "
          "(pages -> amount) is unaffected.")

    section("3. Correlations (Analysis.xlsx as source of truth)")
    for label, a_, b_ in (("time on site  <-> amount spent", time, amount),
                          ("pages viewed  <-> amount spent", pages, amount),
                          ("time on site  <-> pages viewed", time, pages)):
        r = correl(a_, b_)
        print(f"  {label:<34} r = {r:>6.4f}   r2 = {r**2:>5.3f}")

    section("4. Multiple regression: amount ~ pages + time")
    beta, r2 = ols(amount, [pages, time])
    print(f"  amount_spent = {beta[0]:.2f} + {beta[1]:.2f} * pages_viewed "
          f"+ {beta[2]:.2f} * time_on_site")
    print(f"  R-squared = {r2:.4f}  ({r2*100:.1f}% of variance explained)\n")
    b_pages, r2_pages = ols(amount, [pages])
    b_time, r2_time = ols(amount, [time])
    print(f"  pages only:  R2 = {r2_pages:.4f}")
    print(f"  time only:   R2 = {r2_time:.4f}")
    print(f"  both:        R2 = {r2:.4f}")
    print(f"\n  Adding time on site to a pages-only model lifts R2 by just "
          f"{(r2 - r2_pages)*100:.1f} points.")
    print("  Pages viewed is doing nearly all the explanatory work.")
    print(f"  Each additional page viewed is associated with "
          f"${beta[1]:.2f} more spend.")

    section("5. Breakdown by day of week")
    print(f"{'day':<8}{'orders':>8}{'total $':>12}{'mean $':>10}")
    order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for d in order:
        vals = [float(r["amount_spent_usd"]) for r in rows if r["day"] == d]
        print(f"{d:<8}{len(vals):>8}{sum(vals):>12.2f}{st.mean(vals):>10.2f}")

    section("6. Breakdown by browser")
    print(f"{'browser':<10}{'sessions':>10}{'total $':>12}{'mean $':>10}")
    for b in ("Chrome", "Firefox", "Other"):
        vals = [float(r["amount_spent_usd"]) for r in rows if r["browser"] == b]
        print(f"{b:<10}{len(vals):>10}{sum(vals):>12.2f}{st.mean(vals):>10.2f}")


if __name__ == "__main__":
    main()
