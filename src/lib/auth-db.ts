import { getSql } from "@/lib/db"
import { FEATURES, ROLE_DEFAULTS, type FeatureKey, type PanelRole } from "@/lib/auth-config"

let authSchemaPromise: Promise<void> | null = null

export type PanelUser = {
  id: string
  username: string
  display_name: string
  role: PanelRole
  password_salt: string
  password_hash: string
  active: boolean
  must_change_password: boolean
  password_changed_at: string | null
  created_at: string
  updated_at: string
}

export type PanelUserView = {
  id: string
  username: string
  displayName: string
  role: PanelRole
  active: boolean
  mustChangePassword: boolean
  permissions: FeatureKey[]
}
export function ensureAuthSchema() {
  if (authSchemaPromise) return authSchemaPromise
  const sql = getSql()
  authSchemaPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS panel_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
        password_changed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      ALTER TABLE panel_users
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE
    `
    await sql`
      ALTER TABLE panel_users
      ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ
    `
    await sql`
      CREATE TABLE IF NOT EXISTS panel_user_permissions (
        user_id TEXT NOT NULL REFERENCES panel_users(id) ON DELETE CASCADE,
        feature TEXT NOT NULL,
        allowed BOOLEAN NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, feature)
      )
    `
    await sql`
      CREATE INDEX IF NOT EXISTS panel_users_username_idx
      ON panel_users (LOWER(username))
    `
  })()
  return authSchemaPromise
}

function normalizeRole(value: string): PanelRole {
  if (["owner", "admin", "editor", "reviewer", "system"].includes(value)) return value as PanelRole
  return "reviewer"
}
export async function getUserByUsername(username: string) {
  await ensureAuthSchema()
  const result = await getSql()`
    SELECT id, username, display_name, role, password_salt, password_hash,
           active, must_change_password, password_changed_at, created_at, updated_at
    FROM panel_users
    WHERE LOWER(username) = LOWER(${username})
    LIMIT 1
  `
  const rows = result as unknown as PanelUser[]
  const row = rows[0]
  if (!row) return null
  return { ...row, role: normalizeRole(row.role) }
}

export async function getUserById(id: string) {
  await ensureAuthSchema()
  const result = await getSql()`
    SELECT id, username, display_name, role, password_salt, password_hash,
           active, must_change_password, password_changed_at, created_at, updated_at
    FROM panel_users
    WHERE id = ${id}
    LIMIT 1
  `
  const rows = result as unknown as PanelUser[]
  const row = rows[0]
  if (!row) return null
  return { ...row, role: normalizeRole(row.role) }
}

export async function getEffectivePermissions(userId: string, role: PanelRole) {
  await ensureAuthSchema()
  const rows = await getSql()`
    SELECT feature, allowed
    FROM panel_user_permissions
    WHERE user_id = ${userId}
  ` as Array<{ feature: string; allowed: boolean }>
  const allowed = new Set<FeatureKey>(ROLE_DEFAULTS[role])
  const valid = new Set(FEATURES.map((item) => item.key))
  for (const row of rows) {
    if (!valid.has(row.feature as FeatureKey)) continue
    if (row.allowed) allowed.add(row.feature as FeatureKey)
    else allowed.delete(row.feature as FeatureKey)
  }
  return FEATURES.map((item) => item.key).filter((key) => allowed.has(key))
}
export async function listUsers(): Promise<PanelUserView[]> {
  await ensureAuthSchema()
  const rows = await getSql()`
    SELECT id, username, display_name, role, active, must_change_password
    FROM panel_users
    ORDER BY CASE role
      WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'system' THEN 3
      WHEN 'editor' THEN 4 ELSE 5 END, username
  ` as Array<{ id: string; username: string; display_name: string; role: string; active: boolean; must_change_password: boolean }>
  return Promise.all(rows.map(async (row) => {
    const role = normalizeRole(row.role)
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      role,
      active: row.active,
      mustChangePassword: row.must_change_password,
      permissions: await getEffectivePermissions(row.id, role),
    }
  }))
}
export async function updateUserAccess(input: {
  userId: string
  role?: PanelRole
  active?: boolean
  mustChangePassword?: boolean
  permissions?: FeatureKey[]
}) {
  await ensureAuthSchema()
  const sql = getSql()
  const user = await getUserById(input.userId)
  if (!user) throw new Error("USER_NOT_FOUND")
  const role = input.role ?? user.role
  const active = input.active ?? user.active
  const mustChangePassword = input.mustChangePassword ?? user.must_change_password
  await sql`
    UPDATE panel_users
    SET role = ${role},
        active = ${active},
        must_change_password = ${mustChangePassword},
        updated_at = NOW()
    WHERE id = ${input.userId}
  `

  if (input.permissions) {
    const desired = new Set(input.permissions)
    for (const feature of FEATURES) {
      const base = ROLE_DEFAULTS[role].includes(feature.key)
      const next = desired.has(feature.key)
      if (base === next) {
        await sql`
          DELETE FROM panel_user_permissions
          WHERE user_id = ${input.userId} AND feature = ${feature.key}
        `
      } else {
        await sql`
          INSERT INTO panel_user_permissions (user_id, feature, allowed, updated_at)
          VALUES (${input.userId}, ${feature.key}, ${next}, NOW())
          ON CONFLICT (user_id, feature) DO UPDATE SET
            allowed = EXCLUDED.allowed,
            updated_at = NOW()
        `
      }
    }
  }
  const refreshed = await getUserById(input.userId)
  if (!refreshed) throw new Error("USER_NOT_FOUND")
  return {
    id: refreshed.id,
    username: refreshed.username,
    displayName: refreshed.display_name,
    role: refreshed.role,
    active: refreshed.active,
    mustChangePassword: refreshed.must_change_password,
    permissions: await getEffectivePermissions(refreshed.id, refreshed.role),
  }
}

export async function updateUserPassword(input: {
  userId: string
  passwordSalt: string
  passwordHash: string
  mustChangePassword: boolean
}) {
  await ensureAuthSchema()
  const sql = getSql()
  const user = await getUserById(input.userId)
  if (!user) throw new Error("USER_NOT_FOUND")

  await sql`
    UPDATE panel_users
    SET password_salt = ${input.passwordSalt},
        password_hash = ${input.passwordHash},
        must_change_password = ${input.mustChangePassword},
        password_changed_at = NOW(),
        updated_at = NOW()
    WHERE id = ${input.userId}
  `

  return getUserById(input.userId)
}

export async function setMustChangePassword(userId: string, mustChangePassword: boolean) {
  await ensureAuthSchema()
  await getSql()`
    UPDATE panel_users
    SET must_change_password = ${mustChangePassword},
        updated_at = NOW()
    WHERE id = ${userId}
  `
}
