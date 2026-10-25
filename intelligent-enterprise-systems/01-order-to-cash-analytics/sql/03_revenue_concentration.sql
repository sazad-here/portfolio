-- Revenue concentration: how much of the book sits with the top 10 accounts?
-- Running total is the number a commercial team actually asks for -- it answers
-- "how many customers do we have to lose before this hurts?"

WITH by_customer AS (
    SELECT
        customer_name,
        business_partner_id,
        COUNT(*)                AS order_count,
        SUM(net_value_eur)      AS net_value_eur
    FROM sales_orders
    GROUP BY customer_name, business_partner_id
),
ranked AS (
    SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY net_value_eur DESC) AS rank,
        SUM(net_value_eur) OVER (ORDER BY net_value_eur DESC
                                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
                                                        AS running_value
    FROM by_customer
)
SELECT
    rank,
    customer_name,
    business_partner_id,
    order_count,
    ROUND(net_value_eur, 2)                                          AS net_value_eur,
    ROUND(100.0 * running_value
          / (SELECT SUM(net_value_eur) FROM sales_orders), 1)        AS cumulative_pct_of_revenue
FROM ranked
WHERE rank <= 10
ORDER BY rank;
