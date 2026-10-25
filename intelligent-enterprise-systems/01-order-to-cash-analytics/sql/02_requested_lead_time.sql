-- Requested lead time = requested delivery date - order document date.
-- Bucketed because the raw distribution is heavily concentrated at a few values,
-- which is itself the finding: customers are not requesting varied dates, they
-- are accepting whatever the default proposal is.

SELECT
    CASE
        WHEN requested_lead_days IS NULL  THEN 'unknown'
        WHEN requested_lead_days <= 0     THEN 'same day or backdated'
        WHEN requested_lead_days <= 7     THEN '1-7 days'
        WHEN requested_lead_days <= 14    THEN '8-14 days'
        WHEN requested_lead_days <= 30    THEN '15-30 days'
        ELSE                                   'over 30 days'
    END                          AS lead_time_bucket,
    COUNT(*)                     AS order_count,
    ROUND(AVG(net_value_eur), 2) AS avg_order_eur,
    ROUND(SUM(net_value_eur), 2) AS net_value_eur
FROM sales_orders
GROUP BY lead_time_bucket
ORDER BY order_count DESC;
