-- Order values are suspiciously repetitive. This query tests that impression:
-- if a handful of exact values dominate the book, pricing is being driven by
-- standard configurations (or by template reuse) rather than by negotiation.

SELECT
    ROUND(net_value_eur, 2)                                          AS net_value_eur,
    COUNT(*)                                                         AS times_this_exact_value_appears,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM sales_orders), 1) AS pct_of_all_orders
FROM sales_orders
WHERE net_value_eur > 0
GROUP BY ROUND(net_value_eur, 2)
HAVING COUNT(*) > 4
ORDER BY times_this_exact_value_appears DESC
LIMIT 12;
