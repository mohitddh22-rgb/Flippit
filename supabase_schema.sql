-- USERS TABLE
create table users (
  id uuid primary key references auth.users(id),
  full_name text not null,
  email text unique not null,
  phone text unique not null,
  date_of_birth date,
  pan_number text,
  aadhaar_number text,
  kyc_status text default 'pending' 
    check (kyc_status in ('pending','submitted','verified','rejected')),
  kyc_income_proof_url text,
  kyc_id_proof_url text,
  is_admin boolean default false,
  is_active boolean default true,
  is_blocked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FC WALLETS TABLE
-- Every user has one wallet
-- fc_balance = total FC currently held
-- fc_bought = total FC ever bought with INR (used for INR withdrawal limit)
-- fc_won = total FC won from bets
-- inr_deposited = total INR ever deposited
create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  fc_balance numeric(15,2) default 0,
  fc_bought numeric(15,2) default 0,
  fc_won numeric(15,2) default 0,
  inr_deposited numeric(15,2) default 0,
  inr_withdrawable numeric(15,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FC TRANSACTIONS TABLE
-- Tracks every FC movement: buy, bet_placed, bet_won, 
-- bet_lost, fee_deducted, inr_withdrawal, coupon_redeem
create table fc_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type text not null check (type in (
    'fc_purchase',
    'bet_placed',
    'bet_won',
    'bet_lost',
    'bet_refunded',
    'fee_premium',
    'fee_winning',
    'inr_withdrawal',
    'coupon_redemption',
    'admin_credit',
    'admin_debit'
  )),
  fc_amount numeric(15,2) not null,
  inr_amount numeric(15,2),
  balance_before numeric(15,2),
  balance_after numeric(15,2),
  reference_id uuid,
  description text,
  created_at timestamptz default now()
);

-- INR DEPOSITS TABLE
-- Records every Razorpay payment
create table inr_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  razorpay_order_id text unique not null,
  razorpay_payment_id text,
  amount_inr numeric(15,2) not null,
  premium_fee numeric(15,2) not null,
  fc_credited numeric(15,2) not null,
  status text default 'pending' 
    check (status in ('pending','completed','failed','refunded')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CRICKET MATCHES TABLE
-- Auto-populated via CricAPI polling every 5 minutes
create table cricket_matches (
  id uuid primary key default gen_random_uuid(),
  external_match_id text unique not null,
  match_name text not null,
  team1 text not null,
  team2 text not null,
  match_type text,
  venue text,
  match_date timestamptz not null,
  status text default 'upcoming' 
    check (status in ('upcoming','live','completed','cancelled','abandoned')),
  result text,
  winner text,
  toss_winner text,
  toss_decision text,
  score_team1 text,
  score_team2 text,
  is_betting_open boolean default false,
  betting_closes_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BET BRACKETS TABLE
-- Defines the FC amount brackets available for betting
create table bet_brackets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  min_fc numeric(15,2) not null,
  max_fc numeric(15,2) not null,
  is_active boolean default true,
  display_order int
);

-- Seed brackets
insert into bet_brackets (label, min_fc, max_fc, display_order) values
  ('100 – 500',       100,    500,    1),
  ('500 – 1,000',     500,    1000,   2),
  ('1,000 – 2,000',   1000,   2000,   3),
  ('2,000 – 5,000',   2000,   5000,   4),
  ('5,000 – 20,000',  5000,   20000,  5),
  ('20,000 – 50,000', 20000,  50000,  6),
  ('50,000 – 1 Lac',  50000,  100000, 7);

-- BETS TABLE
-- Core betting table
-- side: 'heads' or 'tails' (coin flip)
-- status: open (waiting for match) → matched (opponent found) 
--       → settled_won / settled_lost / refunded
create table bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  match_id uuid references cricket_matches(id),
  bracket_id uuid references bet_brackets(id),
  fc_amount numeric(15,2) not null,
  side text not null check (side in ('heads','tails')),
  status text default 'open' check (status in (
    'open',
    'matched',
    'settled_won',
    'settled_lost',
    'cancelled',
    'refunded'
  )),
  matched_bet_id uuid references bets(id),
  matched_at timestamptz,
  settled_at timestamptz,
  winning_fc numeric(15,2),
  fee_charged numeric(15,2),
  net_fc_won numeric(15,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BET OPEN COUNT VIEW
-- Used by frontend to show open bets per bracket per match
create view open_bets_summary as
select
  b.match_id,
  b.bracket_id,
  bb.label as bracket_label,
  bb.min_fc,
  bb.max_fc,
  count(*) filter (where b.side = 'heads') as heads_count,
  count(*) filter (where b.side = 'tails') as tails_count,
  count(*) as total_open_bets,
  sum(b.fc_amount) as total_fc_at_stake
from bets b
join bet_brackets bb on b.bracket_id = bb.id
where b.status = 'open'
group by b.match_id, b.bracket_id, bb.label, bb.min_fc, bb.max_fc;

-- WITHDRAWALS TABLE
-- User can withdraw INR equivalent of their fc_bought only
-- NOT winning FC — winning FC goes to gift coupons
create table withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  amount_inr numeric(15,2) not null,
  fc_deducted numeric(15,2) not null,
  bank_account_name text,
  bank_account_number text,
  bank_ifsc text,
  status text default 'pending' 
    check (status in ('pending','processing','completed','rejected')),
  rejection_reason text,
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- COUPON REDEMPTIONS TABLE
-- Winning FC redeemed as gift coupons
create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  fc_amount numeric(15,2) not null,
  inr_value numeric(15,2) not null,
  platform text not null 
    check (platform in ('amazon','flipkart','swiggy',
                        'zomato','myntra','paytm','nykaa','other')),
  coupon_code text,
  coupon_email_sent boolean default false,
  coupon_sent_at timestamptz,
  status text default 'pending' 
    check (status in ('pending','processing','delivered','failed')),
  created_at timestamptz default now()
);

-- ADMIN FEE LEDGER TABLE
-- All fees credited to Strandix super admin account
create table admin_fee_ledger (
  id uuid primary key default gen_random_uuid(),
  fee_type text not null 
    check (fee_type in ('fc_purchase_premium','winning_fee')),
  user_id uuid references users(id),
  bet_id uuid references bets(id),
  inr_amount numeric(15,2),
  fc_amount numeric(15,2),
  created_at timestamptz default now()
);

-- NOTIFICATIONS TABLE
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text not null,
  message text not null,
  type text check (type in (
    'bet_matched','bet_won','bet_lost','deposit_success',
    'withdrawal_processed','coupon_delivered','kyc_update'
  )),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security Policies
alter table users enable row level security;
alter table wallets enable row level security;
alter table fc_transactions enable row level security;
alter table bets enable row level security;
alter table withdrawals enable row level security;
alter table coupon_redemptions enable row level security;
alter table notifications enable row level security;

-- Users can only read/update their own data
create policy "users_own_data" on users
  for all using (auth.uid() = id or (select is_admin from users where id = auth.uid()));
create policy "wallet_own" on wallets
  for all using (auth.uid() = user_id or (select is_admin from users where id = auth.uid()));
create policy "transactions_own" on fc_transactions
  for select using (auth.uid() = user_id or (select is_admin from users where id = auth.uid()));
create policy "bets_own" on bets
  for all using (auth.uid() = user_id or (select is_admin from users where id = auth.uid()));
create policy "withdrawals_own" on withdrawals
  for all using (auth.uid() = user_id or (select is_admin from users where id = auth.uid()));
create policy "coupons_own" on coupon_redemptions
  for all using (auth.uid() = user_id or (select is_admin from users where id = auth.uid()));
create policy "notifications_own" on notifications
  for all using (auth.uid() = user_id or (select is_admin from users where id = auth.uid()));

-- Admins can view/update all relevant operational data
create policy "admins_all_users" on users for all using ( (select is_admin from users where id = auth.uid()) );
create policy "admins_all_withdrawals" on withdrawals for all using ( (select is_admin from users where id = auth.uid()) );
create policy "admins_all_notifications" on notifications for all using ( (select is_admin from users where id = auth.uid()) );

-- Public read on cricket matches and brackets
create policy "matches_public_read" on cricket_matches
  for select using (true);
create policy "brackets_public_read" on bet_brackets
  for select using (true);
create policy "open_bets_public_read" on bets
  for select using (status = 'open');
