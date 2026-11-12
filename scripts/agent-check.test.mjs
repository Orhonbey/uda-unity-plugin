// Tests for agent-check.mjs. Run: node --test scripts/
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, realpathSync, symlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'agent-check.mjs')

describe('agent-check.mjs', () => {
  let repo, outer, snap

  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
  const run = (cwd, ...args) => {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' })
    return { code: r.status, out: r.stdout.trim().split('\n'), err: r.stderr }
  }
  const ac = (...args) => run(repo, ...args)

  beforeEach(() => {
    repo = realpathSync(mkdtempSync(join(tmpdir(), 'ac-repo-')))
    outer = realpathSync(mkdtempSync(join(tmpdir(), 'ac-out-')))
    snap = join(outer, 'snap.json')
    git('init', '-q')
    git('config', 'user.email', 'test@test.com')
    git('config', 'user.name', 'Test')
    mkdirSync(join(repo, 'src'))
    writeFileSync(join(repo, 'a.txt'), 'a\n')
    writeFileSync(join(repo, 'src', 'b.txt'), 'b\n')
    git('add', '.')
    git('commit', '-qm', 'initial')
  })

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true })
    rmSync(outer, { recursive: true, force: true })
  })

  it('prints clean and exits 0 when nothing changed', () => {
    assert.strictEqual(ac('snapshot', snap).code, 0)
    const r = ac('check', snap, 'src')
    assert.strictEqual(r.code, 0)
    assert.strictEqual(r.out.at(-1), 'clean')
  })

  it('allows a change inside an allowed folder, with ./ and trailing slash', () => {
    ac('snapshot', snap)
    writeFileSync(join(repo, 'src', 'new.txt'), 'n\n')
    const r = ac('check', snap, './src/')
    assert.strictEqual(r.code, 0)
    assert.deepStrictEqual(r.out, ['CHANGED "src/new.txt"', 'clean'])
  })

  it('flags a change outside the list with exit 2', () => {
    ac('snapshot', snap)
    writeFileSync(join(repo, 'a.txt'), 'changed\n')
    const r = ac('check', snap, 'src')
    assert.strictEqual(r.code, 2)
    assert.ok(r.out.includes('FINDING outside-allowed "a.txt"'))
    assert.strictEqual(r.out.at(-1), '1 finding(s)')
  })

  it('does not treat a sibling prefix as allowed', () => {
    ac('snapshot', snap)
    mkdirSync(join(repo, 'src2'))
    writeFileSync(join(repo, 'src2', 'x.txt'), 'x\n')
    assert.strictEqual(ac('check', snap, 'src').code, 2)
  })

  it('ignores a file that was already dirty and did not change', () => {
    writeFileSync(join(repo, 'a.txt'), 'dirty\n')
    ac('snapshot', snap)
    assert.strictEqual(ac('check', snap).code, 0)
  })

  it('flags staging, a commit, a branch switch and a stash', () => {
    ac('snapshot', snap)
    writeFileSync(join(repo, 'src', 'b.txt'), 'b2\n')
    git('add', 'src/b.txt')
    let r = ac('check', snap, 'src')
    assert.ok(r.out.includes('FINDING index-changed'))

    git('commit', '-qm', 'second')
    r = ac('check', snap, 'src')
    assert.ok(r.out.some((l) => l.startsWith('FINDING head-moved ')))

    ac('snapshot', snap)
    git('switch', '-qc', 'other')
    r = ac('check', snap)
    assert.ok(r.out.some((l) => l.startsWith('FINDING branch-changed ')))

    ac('snapshot', snap)
    writeFileSync(join(repo, 'a.txt'), 'stash me\n')
    git('stash', '-q')
    r = ac('check', snap)
    assert.ok(r.out.includes('FINDING stash-changed'))
  })

  it('works from a subdirectory', () => {
    run(join(repo, 'src'), 'snapshot', snap)
    writeFileSync(join(repo, 'src', 'c.txt'), 'c\n')
    assert.strictEqual(run(join(repo, 'src'), 'check', snap, 'src').code, 0)
  })

  it('exits 1 for a snapshot inside the work tree, also through a symlink', () => {
    assert.strictEqual(ac('snapshot', join(repo, 'snap.json')).code, 1)
    symlinkSync(repo, join(outer, 'link'))
    assert.strictEqual(ac('snapshot', join(outer, 'link', 'snap.json')).code, 1)
  })

  it('exits 1 outside a git repository', () => {
    assert.strictEqual(run(outer, 'snapshot', join(outer, 's.json')).code, 1)
  })

  it('exits 1 for absolute or parent allowed paths', () => {
    ac('snapshot', snap)
    assert.strictEqual(ac('check', snap, '/etc').code, 1)
    assert.strictEqual(ac('check', snap, 'src/../a.txt').code, 1)
  })

  it('exits 1 for a corrupt or old-version snapshot', () => {
    writeFileSync(snap, 'not json')
    assert.strictEqual(ac('check', snap).code, 1)
    writeFileSync(snap, JSON.stringify({ version: 1 }))
    const r = ac('check', snap)
    assert.strictEqual(r.code, 1)
    assert.match(r.err, /Take a new snapshot/)
  })

  it('exits 1 with usage for a wrong command', () => {
    const r = ac('nope')
    assert.strictEqual(r.code, 1)
    assert.match(r.err, /usage:/)
  })
})
