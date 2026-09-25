CREATE TABLE IF NOT EXISTS launch_workspaces (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dani_ecosystem_assets (
  key TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  preview_image TEXT NOT NULL,
  preview_alt TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  product TEXT NOT NULL DEFAULT '',
  project_id TEXT,
  responsible TEXT NOT NULL DEFAULT 'Não definido',
  status TEXT NOT NULL DEFAULT 'active',
  analytics JSONB NOT NULL DEFAULT '{"provider":"","connected":false,"note":"A VALIDAR"}'::jsonb,
  integration JSONB NOT NULL DEFAULT '{"provider":"","connected":false,"note":"A VALIDAR"}'::jsonb,
  health TEXT NOT NULL DEFAULT 'unknown',
  health_checked_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
