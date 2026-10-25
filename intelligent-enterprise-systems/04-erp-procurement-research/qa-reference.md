# ERP Procurement — Q&A Reference

The questions I prepared to defend the [procurement analysis](README.md). Kept
here because the concepts recur in ERP and supply-chain analyst interviews.

---

## Concept and process

**What is the difference between procurement and purchasing?**
Purchasing is placing and receiving an order. Procurement is the broader
strategic process: identifying needs, selecting suppliers, negotiating
contracts, managing relationships, evaluating performance. ERP manages both, but
procurement is the full end-to-end cycle.

**Requisition vs purchase order?**
A requisition is internal — a department requesting permission to buy. It stays
inside the organisation and requires approval. A purchase order is external and
legally binding: a commitment to buy specified goods at a specified price. ERP
converts an approved requisition into a PO automatically. The approval step
between them is the control.

**What is three-way matching?**
The system compares three documents before releasing payment: the purchase order
(what was agreed), the goods receipt (what arrived), and the supplier invoice
(what was billed). Quantity, price, and item must agree across all three or
payment blocks. It prevents duplicate invoices, billing for undelivered goods,
and price manipulation — without human review.

**How does ERP improve data accuracy?**
Manual processing re-enters the same data at requisition, PO, receipt, and
invoice — four chances to introduce an error. ERP captures it once and flows it
forward. The result is a single consistent record rather than four
independently-maintained ones that drift.

---

## Application

**How does vendor-managed inventory actually work?**
Selected suppliers get portal access to real-time stock levels for their own
products. Below an agreed threshold, the supplier initiates replenishment
directly rather than waiting for a manual PO. Walmart reviews and approves. It
shifts inventory responsibility to the party with the best information about
their own product and lead times.

**What is cross-docking and how does ERP enable it?**
Inbound goods transfer directly to outbound trucks without being warehoused.
Timing has to be near-exact — the inbound delivery must arrive when the outbound
truck is loading. ERP synchronises purchase orders, delivery schedules, and DC
operations in one system so those three line up without manual coordination.

**How do you manage procurement at $400B scale?**
You cannot do it without automation — at that volume a 0.1% error rate is
hundreds of millions of dollars. ERP makes it tractable by standardising: every
purchase follows the same workflow, every payment passes three-way matching,
every transaction is logged. The system enforces consistency that headcount
cannot.

**Why Oracle rather than SAP?**
Different companies choose differently based on existing infrastructure, cost,
and vendor relationships. Walmart runs Oracle ERP Cloud with JDA for supply
chain; many comparable retailers run SAP. Both are leading platforms. I chose
Walmart because their scale makes the process unusually well documented, not
because the platform choice is instructive.

---

## Critical analysis

**You said data quality is a challenge. What has been done about it?**
Supplier onboarding programmes with training and standardised data templates,
validation checks at point of entry so bad formats are rejected before they
enter the system, and EDI for high-volume suppliers, which eliminates format
inconsistency structurally rather than catching it after the fact.

**Could Walmart run procurement without ERP?**
Theoretically, not practically. Each store would purchase independently, finance
would reconcile manually, and there would be no central view of spend. Inventory
data would always lag. It would take thousands of additional staff to approximate
what the system does automatically. At that scale ERP is not a convenience — the
business model does not function without it.

**What are the risks of over-relying on ERP for procurement?**
Three. **System downtime** — procurement halts because staff may not know the
manual fallback. **Over-automation** — fewer human checkpoints means errors
compound before anyone notices. **Vendor lock-in** — deeply embedded systems are
expensive to leave, which hands the vendor pricing power at renewal.

**How does ERP procurement support ethical sourcing?**
Suppliers can be tagged with compliance attributes — certifications, audit
results, environmental ratings. The procurement module filters or flags
non-compliant suppliers before a PO is generated. Across 100,000 suppliers in 24
countries, system enforcement is far more reliable than manual review.

---

## Systems and career

**How would you be involved in an ERP implementation?**
During implementation: configuration, data migration from legacy systems,
integration with surrounding software. After go-live: user support, performance,
custom reports and modules. I am most interested in the integration side —
connecting the ERP to other systems as companies adopt cloud tools alongside it.

**What technical skills are relevant?**
Platform-dependent. Oracle ERP Cloud: SQL and PL/SQL for data and custom
reporting. SAP: ABAP. Broadly: REST APIs for modern integration, and data
modelling to configure correctly. Business process knowledge matters as much —
you cannot build the right solution without understanding the process it serves.

**What is the most important thing for someone in IT to understand about ERP?**
That it is a business system, not a technical one. The common failure is treating
an ERP project as a software installation rather than a business
transformation. The technology is the tractable part. Getting thousands of people
across departments and countries to change how they work is not — and that is
what determines whether the project succeeds.
