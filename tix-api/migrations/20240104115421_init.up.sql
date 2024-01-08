CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id)
);
