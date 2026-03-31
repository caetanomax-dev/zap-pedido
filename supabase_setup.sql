-- ============================================================
-- ZapPedido — Execute este SQL no Supabase
-- Acesse: supabase.com → seu projeto → SQL Editor → New query
-- Cole tudo, clique em RUN
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number    text NOT NULL,
  store_id        text NOT NULL DEFAULT 'default',
  customer_name   text,
  customer_phone  text,
  customer_address text,
  payment_method  text,
  payment_change  numeric(10,2),
  items           jsonb NOT NULL,
  items_total     numeric(10,2) NOT NULL,
  delivery_fee    numeric(10,2) DEFAULT 0,
  grand_total     numeric(10,2) NOT NULL,
  status          text NOT NULL DEFAULT 'received',
  status_history  jsonb DEFAULT '[]'::jsonb,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_store_id     ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone        ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can read orders"   ON orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;

CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read orders"   ON orders FOR SELECT USING (true);
CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
