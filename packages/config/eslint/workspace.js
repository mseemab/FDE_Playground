import { existsSync } from "node:fs";
import path from "node:path";

/** @typedef {{ kind: "app" | "package" | "template" | "tool"; name: string; root: string }} Workspace */

/** @type {Map<string, string | null>} */
const rootCache = new Map();

/**
 * Finds the monorepo root (the directory holding pnpm-workspace.yaml) above `dir`.
 * @param {string} dir
 * @returns {string | null}
 */
export function findRepoRoot(dir) {
  const cached = rootCache.get(dir);
  if (cached !== undefined) return cached;
  let current = dir;
  for (;;) {
    if (existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      rootCache.set(dir, current);
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      rootCache.set(dir, null);
      return null;
    }
    current = parent;
  }
}

/** @type {Record<string, Workspace["kind"]>} */
const KIND_BY_DIR = { apps: "app", packages: "package", templates: "template" };

/**
 * Returns the workspace member that owns `file`, or null when the file is outside any member.
 * @param {string} file absolute path
 * @param {string} repoRoot
 * @returns {Workspace | null}
 */
export function workspaceOf(file, repoRoot) {
  const rel = path.relative(repoRoot, file);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const [top, name] = rel.split(path.sep);
  if (top === "tools") return { kind: "tool", name: "tools", root: path.join(repoRoot, "tools") };
  const kind = top === undefined ? undefined : KIND_BY_DIR[top];
  if (kind === undefined || name === undefined || top === undefined) return null;
  return { kind, name, root: path.join(repoRoot, top, name) };
}

/**
 * @param {string} source
 * @returns {boolean}
 */
export function isRelative(source) {
  return source === "." || source === ".." || source.startsWith("./") || source.startsWith("../");
}
