# Findings — Order-to-Cash extract, 708 sales orders

**Source:** SAP S/4HANA 2022, Manage Sales Orders (Fiori), Global Bike training client.
**Scope:** 708 orders, €8,881,866.49 net value. 705 orders dated 2026, 3 legacy records from 2021.

---

## About this dataset — read this first

Global Bike is SAP's teaching dataset, and this client is shared by an entire
course. Several patterns below are artefacts of that: many students each ran the
same case study against the same customer list, so orders repeat and master data
duplicates.

I have kept those findings in rather than filtering them out, because the point
of the exercise is the method. Every pattern below is one I would raise on a
production extract, and for each I have said plainly whether it is a real
commercial signal or an artefact of a shared training system. Knowing the
difference is most of the job.

---

## 1. The concentration answer depends entirely on which field you group by

This is the finding I would take to a stakeholder first.

Grouping on **business partner ID** — the natural key, and what most canned
reports use — the order book looks completely unconcentrated:

| Rank | Customer | Orders | Net value | Cumulative % of revenue |
|---|---|---|---|---|
| 1 | The Bike Zone 242 (1003998) | 10 | €123,800.00 | 1.4% |
| 2 | The Bike Zone 208 (1003674) | 10 | €121,487.87 | 2.8% |
| 3 | The Bike Zone 213 (1003934) | 10 | €98,692.50 | 3.9% |
| … | | | | |
| 10 | The Bike Zone 388 (1003579) | 5 | €65,092.50 | 9.9% |

Top 10 accounts = **9.9%** of revenue. No customer above 1.4%. On that basis you
would tell the business it has no concentration risk at all.

![Two panels ranking the same order book. Left, grouped by business partner ID: eight similar bars, none above 124,000 euro. Right, grouped by customer name: Philly Bikes at 1.17 million euro, roughly ten times the next account.](charts/01-concentration-inversion.png)

Group on **customer name** instead and the picture inverts:

| Customer name | Distinct BP IDs | Orders | Net value | % of revenue |
|---|---|---|---|---|
| **Philly Bikes** | **88** | 190 | €1,171,348.50 | **13.2%** |
| Beantown Bikes | 4 | 4 | €61,000.00 | 0.7% |
| The Bike Zone 373 | 2 | 4 | €50,092.50 | 0.6% |

One trading name is spread across **88 separate business partner records** and is
worth 13.2% of the book — nearly ten times the apparent number-one account.

**Why it matters.** Fragmented customer masters silently break everything
computed per-customer: credit limits are checked against a fraction of true
exposure, volume rebates never trigger, account managers cannot see their own
book, and churn analysis counts one lost customer as eighty-eight tiny ones.

**Honest caveat.** Here the cause is benign — 88 students each created their own
"Philly Bikes". In a production system the same signature usually means missing
duplicate-check configuration on customer creation, or a migration that loaded
the same account from several legacy sources. The query that finds it is
identical either way: [`sql/06_duplicate_customer_masters.sql`](sql/06_duplicate_customer_masters.sql).

---

## 2. €1.1M of the order book is unfulfilled

| Status | Orders | % of orders | Net value | % of value | Avg order |
|---|---|---|---|---|---|
| Completed | 566 | 79.9% | €7,779,663.49 | 87.6% | €13,744.99 |
| Open | 97 | 13.7% | €942,990.50 | 10.6% | €9,721.55 |
| In Process | 16 | 2.3% | €159,212.50 | 1.8% | €9,950.78 |
| Not Relevant | 29 | 4.1% | €0.00 | 0.0% | €0.00 |

![Horizontal bars of net value by order status. Completed 7.78 million euro, Open 943 thousand, In Process 159 thousand, Not Relevant zero.](charts/02-order-status.png)

**€1,102,203.00 across 113 orders** sits in Open or In Process — 12.4% of the
book not yet converted to revenue. Open orders also run **29% below** the
completed-order average (€9,722 vs €13,745), which is worth a follow-up: smaller
orders appear to stall more often, which would point at a fulfilment
prioritisation issue rather than a demand issue.

All 29 "Not Relevant" orders carry €0.00 net value. That status is applied when
an order has no delivery obligation, so excluding them from fulfilment KPIs is
correct — but any report that counts orders without filtering status will
overstate the denominator by 4.1%.

---

## 3. Two thirds of orders carry one of three identical values

| Net value | Orders | % of all orders |
|---|---|---|
| €20,092.50 | 235 | 33.2% |
| €12,000.00 | 138 | 19.5% |
| €9,000.00 | 79 | 11.2% |
| €3,040.00 | 51 | 7.2% |
| €6,080.00 | 50 | 7.1% |

**63.8% of the entire book** sits on just three exact values.

In this dataset that is the fingerprint of a shared training exercise. On a real
extract the same result would mean something specific and actionable: pricing is
being driven by standard configurations or copied templates rather than
negotiated per deal — which is either healthy standardisation or a sign that
sales is not using the pricing latitude it has. Either way it changes how you
model margin, and it is invisible in an average.

---

## 4. Data quality issues found

Run via [`sql/05_data_quality_checks.sql`](sql/05_data_quality_checks.sql).

| Check | Rows | Assessment |
|---|---|---|
| Same customer name, multiple BP IDs | 3 names / 94 IDs | **Material** — see finding 1 |
| Customer reference not numeric | 40 | Free-text in a reference field (e.g. `order3`); breaks joins to customer PO systems |
| Orders with zero net value | 30 | 29 explained by "Not Relevant" status; **1 is unexplained** |
| Requested delivery date before order date | 7 | **Impossible dates** — see below |
| Missing customer reference | 3 | Minor; blocks reconciliation against customer-side PO |

The seven backdated orders are worth naming because they cannot be a rounding
artefact:

| Sales order | Customer | Order date | Requested delivery | Gap | Status |
|---|---|---|---|---|---|
| 552 | The Bike Zone 256 | 2026-02-27 | 2026-02-23 | −4 days | Open |
| 180 | The Bike Zone 123 | 2026-02-11 | 2026-02-08 | −3 days | Open |
| 26 | The Bike Zone 055 | 2026-01-29 | 2026-01-27 | −2 days | Completed |
| 255 | the bike zone 223 | 2026-02-19 | 2026-02-18 | −1 day | Completed |
| 188 | The Bike Zone 378 | 2026-02-13 | 2026-02-12 | −1 day | Completed |
| 82 | The Bike Zone 135 | 2026-02-05 | 2026-02-04 | −1 day | Completed |
| 24 | The Bike Zone 016 | 2026-01-28 | 2026-01-27 | −1 day | Open |

Four were marked Completed, meaning they were fulfilled against a delivery date
that had already passed at order entry. Any on-time-delivery metric computed
from these rows is guaranteed to fail regardless of warehouse performance.

Note also `the bike zone 223` in lowercase — casing inconsistency in the same
field the duplicate analysis depends on, so name-based grouping needs
normalisation before it can be trusted.

---

## 5. Requested lead time

| Bucket | Orders | Avg order value | Net value |
|---|---|---|---|
| 15–30 days | 317 | €17,140.26 | €5,433,462.99 |
| Over 30 days | 144 | €6,708.22 | €965,983.50 |
| 1–7 days | 126 | €11,671.43 | €1,470,600.00 |
| Same day or backdated | 72 | €8,186.39 | €589,420.00 |
| 8–14 days | 49 | €8,620.41 | €422,400.00 |

45% of orders cluster at 15–30 days, and that bucket carries a **2.6× higher
average order value** than the over-30-day bucket. Larger orders being requested
on *shorter* notice than small ones is counter-intuitive and would be my next
question for the business — it suggests the long-lead orders are a different
kind of demand (replenishment, perhaps) rather than the same demand planned
further ahead.

---

## What I would do next with production data

1. **Fix the customer masters before anything else.** No customer-level metric is
   trustworthy until the 94 duplicate BP IDs are merged. Everything downstream
   inherits the error.
2. **Add a validation rule** blocking requested delivery dates earlier than the
   order date at entry. Seven rows is small; the class of error is not.
3. **Investigate the Open-order value gap** — why do smaller orders stall?
4. **Normalise `customer_reference`** or stop treating it as a join key.
5. **Rebuild concentration reporting on a cleansed customer hierarchy**, and
   re-run finding 1 to get the real number.

---

## Reproducing this

```bash
python scripts/run_analysis.py
```

Every number above comes out of `run_analysis.py`, run against the committed
`data/sales_orders.csv`. Nothing is hand-entered.
