CREATE TABLE IF NOT EXISTS launch_workspaces (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS impar_archetype_diagnostics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  profession TEXT,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT,
  utm JSONB NOT NULL DEFAULT '{}'::jsonb,
  answers JSONB,
  scores JSONB,
  primary_archetype TEXT,
  secondary_archetype TEXT,
  tertiary_archetype TEXT,
  status TEXT NOT NULL DEFAULT 'started',
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  unlocked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS impar_diag_email_idx ON impar_archetype_diagnostics (email);
CREATE INDEX IF NOT EXISTS impar_diag_primary_idx ON impar_archetype_diagnostics (primary_archetype);
CREATE INDEX IF NOT EXISTS impar_diag_created_idx ON impar_archetype_diagnostics (created_at DESC);