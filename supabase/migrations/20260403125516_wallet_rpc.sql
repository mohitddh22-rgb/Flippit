CREATE OR REPLACE FUNCTION increment_wallet_balance(
  p_user_id uuid,
  p_fc_inc numeric,
  p_fc_bought_inc numeric,
  p_inr_dep_inc numeric,
  p_inr_withdrawable_inc numeric
) RETURNS void AS $$
BEGIN
  INSERT INTO wallets (user_id, fc_balance, fc_bought, inr_deposited, inr_withdrawable, updated_at)
  VALUES (p_user_id, p_fc_inc, p_fc_bought_inc, p_inr_dep_inc, p_inr_withdrawable_inc, now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    fc_balance = wallets.fc_balance + p_fc_inc,
    fc_bought = wallets.fc_bought + p_fc_bought_inc,
    inr_deposited = wallets.inr_deposited + p_inr_dep_inc,
    inr_withdrawable = wallets.inr_withdrawable + p_inr_withdrawable_inc,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
