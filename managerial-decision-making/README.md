# Managerial Decision Making · Interactive Portfolio

**Live: https://sazad-here.github.io/portfolio/managerial-decision-making/**

Seven interactive models built on real business datasets. Each one re-solves live in the browser.

| Model | What you can do |
|---|---|
| [🏭 Product Mix Optimizer](https://sazad-here.github.io/portfolio/managerial-decision-making/04-product-mix/model.html) | Move margins and labour hours; watch the feasible region and optimal plan change; 8-model and 6-month plans |
| [🚚 Operations Optimizer](https://sazad-here.github.io/portfolio/managerial-decision-making/05-operations/model.html) | Staff scheduling (whole workers), shipping network, five-year investing |
| [🎲 Decision Lab](https://sazad-here.github.io/portfolio/managerial-decision-making/06-decision-lab/model.html) | Probability sliders, five decision rules, value of a forecast, risk aversion |
| [📈 Regression Lab](https://sazad-here.github.io/portfolio/managerial-decision-making/01-regression/model.html) | Animated least-squares fits on four datasets; prediction; confidence intervals |
| [💼 Retirement Savings Case](https://sazad-here.github.io/portfolio/managerial-decision-making/07-retirement-case/model.html) | Toggle predictors and the regression refits for 194 couples |
| [📊 Distribution Explorer](https://sazad-here.github.io/portfolio/managerial-decision-making/02-distributions/model.html) | Histograms, box plots and statistics for 14,059 transactions and more |
| [🔗 Relationship Explorer](https://sazad-here.github.io/portfolio/managerial-decision-making/03-relationships/model.html) | Survey crosstabs and a clickable correlation grid |

## How it works

- `assets/mdm-math.js`: a simplex / branch-and-bound optimiser and a least-squares regression engine. At the original inputs it reproduces every Excel Solver answer ($199,600, $615,812.50, $1,535,562.50, $176,050, $286,791.96, 23 workers).
- `assets/models/*.js`: data read straight from the course workbooks by `tools/build_portfolio_data.py` in the private coursework repo.
- Datasets: Albright, Winston & Zappe, *Business Analytics: Data Analysis and Decision Making*.
