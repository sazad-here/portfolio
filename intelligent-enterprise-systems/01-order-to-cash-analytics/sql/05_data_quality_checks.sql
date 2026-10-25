-- Data quality checks. Run these before trusting anything above.
-- Every extract gets this treatment; findings go in findings.md whether or not
-- they change the headline numbers.

SELECT 'orders with zero net value'                AS check_name,
       COUNT(*)                                    AS rows_affected
FROM sales_orders WHERE net_value_eur = 0

UNION ALL
SELECT 'requested delivery before order date',
       COUNT(*)
FROM sales_orders WHERE requested_lead_days < 0

UNION ALL
SELECT 'missing customer reference',
       COUNT(*)
FROM sales_orders WHERE customer_reference IS NULL OR TRIM(customer_reference) = ''

UNION ALL
SELECT 'customer reference is not numeric',
       COUNT(*)
FROM sales_orders
WHERE customer_reference IS NOT NULL
  AND CAST(customer_reference AS INTEGER) = 0
  AND TRIM(customer_reference) <> '0'

UNION ALL
SELECT 'same customer name mapped to >1 business partner id',
       COUNT(*)
FROM (SELECT customer_name FROM sales_orders
      GROUP BY customer_name HAVING COUNT(DISTINCT business_partner_id) > 1)

UNION ALL
SELECT 'business partner id missing from sold-to string',
       COUNT(*)
FROM sales_orders WHERE business_partner_id IS NULL OR business_partner_id = '';
