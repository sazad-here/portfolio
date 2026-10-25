-- Duplicate customer master detection.
--
-- Query 03 grouped on business partner ID and concluded there is no
-- concentration risk. This query groups on customer NAME instead and shows why
-- that conclusion was wrong: one trading name can be spread across many
-- business partner records, which fragments the customer in every downstream
-- report -- credit exposure, rebates, account planning, churn.

WITH by_name AS (
    SELECT
        customer_name,
        COUNT(DISTINCT business_partner_id) AS distinct_bp_ids,
        COUNT(*)                            AS order_count,
        SUM(net_value_eur)                  AS net_value_eur
    FROM sales_orders
    GROUP BY customer_name
)
SELECT
    customer_name,
    distinct_bp_ids,
    order_count,
    ROUND(net_value_eur, 2)                                    AS net_value_eur,
    ROUND(100.0 * net_value_eur
          / (SELECT SUM(net_value_eur) FROM sales_orders), 1)  AS pct_of_total_revenue
FROM by_name
WHERE distinct_bp_ids > 1
ORDER BY distinct_bp_ids DESC;
