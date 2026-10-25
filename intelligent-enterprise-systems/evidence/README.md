# Evidence — SAP System Screenshots

Six screenshots from hands-on work in SAP S/4HANA 2022 (Fiori 3.0), Global Bike
training client.

| Screenshot | Shows |
|---|---|
| [01-project-cost-report.png](01-project-cost-report.png) | Project P/2672 cost report by cost element — Actual / Commitment / Total / Plan. The commitment column is the one discussed in [project accounting](../03-process-documentation/project-accounting.md) |
| [02-cost-center-planning.png](02-cost-center-planning.png) | Cost centre planning report: cafeteria assessment, maintenance activity allocation, and under/over-absorbed overhead netting to zero |
| [03-project-network-graph.png](03-project-network-graph.png) | Network activity graph with earliest/latest dates and float — activity 0010 at zero float sits on the critical path, 0020 carries five days |
| [04-project-builder-wbs.png](04-project-builder-wbs.png) | WBS hierarchy and network activity structure in Project Builder |
| [05-secondary-cost-element.png](05-secondary-cost-element.png) | G/L account master for a secondary cost element used in activity allocation |
| [06-network-confirmation.png](06-network-confirmation.png) | Activity confirmation: planned 80 hours against actual and forecast duration of 265 |

---

## How these were redacted

The originals were full-screen captures taken to satisfy a coursework
requirement that browser tabs and the taskbar be visible to prove authorship.
That made them unsuitable for publication.

Each was cropped to the SAP application area, which removed:

- the browser tab bar (private mail and messaging tabs)
- the address bar (the hosting institution's internal server hostname)
- the bookmarks bar (unrelated personal browsing)
- the Windows taskbar
- the open account menu and profile avatar

The SAP shell header and the application content are kept, since that is the
only part with evidentiary value.

**One identifier is deliberately retained.** The training account `LEARN-672`
remains visible in the report footer of screenshot 01 and the "Created by" field
of screenshot 05. It is a course-issued account on a shared teaching sandbox —
not a credential, and not personal contact information — and leaving it in place
is what shows the work was genuinely executed rather than copied. Everything
that identified a person, a device, or an institution's infrastructure is gone.

---

## What is deliberately not published

Completed case-study answer templates are excluded. They are graded submissions
for a course that is still running, and publishing worked solutions would be an
academic integrity problem regardless of who benefits.

The SAP UCC Magdeburg curriculum PDF is excluded — it is copyrighted teaching
material and not mine to redistribute.

Peer evaluations of named teammates are excluded, because they are other
people's performance data.

The analysis, process documentation, and findings in this repository are my own
work and are published deliberately.

---

## Adding more screenshots later

`.gitignore` blocks images in this folder by default and un-ignores these six
explicitly. Any new image must be added to that allowlist by name, which forces
a deliberate decision — and a redaction pass — for each one.
