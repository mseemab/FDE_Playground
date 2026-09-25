import path from "node:path";
import { findRepoRoot, isRelative, workspaceOf } from "./workspace.js";

/**
 * Local ESLint rules that enforce the factory's dependency rules (see docs/ARCHITECTURE.md).
 * Every message tells the agent what to do instead.
 */

/** @typedef {import("eslint").Rule.RuleModule} RuleModule */
/** @typedef {import("eslint").Rule.RuleContext} RuleContext */
/** @typedef {import("estree").Node} Node */

/**
 * Calls `onSource` for every static import/export source and literal dynamic import in a file.
 * @param {(node: Node, source: string) => void} onSource
 * @returns {import("eslint").Rule.RuleListener}
 */
function visitSources(onSource) {
  /** @param {Node & { source?: Node | null }} node */
  const check = (node) => {
    const src = node.source;
    if (src && src.type === "Literal" && typeof src.value === "string") onSource(src, src.value);
  };
  return {
    ImportDeclaration: check,
    ExportNamedDeclaration: check,
    ExportAllDeclaration: check,
    ImportExpression: check,
  };
}

/** @type {RuleModule} */
const noCrossWorkspaceImports = {
  meta: {
    type: "problem",
    docs: { description: "Enforce apps → packages dependency direction and app isolation." },
    schema: [],
    messages: {
      appImportsApp:
        "Apps must not import from other apps ('{{source}}'). Apps are isolated at runtime. " +
        "If both apps need this code, move it to a package under packages/ " +
        "(see .claude/skills/promote-to-package) and import it by package name.",
      packageImportsApp:
        "Packages must never import from apps ('{{source}}'). Dependencies flow one way: apps → packages. " +
        "Move the code you need into a package, or pass it in from the app as an argument.",
      relativeIntoWorkspace:
        "Don't reach into another workspace by relative path ('{{source}}'). " +
        "Import it by its package name (e.g. '@factory/ui') and declare it in this package.json.",
    },
  },
  create(context) {
    const file = context.filename;
    const repoRoot = findRepoRoot(path.dirname(file));
    if (repoRoot === null) return {};
    const self = workspaceOf(file, repoRoot);
    if (self === null) return {};

    return visitSources((node, source) => {
      if (source.startsWith("@apps/")) {
        if (self.kind === "app" && source.split("/")[1] === self.name) return;
        context.report({
          node,
          messageId: self.kind === "app" ? "appImportsApp" : "packageImportsApp",
          data: { source },
        });
        return;
      }
      if (!isRelative(source)) return;
      const target = workspaceOf(path.resolve(path.dirname(file), source), repoRoot);
      if (target === null || target.root === self.root) return;
      /** @type {string} */
      let messageId = "relativeIntoWorkspace";
      if (target.kind === "app")
        messageId = self.kind === "app" ? "appImportsApp" : "packageImportsApp";
      context.report({ node, messageId, data: { source } });
    });
  },
};

/**
 * @param {import("estree").Program} program
 * @returns {boolean}
 */
function hasUseClientDirective(program) {
  for (const stmt of program.body) {
    if (stmt.type !== "ExpressionStatement" || !("directive" in stmt)) return false;
    if (stmt.directive === "use client") return true;
  }
  return false;
}

const SERVER_PACKAGE_ENTRY = /^@factory\/[^/]+\/server(\/|$)/;

/** @type {RuleModule} */
const noServerImportInClient = {
  meta: {
    type: "problem",
    docs: { description: "Client components must not import server-only code." },
    schema: [],
    messages: {
      serverInClient:
        "Client components ('use client') must not import server code ('{{source}}'). " +
        "Put the logic in a server action (a 'use server' file) or a route handler and call that " +
        "from the client, or pass the data down as props from a server component.",
    },
  },
  create(context) {
    if (!hasUseClientDirective(context.sourceCode.ast)) return {};
    const fileDir = path.dirname(context.filename);
    return visitSources((node, source) => {
      if (isServerSource(source, fileDir)) {
        context.report({ node, messageId: "serverInClient", data: { source } });
      }
    });
  },
};

/**
 * @param {string} source
 * @param {string} fileDir
 * @returns {boolean}
 */
function isServerSource(source, fileDir) {
  if (source === "server-only") return true;
  if (source === "@/server" || source.startsWith("@/server/")) return true;
  if (SERVER_PACKAGE_ENTRY.test(source)) return true;
  if (isRelative(source)) {
    const resolved = path.resolve(fileDir, source);
    return resolved.split(path.sep).join("/").includes("/src/server");
  }
  return false;
}

/** @type {RuleModule} */
const requireServerOnly = {
  meta: {
    type: "problem",
    docs: { description: "Files in src/server/ must import 'server-only'." },
    schema: [],
    messages: {
      missing:
        "Files in src/server/ must import 'server-only' so that importing them from a client " +
        'component fails the build. Add `import "server-only";` as the first import.',
    },
  },
  create(context) {
    return {
      Program(program) {
        const found = program.body.some(
          (stmt) => stmt.type === "ImportDeclaration" && stmt.source.value === "server-only",
        );
        if (!found) context.report({ node: program, messageId: "missing" });
      },
    };
  },
};

/** @type {import("eslint").ESLint.Plugin} */
const plugin = {
  meta: { name: "factory" },
  rules: {
    "no-cross-workspace-imports": noCrossWorkspaceImports,
    "no-server-import-in-client": noServerImportInClient,
    "require-server-only": requireServerOnly,
  },
};

export default plugin;
