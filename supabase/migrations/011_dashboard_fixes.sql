-- Fix AR Outstanding: sum only UNPAID invoices (payment_status != 'paid')
-- Fix Delayed Closes: count only clients with risk_level = 'red' (not all monthly_closes)
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM clients WHERE active = true)::integer AS total_active_clients,
  (SELECT COALESCE(SUM(monthly_fee), 0) FROM clients WHERE active = true)::numeric AS total_monthly_billing,
  (SELECT COALESCE(SUM(india_tp_transfer), 0) FROM clients WHERE active = true)::numeric AS total_monthly_tp,
  (SELECT COUNT(DISTINCT client_id) FROM monthly_closes WHERE risk_level = 'red')::integer AS clients_delayed,
  (SELECT COUNT(*) FROM monthly_closes WHERE status = 'at_risk')::integer AS clients_at_risk,
  (SELECT COUNT(*) FROM monthly_closes WHERE status = 'complete')::integer AS clients_complete,
  (SELECT COUNT(*) FROM invoices WHERE payment_status != 'paid')::integer AS invoices_unpaid,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE payment_status != 'paid')::numeric AS ar_outstanding,
  (SELECT COUNT(*) FROM invoices WHERE payment_status != 'paid' AND outstanding_days > 20)::integer AS invoices_overdue_red,
  (SELECT COUNT(*) FROM invoices WHERE tp_transfer_status = 'pending')::integer AS tp_transfers_pending;
