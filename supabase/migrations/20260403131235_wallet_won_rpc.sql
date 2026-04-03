CREATE OR REPLACE FUNCTION increment_wallet_balance_won(
  p_user_id uuid,
  p_fc_inc numeric,
  p_fc_won_inc numeric
) RETURNS void AS $$
BEGIN
  INSERT INTO wallets (user_id, fc_balance, fc_won, updated_at)
  VALUES (p_user_id, p_fc_inc, p_fc_won_inc, now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    fc_balance = wallets.fc_balance + p_fc_inc,
    fc_won = wallets.fc_won + p_fc_won_inc,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
