#!/usr/bin/env node
// agent-check — verify from git what a sub-agent changed.
// Dependency-free; needs Node 18+ and git.
//
//   node agent-check.mjs snapshot <file>
//   node agent-check.mjs check <file> [allowed-path...]
//
// Exit codes: 0 clean, 2 findings, 1 the check could not run.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { lstat, readdir, readFile, readlink, realpath } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'

const execFileAsync = promisify(execFile)

class AgentCheckError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AgentCheckError'
  }
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex')

// Run git without a shell; returns stdout as a string
async function git(cwd, args) {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 512 * 1024 * 1024,
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    })
    return stdout
  } catch (err) {
    const detail = (err.stderr || err.message || '').toString().trim()
    throw new AgentCheckError(`git ${args[0]} failed: ${detail}`)
  }
}

const splitZ = (out) => out.split('\0').filter((s) => s.length > 0)

async function findRoot(cwd) {
  let out
  try {
    out = await git(cwd, ['rev-parse', '--show-toplevel'])
  } catch {
    throw new AgentCheckError('not a git repository')
  }
  return realpath(out.replace(/\r?\n$/, ''))
}

async function readHead(root) {
  try {
    return (await git(root, ['rev-parse', '--verify', '-q', 'HEAD'])).trim()
  } catch {
    return 'none'
  }
}

async function readBranch(root) {
  try {
    return (await git(root, ['symbolic-ref', '-q', '--short', 'HEAD'])).trim()
  } catch {
    return 'detached'
  }
}

async function readStash(root) {
  try {
    return (await git(root, ['rev-parse', '-q', '--verify', 'refs/stash'])).trim()
  } catch {
    return 'none'
  }
}

async function hashPath(root, rel) {
  const full = join(root, rel)
  let st
  try {
    st = await lstat(full)
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return 'deleted'
    throw err
  }
  if (st.isFile()) return sha256(await readFile(full))
  if (st.isSymbolicLink()) return sha256('symlink:' + (await readlink(full)))
  if (st.isDirectory()) return hashDirectory(full)
  return 'dir'
}

// A directory git lists as one entry: fingerprint what is inside it
async function hashDirectory(full) {
  let innerRoot = null
  try {
    innerRoot = await findRoot(full)
  } catch {
    innerRoot = null
  }
  if (innerRoot !== null && innerRoot === (await realpath(full))) {
    const state = await readState(innerRoot)
    const entries = Object.keys(state.dirty).sort().map((k) => [k, state.dirty[k]])
    return 'repo:' + sha256(JSON.stringify([state.head, state.index, entries]))
  }
  const entries = []
  await walkFiles(full, '', entries)
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  return 'tree:' + sha256(JSON.stringify(entries))
}

async function walkFiles(base, prefix, out) {
  for (const entry of await readdir(join(base, prefix), { withFileTypes: true })) {
    if (entry.name === '.git') continue
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) await walkFiles(base, rel, out)
    else if (entry.isFile()) out.push([rel, sha256(await readFile(join(base, rel)))])
    else if (entry.isSymbolicLink()) out.push([rel, sha256('symlink:' + (await readlink(join(base, rel))))])
  }
}

async function readState(root) {
  const head = await readHead(root)
  const index = sha256(await git(root, ['ls-files', '-s', '-z']))
  const status = await git(root, ['status', '--porcelain=v1', '-z', '--no-renames', '--untracked-files=all'])
  const dirty = Object.create(null)
  for (const record of splitZ(status)) {
    const rel = record.slice(3).replace(/\/+$/, '')
    dirty[rel] = await hashPath(root, rel)
  }
  return { root, head, index, dirty }
}

const SNAPSHOT_VERSION = 2

async function takeSnapshot(cwd) {
  const root = await findRoot(cwd)
  const { head, index, dirty } = await readState(root)
  const branch = await readBranch(root)
  const stash = await readStash(root)
  return { version: SNAPSHOT_VERSION, root, head, branch, stash, index, dirty: { ...dirty } }
}

function normalizeAllowed(entry) {
  if (typeof entry !== 'string') throw new AgentCheckError('allowed path must be a string')
  let p = entry
  while (p.startsWith('./')) p = p.slice(2)
  p = p.replace(/\/+$/, '')
  if (isAbsolute(entry) || /^[A-Za-z]:/.test(entry)) {
    throw new AgentCheckError(`allowed path must be relative to the repository root: ${JSON.stringify(entry)}`)
  }
  if (p === '' || p === '.') {
    throw new AgentCheckError(`allowed path is empty: ${JSON.stringify(entry)}`)
  }
  if (p.split(/[\\/]/).includes('..')) {
    throw new AgentCheckError(`allowed path must not contain "..": ${JSON.stringify(entry)}`)
  }
  return p
}

const isAllowed = (path, allowed) => allowed.some((a) => path === a || path.startsWith(a + '/'))

async function compareSnapshot(cwd, snapshot, allowed = []) {
  const allowedNorm = allowed.map(normalizeAllowed)
  const root = await findRoot(cwd)
  if (root !== snapshot.root) {
    throw new AgentCheckError(`snapshot was taken in a different repository: ${snapshot.root}`)
  }
  const now = await readState(root)
  const branch = await readBranch(root)
  const stash = await readStash(root)
  const changed = new Set()

  const before = snapshot.dirty
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
  for (const key of Object.keys(before)) {
    if (!has(now.dirty, key) || now.dirty[key] !== before[key]) changed.add(key)
  }
  for (const key of Object.keys(now.dirty)) {
    if (!has(before, key)) changed.add(key)
  }

  const headMoved = now.head !== snapshot.head
  if (headMoved && now.head !== 'none') {
    const out = snapshot.head === 'none'
      ? await git(root, ['ls-tree', '-r', '--name-only', '-z', 'HEAD'])
      : await git(root, ['diff', '--name-only', '--no-renames', '-z', snapshot.head, now.head])
    for (const p of splitZ(out)) changed.add(p)
  }

  const sorted = [...changed].sort()
  const findings = []
  for (const path of sorted) {
    if (!isAllowed(path, allowedNorm)) findings.push({ kind: 'outside-allowed', path })
  }
  if (headMoved) findings.push({ kind: 'head-moved', detail: `${snapshot.head} -> ${now.head}` })
  if (branch !== snapshot.branch) {
    findings.push({ kind: 'branch-changed', detail: `${JSON.stringify(snapshot.branch)} -> ${JSON.stringify(branch)}` })
  }
  if (now.index !== snapshot.index) findings.push({ kind: 'index-changed' })
  if (stash !== snapshot.stash) findings.push({ kind: 'stash-changed' })
  return { changed: sorted, findings }
}

function validateSnapshot(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && value.version !== SNAPSHOT_VERSION) {
    throw new AgentCheckError(
      `snapshot file has version ${JSON.stringify(value.version)}, this script reads version ${SNAPSHOT_VERSION}. ` +
      'Take a new snapshot with `agent-check.mjs snapshot <file>` before the sub-agent runs.'
    )
  }
  const ok = value && typeof value === 'object' &&
    typeof value.root === 'string' && typeof value.head === 'string' &&
    typeof value.branch === 'string' && typeof value.stash === 'string' &&
    typeof value.index === 'string' && value.dirty && typeof value.dirty === 'object' &&
    !Array.isArray(value.dirty) && Object.values(value.dirty).every((v) => typeof v === 'string')
  if (!ok) throw new AgentCheckError('snapshot file is corrupt')
  return value
}

// Real path of a file that may not exist yet (resolve its parent instead)
async function realTarget(file) {
  const abs = resolve(file)
  let st = null
  try {
    st = await lstat(abs)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  if (st) {
    try {
      return await realpath(abs)
    } catch {
      throw new AgentCheckError(`cannot resolve snapshot path: ${file}`)
    }
  }
  return join(await realpath(dirname(abs)), basename(abs))
}

async function assertOutsideTree(file, root) {
  const real = await realTarget(file)
  const rel = relative(root, real)
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
    throw new AgentCheckError('snapshot file must be outside the work tree')
  }
}

function fail(err) {
  console.error(`agent-check: ${err.message}`)
  process.exitCode = 1
}

async function handleAgentCheckSnapshot(file) {
  try {
    const root = await findRoot(process.cwd())
    await assertOutsideTree(file, root)
    const snapshot = await takeSnapshot(process.cwd())
    await writeFile(file, JSON.stringify(snapshot, null, 2) + '\n')
    console.log(`Snapshot written: ${file}`)
    process.exitCode = 0
  } catch (err) {
    fail(err)
  }
}

async function handleAgentCheckCheck(file, allowed = []) {
  try {
    const root = await findRoot(process.cwd())
    await assertOutsideTree(file, root)
    let snapshot
    try {
      snapshot = validateSnapshot(JSON.parse(await readFile(file, 'utf8')))
    } catch (err) {
      if (err instanceof AgentCheckError) throw err
      throw new AgentCheckError(`cannot read snapshot file: ${err.message}`)
    }
    const { changed, findings } = await compareSnapshot(process.cwd(), snapshot, allowed)
    for (const p of changed) console.log(`CHANGED ${JSON.stringify(p)}`)
    for (const f of findings) {
      if (f.kind === 'outside-allowed') console.log(`FINDING outside-allowed ${JSON.stringify(f.path)}`)
      else if (f.kind === 'head-moved' || f.kind === 'branch-changed') console.log(`FINDING ${f.kind} ${f.detail}`)
      else console.log(`FINDING ${f.kind}`)
    }
    console.log(findings.length === 0 ? 'clean' : `${findings.length} finding(s)`)
    process.exitCode = findings.length === 0 ? 0 : 2
  } catch (err) {
    fail(err)
  }
}

const USAGE = 'usage: agent-check.mjs snapshot <file> | check <file> [allowed-path...]'
const [cmd, file, ...allowed] = process.argv.slice(2)
if (cmd === 'snapshot' && file && allowed.length === 0) await handleAgentCheckSnapshot(file)
else if (cmd === 'check' && file) await handleAgentCheckCheck(file, allowed)
else {
  console.error(USAGE)
  process.exitCode = 1
}
