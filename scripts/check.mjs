#!/usr/bin/env node
// Dependency-free content check for the plugin. Prints one line per problem
// and a summary line; exits 0 when there are none, 1 otherwise.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const problems = []
const problem = (message) => problems.push(message)

const MARKER_BEGIN = '<!-- uda:begin -->'
const MARKER_END = '<!-- uda:end -->'
const CORE_LIMIT = 6144
const PROFILE_LIMIT = 2048
const LIBRARIES = ['addressables.md', 'srdebugger.md', 'remote-config.md', 'input-system.md', 'testing.md']
const READ_ONLY = 'Read, Grep, Glob'
const AGENTS = {
  'unity-architect': READ_ONLY,
  'unity-debugger': READ_ONLY,
  'unity-reviewer': READ_ONLY,
  'unity-performance': READ_ONLY,
  'unity-verifier': 'Read, Grep, Glob, Bash',
  'unity-writer': 'Read, Grep, Glob, Edit, Write, Bash'
}

const abs = (rel) => join(root, rel)
const exists = (rel) => existsSync(abs(rel))
const isDir = (rel) => exists(rel) && statSync(abs(rel)).isDirectory()
const read = (rel) => readFileSync(abs(rel), 'utf8')

// Entry names directly inside a directory (sorted); [] when it is missing.
const list = (rel) => (isDir(rel) ? readdirSync(abs(rel)).sort() : [])

// Every file below a directory, as root-relative POSIX paths.
const walk = (rel) => {
  const out = []
  for (const name of list(rel)) {
    const child = `${rel}/${name}`
    if (isDir(child)) out.push(...walk(child))
    else out.push(child)
  }
  return out
}

// Block between the first two `---` lines; simple `key: value` lines only.
const frontmatter = (text) => {
  const lines = text.split(/\r?\n/)
  if (lines[0] !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end === -1) return null
  const data = {}
  for (const line of lines.slice(1, end)) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (m) data[m[1]] = m[2].trim()
  }
  return data
}

const checkSize = (rel, limit) => {
  const size = Buffer.byteLength(read(rel), 'utf8')
  if (size > limit) problem(`${rel}: ${size} bytes exceeds the ${limit} byte limit`)
}

// manifest.json
const checkManifest = () => {
  let manifest
  try {
    manifest = JSON.parse(read('manifest.json'))
  } catch (err) {
    problem(`manifest.json: not valid JSON (${err.message})`)
    return
  }
  if (typeof manifest.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    problem(`manifest.json: version is ${JSON.stringify(manifest.version)}, expected the form "X.Y.Z"`)
  }
  if (typeof manifest.uda_version !== 'string' || !/^>=\d+\.\d+\.\d+$/.test(manifest.uda_version)) {
    problem(`manifest.json: uda_version is ${JSON.stringify(manifest.uda_version)}, expected the form ">=X.Y.Z"`)
  }
  const profiles = manifest.capabilities?.rules?.profiles
  if (!Array.isArray(profiles)) {
    problem('manifest.json: capabilities.rules.profiles is missing or not an array')
    return
  }
  for (const name of profiles) {
    if (!exists(`rules/profiles/${name}.md`)) problem(`rules/profiles/${name}.md: listed in manifest but missing`)
  }
  for (const file of list('rules/profiles')) {
    if (!file.endsWith('.md') || !profiles.includes(file.slice(0, -3))) {
      problem(`rules/profiles/${file}: not listed in manifest capabilities.rules.profiles`)
    }
  }
}

// Engine name from the manifest (installed rule paths contain it); null when unusable.
const manifestEngine = () => {
  try {
    const engine = JSON.parse(read('manifest.json')).engine
    return typeof engine === 'string' && /^[A-Za-z0-9_-]+$/.test(engine) ? engine : null
  } catch {
    return null
  }
}

// rules/
const checkRules = () => {
  if (!exists('rules/core.md')) {
    problem('rules/core.md: missing')
  } else {
    checkSize('rules/core.md', CORE_LIMIT)
    const core = read('rules/core.md')
    const engine = manifestEngine()
    if (!engine) {
      problem('rules/core.md: cannot check library references, manifest.json has no usable "engine"')
    } else {
      for (const file of LIBRARIES) {
        const installed = `.uda/rules/${engine}/libraries/${file}`
        if (!core.includes(installed)) problem(`rules/core.md: does not reference ${installed}`)
      }
    }
  }
  for (const file of list('rules/profiles')) {
    if (file.endsWith('.md')) checkSize(`rules/profiles/${file}`, PROFILE_LIMIT)
  }
  const found = list('rules/libraries')
  for (const file of LIBRARIES) {
    if (!found.includes(file)) problem(`rules/libraries/${file}: missing`)
  }
  for (const file of found) {
    if (!LIBRARIES.includes(file)) problem(`rules/libraries/${file}: unexpected file`)
  }
}

// agents/
const checkAgents = () => {
  const files = list('agents')
  const expected = Object.keys(AGENTS).map((name) => `${name}.md`)
  for (const file of expected) {
    if (!files.includes(file)) problem(`agents/${file}: missing`)
  }
  for (const file of files) {
    if (!expected.includes(file)) problem(`agents/${file}: unexpected file`)
  }
  for (const file of files) {
    const rel = `agents/${file}`
    const fm = frontmatter(read(rel))
    if (!fm) {
      problem(`${rel}: missing frontmatter`)
      continue
    }
    for (const key of ['name', 'description', 'tools', 'model']) {
      if (!fm[key]) problem(`${rel}: frontmatter is missing "${key}"`)
    }
    const base = file.replace(/\.md$/, '')
    if (fm.name && fm.name !== base) problem(`${rel}: name "${fm.name}" does not match the file name`)
    if (fm.tools && base in AGENTS && fm.tools !== AGENTS[base]) {
      problem(`${rel}: tools is "${fm.tools}", expected "${AGENTS[base]}"`)
    }
  }
}

// True when manifest.json declares capabilities.skills === true.
const manifestDeclaresSkills = () => {
  try {
    return JSON.parse(read('manifest.json')).capabilities?.skills === true
  } catch {
    return false
  }
}

// skills/
const checkSkills = () => {
  if (manifestDeclaresSkills()) {
    const found = list('skills').filter((dir) => isDir(`skills/${dir}`) && exists(`skills/${dir}/SKILL.md`))
    if (!isDir('skills')) problem('skills/: missing, but manifest.json declares capabilities.skills')
    else if (found.length === 0) problem('skills/: no skill folder with a SKILL.md, but manifest.json declares capabilities.skills')
  }
  for (const dir of list('skills')) {
    if (!isDir(`skills/${dir}`)) continue
    const rel = `skills/${dir}/SKILL.md`
    if (!exists(rel)) {
      problem(`${rel}: missing`)
      continue
    }
    const fm = frontmatter(read(rel))
    if (!fm) {
      problem(`${rel}: missing frontmatter`)
      continue
    }
    if (!fm.name) problem(`${rel}: frontmatter is missing "name"`)
    else if (fm.name !== dir) problem(`${rel}: name "${fm.name}" does not match the folder name`)
    if (!fm.description) problem(`${rel}: frontmatter is missing "description"`)
  }
}

// No markers in shipped content
const checkMarkers = () => {
  for (const dir of ['rules', 'agents', 'skills', 'knowledge', 'workflows']) {
    for (const rel of walk(dir)) {
      const text = readFileSync(abs(rel), 'utf8')
      for (const marker of [MARKER_BEGIN, MARKER_END]) {
        if (text.includes(marker)) problem(`${rel}: contains the marker ${marker}`)
      }
    }
  }
}

checkManifest()
checkRules()
checkAgents()
checkSkills()
checkMarkers()

for (const message of problems) console.log(message)
console.log(problems.length === 0 ? 'OK: no problems found' : `FAIL: ${problems.length} problem(s) found`)
process.exit(problems.length === 0 ? 0 : 1)
