import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const login = read("src/app/login/page.tsx")
const shell = read("src/components/app-shell.tsx")
const overview = read("src/components/pages/overview.tsx")
const projects = read("src/components/pages/projects.tsx")
const switcher = read("src/components/project-switcher.tsx")
const ecosystem = read("src/lib/dani-ecosystem.ts")
const proxy = read("src/proxy.ts")
const contract = read("AGENTS.md")

assert(login.includes("const authenticatedUser = await refresh()"), "LOGIN_MUST_REFRESH_AUTH_CONTEXT")
assert(login.indexOf("await refresh()") < login.indexOf("router.replace"), "LOGIN_REFRESH_MUST_PRECEDE_NAVIGATION")
assert(login.includes("authenticatedUser.permissions"), "LOGIN_MUST_USE_AUTHORITATIVE_PERMISSIONS")
assert(login.includes("Plataforma de Gestão"), "LOGIN_IDENTITY_MUST_BE_GLOBAL")
assert(shell.includes('className="fixed inset-x-0 top-0'), "TOPBAR_MUST_BE_FIXED")
assert(shell.includes('/dani/logo-branca.png'), "DANI_LOGO_MUST_BE_VISIBLE")
assert(shell.includes("IMPAR®"), "IMPAR_IDENTITY_MUST_BE_VISIBLE")
assert(shell.includes("Carregando acesso e permissões"), "PRIVATE_SHELL_MUST_WAIT_FOR_AUTH")
assert(!overview.includes("Hoje no lançamento"), "HOME_MUST_NOT_RENDER_LAUNCH_DASHBOARD")
assert(!overview.includes("Foco da Dani agora"), "HOME_MUST_NOT_RENDER_ACTIVE_PROJECT_PRIORITIES")
assert(overview.includes("ECOSSISTEMA DIGITAL"), "HOME_MUST_RENDER_ECOSYSTEM")
assert(overview.includes("previewImage"), "ECOSYSTEM_CARDS_MUST_RENDER_PREVIEWS")
assert(ecosystem.includes("previewImage:"), "ECOSYSTEM_RESOURCES_MUST_DECLARE_PREVIEWS")
assert(proxy.includes('pathname.startsWith("/dani/")'), "DANI_PUBLIC_ASSETS_MUST_BYPASS_AUTH_PROXY")

const switcherBlock = switcher.slice(
  switcher.indexOf("export function ProjectSwitcher"),
  switcher.indexOf("type CreateProject"),
)
assert(switcherBlock.includes('router.push("/projetos")'), "PROJECT_SELECTION_MUST_OPEN_PROJECT_WORKSPACE")
assert(!switcherBlock.includes("Abrir quadro"), "PROJECT_SWITCHER_MUST_NOT_REPEAT_BOARD_ACTION")
assert(!switcherBlock.includes("Novo projeto"), "PROJECT_CREATION_MUST_NOT_LIVE_IN_SWITCHER")

assert(projects.includes("NewStageDialog"), "PROJECTS_MUST_HAVE_STAGE_DIALOG")
assert(projects.includes("await updateProject({ id: activeProject.id, stages })"), "STAGE_CREATION_MUST_PERSIST")
assert(projects.includes("Novo projeto"), "PROJECT_CREATION_MUST_LIVE_ON_PROJECTS_PAGE")

assert(contract.includes("DANI PANEL PROJECT LEAD"), "PROJECT_LEAD_CONTRACT_MISSING")
assert(contract.includes("QA GATE"), "QA_GATE_CONTRACT_MISSING")
assert(contract.includes("RELEASE MANAGER"), "RELEASE_GATE_CONTRACT_MISSING")

console.log("PANEL_INVARIANTS=PASS")
