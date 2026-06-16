-- =====================================================
-- MIGRATION: Kit Orders — pedidos via landing page MP
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

CREATE TABLE IF NOT EXISTS kit_orders (
  id                 UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id         INTEGER      NOT NULL,
  kit_id             UUID         REFERENCES kits(id) ON DELETE SET NULL,
  mp_preference_id   TEXT,
  mp_payment_id      TEXT,
  external_reference TEXT         UNIQUE,
  status             TEXT         DEFAULT 'pending',  -- pending | approved | rejected | cancelled | refunded
  customer_name      TEXT,
  customer_email     TEXT,
  customer_phone     TEXT,
  customer_cep       TEXT,
  kit_name           TEXT,
  kit_price          DECIMAL(10,2),
  shipping_cost      DECIMAL(10,2) DEFAULT 0,
  shipping_name      TEXT,
  discount_amount    DECIMAL(10,2) DEFAULT 0,
  coupon_code        TEXT,
  total_amount       DECIMAL(10,2),
  payment_method     TEXT,
  created_at         TIMESTAMPTZ  DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kit_orders_company    ON kit_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_kit_orders_status     ON kit_orders(status);
CREATE INDEX IF NOT EXISTS idx_kit_orders_ext_ref    ON kit_orders(external_reference);
CREATE INDEX IF NOT EXISTS idx_kit_orders_payment    ON kit_orders(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_kit_orders_created    ON kit_orders(created_at DESC);

ALTER TABLE kit_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kit_orders_all" ON kit_orders FOR ALL USING (true);

CREATE OR REPLACE FUNCTION update_kit_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kit_orders_updated_at
  BEFORE UPDATE ON kit_orders
  FOR EACH ROW EXECUTE FUNCTION update_kit_orders_updated_at();
