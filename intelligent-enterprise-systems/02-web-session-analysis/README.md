# Web Session Analysis — What Actually Drives Online Spend

50 customer web sessions from a specialty chocolate retailer: time on site,
pages viewed, amount spent, day of week, browser. The business question is
whether on-site behaviour predicts purchase value, and if so, which behaviour.

```bash
python analysis.py          # the analysis — standard library only
python make_chart.py        # regenerates the chart — needs matplotlib
```

The regression is solved by Gauss-Jordan elimination on the normal equations, so
the analysis itself has nothing to install. Only chart generation needs a
package, and the PNG is committed.

---

## Headline

**Pages viewed predicts spend. Time on site mostly does not.**

| Model | R² | Reading |
|---|---|---|
| amount ~ pages | 0.524 | Pages alone explains 52% of variance |
| amount ~ time | 0.337 | Time alone explains 34% |
| amount ~ pages + time | 0.558 | Adding time to pages buys **3.4 points** |

```
amount_spent = 7.50 + 9.30 × pages_viewed + 1.23 × time_on_site
```

**Each additional page viewed is associated with $9.30 more spend.** An extra
minute on site is worth $1.23 — and once pages are in the model, time adds
almost nothing, because the two are themselves correlated (r = 0.60).

![Scatter of pages viewed against amount spent for 50 sessions with a fitted line. Unadjusted slope 11.49 dollars per page; 9.30 dollars once time on site is controlled for.](charts/01-pages-vs-spend.png)

The fitted line above is the **simple** regression, so its slope is $11.49 — the
unadjusted effect. The $9.30 figure is the partial coefficient from the
two-predictor model, which is smaller precisely because pages and time overlap.
Both are on the chart so the pair never reads as a contradiction.

This matters commercially because it changes the recommendation. "Keep visitors
on the site longer" is the intuitive conclusion from a time-versus-spend
scatter, and it is close to wrong. The lever is **breadth of catalogue exposure**
— recommendations, related products, category navigation — not dwell time. A
visitor held on one page for ten minutes is worth far less than one who moves
through five pages in four.

---

## Data quality: the two source files disagree

The dataset arrived as two Excel workbooks. Their **Time** columns do not match.

| Customer | `Analysis.xlsx` | `Assignment.xlsx` |
|---|---|---|
| 49 | 7.3 | 12.0 |
| 50 | 13.4 | 19.5 |

Those two Assignment values are exact duplicates of customers 1 and 2 — the
signature of a fill or paste error rather than a genuine measurement
difference. I could not establish from the files alone which copy is
authoritative, so the discrepancy is documented rather than silently resolved,
and `Analysis.xlsx` is used throughout with that stated.

The impact is bounded, and knowing that it is bounded is the point:

| Statistic | Analysis | Assignment |
|---|---|---|
| Mean time on site | 12.81 min | 13.03 min |
| r(time, amount) | 0.5800 | 0.5896 |
| r(time, pages) | 0.5956 | 0.5844 |
| **r(pages, amount)** | **0.7237** | **0.7237** |

Every statistic that touches Time moves. The one the recommendation rests on
does not. Two rows out of fifty would not have changed the decision — but that
is a conclusion you can only state after checking, and both copies are carried
in `data/heavenly_chocolates.csv` so anyone can re-run it either way.

---

## Secondary findings

**Day of week.** Monday ($90.38 average) and Friday ($85.95) are the strongest
days; Sunday is the weakest at $43.63 — less than half of Monday. Monday and
Friday together are 40% of sessions but 52% of revenue.

**Browser.** Chrome is 54% of sessions (27 of 50) but the *lowest* average basket
at $61.36. Firefox users average $76.76 — 25% higher.

Both are worth flagging and neither is worth acting on yet. With 5–11 sessions
per day-of-week and 7 sessions in the "Other" browser bucket, these cells are
far too small to support a spend decision. The honest recommendation is to
instrument properly and re-measure, not to reallocate budget to Friday.

---

## Recommendations

1. **Optimise for pages per session, not session duration.** Related-product
   modules, category cross-links, and recommendation widgets. This is the only
   finding here with enough statistical support to act on.
2. **Re-measure day-of-week and browser effects** with a larger sample before
   spending against them.
3. **Reconcile the two source workbooks** and establish which is authoritative
   before this dataset is used for anything further.

---

## What was added beyond the original coursework

The assignment asked for descriptive statistics, pivot tables by day and
browser, three correlations, and a scatter chart. This version adds the multiple
regression that separates the two correlated predictors, the reconciliation of
the conflicting source files, and explicit sample-size caveats on the segment
findings — the three things that change what a stakeholder should actually do.
