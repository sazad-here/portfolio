-- Order book by fulfilment status: how much revenue is still exposed?
-- "Not Relevant" flags orders that carry no delivery obligation (e.g. cancelled
-- or credit-blocked), so they are separated rather than folded into open volume.

SELECT
    overall_status,
    COUNT(*)                                                     AS order_count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM sales_orders), 1) AS pct_of_orders,
    ROUND(SUM(net_value_eur), 2)                                 AS net_value_eur,
    ROUND(100.0 * SUM(net_value_eur)
          / (SELECT SUM(net_value_eur) FROM sales_orders), 1)    AS pct_of_value,
    ROUND(AVG(net_value_eur), 2)                                 AS avg_order_eur
FROM sales_orders
GROUP BY overall_status
ORDER BY net_value_eur DESC;
