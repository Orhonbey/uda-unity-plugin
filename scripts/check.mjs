#!/usr/bin/env node
// Dependency-free content check for the plugin. Prints one line per problem
// and a summary line; exits 0 when there are none, 1 otherwise.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const problems = []
const problem = (message) => problems.push(message)

const CORE_LIMIT = 6144
const PROFILE_LIMIT = 2048
const LIBRARIES = ['addressables.md', 'srdebugger.md', 'remote-config.md', 'input-system.md', 'testing.md']
const READ_ONLY = 'Read, Grep, Glob'
const AGENTS = {
  'uda-unity-architect': READ_ONLY,
  'uda-unity-debugger': READ_ONLY,
  'uda-unity-reviewer': READ_ONLY,
  'uda-unity-performance': READ_ONLY,
  'uda-unity-verifier': 'Read, Grep, Glob, Bash',
  'uda-unity-writer': 'Read, Grep, Glob, Edit, Write, Bash'
}
// Text left over from the uda CLI era; shipped content must not mention it.
const STALE = ['.uda/', 'uda-cli', 'uda sync', 'uda config', 'uda plugin']
const CONTENT_DIRS = ['rules', 'agents', 'skills', 'commands']

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

// rules/
const checkRules = () => {
  if (!exists('rules/core.md')) {
    problem('rules/core.md: missing')
  } else {
    checkSize('rules/core.md', CORE_LIMIT)
    const core = read('rules/core.md')
    for (const file of LIBRARIES) {
      const linked = `.claude/uda/rules/libraries/${file}`
      if (!core.includes(linked)) problem(`rules/core.md: does not reference ${linked}`)
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

// skills/
const checkSkills = () => {
  if (list('skills').filter((dir) => exists(`skills/${dir}/SKILL.md`)).length === 0) {
    problem('skills/: no skill folder with a SKILL.md')
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

// commands/
const checkCommands = () => {
  const files = list('commands').filter((f) => f.endsWith('.md'))
  if (!files.includes('uda-new-project.md')) problem('commands/uda-new-project.md: missing')
  for (const file of files) {
    const fm = frontmatter(read(`commands/${file}`))
    if (!fm || !fm.description) problem(`commands/${file}: frontmatter is missing "description"`)
  }
}

// No leftovers from the uda CLI in shipped content
const checkStale = () => {
  for (const dir of CONTENT_DIRS) {
    for (const rel of walk(dir)) {
      const text = readFileSync(abs(rel), 'utf8')
      for (const word of STALE) {
        if (text.includes(word)) problem(`${rel}: mentions "${word}", which no longer exists`)
      }
      // Rules are read from the project's copy, never from the linked repository
      if (dir !== 'commands' && text.includes('~/.claude/uda/rules/')) {
        problem(`${rel}: points at ~/.claude/uda/rules/; use the project copy .claude/uda/rules/`)
      }
    }
  }
}

// scripts/
const checkScripts = () => {
  for (const rel of ['scripts/bootstrap.sh', 'scripts/copy-rules.sh', 'scripts/agent-check.mjs']) {
    if (!exists(rel)) problem(`${rel}: missing`)
    else if ((statSync(abs(rel)).mode & 0o111) === 0) problem(`${rel}: not executable`)
  }
}

checkRules()
checkAgents()
checkSkills()
checkCommands()
checkStale()
checkScripts()

for (const message of problems) console.log(message)
console.log(problems.length === 0 ? 'OK: no problems found' : `FAIL: ${problems.length} problem(s) found`)
process.exit(problems.length === 0 ? 0 : 1)
