#!/usr/bin/env node
/**
 * Reference tooling: query and vendor the curated set in docs/references/MANIFEST.json
 * through the GitHub API (`gh api`), so an agent can study published HyperFrames work
 * without a browser and without guessing URLs.
 *
 *   npm run refs -- list
 *   npm run refs -- pull [id|--all]
 *   npm run refs -- search "exposure flash" [owner/repo]
 *   npm run refs -- read heygen-com/hyperframes registry/components/spring-pop/spring-pop.html
 *   npm run refs -- tree heygen-com/hyperframes registry/components
 *
 * Why `gh api` and not raw HTTP: it carries the user's own authentication (higher rate
 * limits, private-repo safe) and nothing here stores a token. Why a manifest and an
 * allow-list: an agent told to "go look at the viral videos" will otherwise search the
 * whole of GitHub; the manifest says which repos have earned a place and why.
 *
 * `pull` writes ONLY under docs/references/vendor/, with a PROVENANCE.md per entry (source
 * URL, commit sha, licence, date). Vendored files are reading material: src/ never
 * imports them. scripts/lint-repo.mjs does not treat them as artefacts (they are text).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "references", "MANIFEST.json"), "utf8"));
const VENDOR = path.join(ROOT, "docs", "references", "vendor");

function gh(args, { json = false } = {}) {
  const r = spawnSync("gh", ["api", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) {
    console.error("✗ could not run `gh` - install the GitHub CLI and run `gh auth login`");
    process.exit(1);
  }
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "gh api failed").trim().split("\n")[0]);
  return json ? JSON.parse(r.stdout) : r.stdout;
}

const allowed = (repo) => {
  if (!MANIFEST.allowedRepos.includes(repo)) {
    console.error(`✗ ${repo} is not in allowedRepos (docs/references/MANIFEST.json). Add it there, with a reason, first.`);
    process.exit(1);
  }
};

const readFile = (repo, file) => Buffer.from(gh([`repos/${repo}/contents/${file}`, "--jq", ".content"]).trim(), "base64").toString("utf8");

const [cmd, ...rest] = process.argv.slice(2);

switch (cmd) {
  case "list": {
    for (const e of MANIFEST.entries) {
      console.log(`${e.vendor ? "●" : "○"} ${e.id.padEnd(26)} ${e.repo}  [${e.license}]`);
      console.log(`    ${e.why}`);
      console.log(`    used by: ${e.usedBy}`);
    }
    console.log("\n● vendored (npm run refs -- pull)   ○ link only");
    break;
  }

  case "pull": {
    const want = rest[0];
    const entries = MANIFEST.entries.filter((e) => e.vendor && (!want || want === "--all" || e.id === want));
    if (!entries.length) {
      console.error(`✗ nothing to pull for "${want}". Try: npm run refs -- list`);
      process.exit(1);
    }
    for (const e of entries) {
      allowed(e.repo);
      const sha = gh([`repos/${e.repo}/commits/HEAD`, "--jq", ".sha"]).trim();
      const dir = path.join(VENDOR, e.id);
      fs.mkdirSync(dir, { recursive: true });
      const written = [];
      for (const file of e.files) {
        const dest = path.join(dir, file.split("/").slice(-1)[0]);
        fs.writeFileSync(dest, readFile(e.repo, file).replace(/\r\n/g, "\n"), "utf8");
        written.push(path.relative(ROOT, dest).replace(/\\/g, "/"));
      }
      fs.writeFileSync(
        path.join(dir, "PROVENANCE.md"),
        [
          `# ${e.id}`,
          "",
          `Vendored for reading. Not a runtime dependency: nothing in src/ imports it.`,
          "",
          `- source: https://github.com/${e.repo}`,
          `- commit: ${sha}`,
          `- licence: ${e.license} (the licence text is in the source repository; attribution is retained here)`,
          `- files: ${e.files.map((f) => `\`${f}\``).join(", ")}`,
          `- pulled: ${new Date().toISOString().slice(0, 10)}`,
          "",
          `## Why it is here`,
          e.why,
          "",
          `## What we took`,
          ...(e.takeaways || []).map((t) => `- ${t}`),
          "",
          `## Used by`,
          e.usedBy,
          ...(e.notTaken ? ["", "## What we did not take", e.notTaken] : []),
          "",
        ].join("\n"),
        "utf8",
      );
      console.log(`✓ ${e.id}  ${written.length} file(s) @ ${sha.slice(0, 7)}`);
    }
    break;
  }

  case "search": {
    const q = rest[0];
    const repos = rest[1] ? [rest[1]] : MANIFEST.allowedRepos;
    if (!q) {
      console.error('usage: npm run refs -- search "<terms>" [owner/repo]');
      process.exit(1);
    }
    for (const repo of repos) {
      allowed(repo);
      try {
        const out = gh(["-X", "GET", "search/code", "-f", `q=${q} repo:${repo}`, "--jq", ".items[:8][] | .path"]);
        const lines = out.trim().split("\n").filter(Boolean);
        if (lines.length) console.log(`\n${repo}\n${lines.map((l) => "  " + l).join("\n")}`);
      } catch (err) {
        console.error(`  (${repo}: ${err.message})`);
      }
    }
    break;
  }

  case "read": {
    const [repo, file] = rest;
    if (!repo || !file) {
      console.error("usage: npm run refs -- read <owner/repo> <path>");
      process.exit(1);
    }
    allowed(repo);
    process.stdout.write(readFile(repo, file));
    break;
  }

  case "tree": {
    const [repo, prefix = ""] = rest;
    if (!repo) {
      console.error("usage: npm run refs -- tree <owner/repo> [prefix]");
      process.exit(1);
    }
    allowed(repo);
    const out = gh([`repos/${repo}/git/trees/HEAD?recursive=1`, "--jq", ".tree[] | select(.type==\"blob\") | .path"]);
    out.split("\n").filter((p) => p && p.startsWith(prefix)).forEach((p) => console.log(p));
    break;
  }

  default:
    console.error("usage: npm run refs -- <list | pull [id|--all] | search \"<terms>\" [repo] | read <repo> <path> | tree <repo> [prefix]>");
    process.exit(cmd ? 1 : 0);
}
