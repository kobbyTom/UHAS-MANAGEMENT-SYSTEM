-- Create login_history table to track user sessions
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    device TEXT,
    ip_address TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user-specific history retrieval
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON login_history(login_time DESC);

-- RLS Policies (if RLS is enabled on your Supabase)
-- ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own login history" 
-- ON login_history FOR SELECT 
-- USING (auth.uid() = user_id);
