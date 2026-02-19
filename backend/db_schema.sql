-- PrivateSplit Database Schema v2 (Supabase PostgreSQL)
-- Run this in your Supabase SQL Editor to create/update the required table.

CREATE TABLE IF NOT EXISTS splits (
  id SERIAL PRIMARY KEY,
  split_id VARCHAR(256) UNIQUE NOT NULL,
  creator VARCHAR(512) NOT NULL,          -- AES-256-GCM encrypted Aleo address
  total_amount BIGINT NOT NULL,           -- microcredits (encrypted)
  per_person BIGINT NOT NULL,             -- microcredits (encrypted)
  participant_count SMALLINT NOT NULL DEFAULT 2,
  issued_count SMALLINT NOT NULL DEFAULT 0,
  payment_count SMALLINT NOT NULL DEFAULT 0,
  salt VARCHAR(256) NOT NULL,
  description TEXT DEFAULT '',
  category VARCHAR(20) DEFAULT 'other',   -- dinner/groceries/rent/travel/utilities/entertainment/shopping/other
  expiry_hours INTEGER DEFAULT 0,          -- 0 = no expiry
  token_type VARCHAR(10) DEFAULT 'credits', -- credits/usdcx
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active' | 'settled' | 'expired'
  transaction_id VARCHAR(256) DEFAULT '',
  participants JSONB DEFAULT '[]'::jsonb,         -- Array of encrypted addresses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_splits_status ON splits(status);
CREATE INDEX IF NOT EXISTS idx_splits_created_at ON splits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_splits_salt ON splits(salt);
CREATE INDEX IF NOT EXISTS idx_splits_category ON splits(category);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_splits_updated_at ON splits;
CREATE TRIGGER update_splits_updated_at
  BEFORE UPDATE ON splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;

-- Policies for API access
DROP POLICY IF EXISTS "Allow anonymous reads" ON splits;
CREATE POLICY "Allow anonymous reads" ON splits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous inserts" ON splits;
CREATE POLICY "Allow anonymous inserts" ON splits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous updates" ON splits;
CREATE POLICY "Allow anonymous updates" ON splits
  FOR UPDATE USING (true);

-- Migration: Add new columns to existing table (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='splits' AND column_name='category') THEN
    ALTER TABLE splits ADD COLUMN category VARCHAR(20) DEFAULT 'other';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='splits' AND column_name='expiry_hours') THEN
    ALTER TABLE splits ADD COLUMN expiry_hours INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='splits' AND column_name='token_type') THEN
    ALTER TABLE splits ADD COLUMN token_type VARCHAR(10) DEFAULT 'credits';
  END IF;
END $$;
