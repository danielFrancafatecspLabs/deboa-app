-- Create waitlist_leads table for the landing page waitlist
CREATE TABLE IF NOT EXISTS waitlist_leads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  purchase_pain text,
  source text DEFAULT 'direct',
  campaign text,
  consent boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_waitlist_leads_email ON waitlist_leads(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_leads_created_at ON waitlist_leads(created_at);

-- Enable Row Level Security
ALTER TABLE waitlist_leads ENABLE ROW LEVEL SECURITY;

-- Policy: anon can insert (for the waitlist form)
CREATE POLICY "anon_can_insert_waitlist" ON waitlist_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: anon cannot select (to prevent data leaks)
CREATE POLICY "anon_cannot_select_waitlist" ON waitlist_leads
  FOR SELECT
  TO anon
  USING (false);

-- Policy: authenticated users can view all leads (admin)
CREATE POLICY "authenticated_can_select_waitlist" ON waitlist_leads
  FOR SELECT
  TO authenticated
  USING (true);