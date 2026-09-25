/**
 * PreToolUse hook for Bash (registered in .claude/settings.json). Backs up the permission deny
 * rules, which only match command text, by parsing each command and blocking:
 *   - git push to main/master (explicit refspec, or a bare push while on main), and force pushes
 *   - gh pr merge
 *   - rm -r/-f on paths outside the repository
 *   - Supabase CLI commands that target a remote/linked project
 * Exit code 2 blocks the call; the stderr message is shown to the agent.
 *
 * Runs directly with Node's TypeScript support (no build step), so keep it self-contained.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

export interface GuardContext {
  cwd: string;
  repoRoot: string;
  currentBranch: string | null;
}

const PROTECTED_BRANCHES = new Set(["main", "master"]);
const SEPARATORS = new Set(["&&", "||", ";", "|", "|&", "&", "\n", "(", ")"]);
const WRAPPERS = new Set([
  "timeout",
  "time",
  "nice",
  "nohup",
  "stdbuf",
  "command",
  "builtin",
  "env",
  "xargs",
  "sudo",
]);

/** Minimal shell tokenizer: handles quotes, escapes and command separators. */
export function tokenize(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let hasToken = false;
  let quote: "'" | '"' | null = null;
  const push = () => {
    if (hasToken) tokens.push(current);
    current = "";
    hasToken = false;
  };
  for (let i = 0; i < command.length; i++) {
    const ch = command.charAt(i);
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === "\\" && quote === '"' && i + 1 < command.length)
        current += command.charAt(++i);
      else current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      hasToken = true;
    } else if (ch === "\\" && i + 1 < command.length) {
      current += command.charAt(++i);
      hasToken = true;
    } else if (ch === " " || ch === "\t") {
      push();
    } else if (ch === "\n" || ch === ";" || ch === "(" || ch === ")") {
      push();
      tokens.push(ch);
    } else if ((ch === "&" || ch === "|") && command.charAt(i + 1) === ch) {
      push();
      tokens.push(ch + ch);
      i++;
    } else if (ch === "|" && command.charAt(i + 1) === "&") {
      push();
      tokens.push("|&");
      i++;
    } else if (ch === "&" || ch === "|") {
      push();
      tokens.push(ch);
    } else if (ch === "$" && command.charAt(i + 1) === "(") {
      push();
      tokens.push("(");
      i++;
    } else if (ch === "`") {
      push();
      tokens.push(";");
    } else {
      current += ch;
      hasToken = true;
    }
  }
  push();
  return tokens;
}

/**
 * Removes here-document bodies (`<<EOF … EOF`, `<<'EOF'`, `<<-EOF`): they are data written to a
 * file or stdin, not commands, so text like "run supabase link" in a doc must not be blocked.
 */
export function stripHeredocs(command: string): string {
  const lines = command.split("\n");
  const out: string[] = [];
  const pending: string[] = [];
  for (const line of lines) {
    const delimiter = pending[0];
    if (delimiter !== undefined) {
      if (line.replace(/^\t+/, "") === delimiter) pending.shift();
      continue;
    }
    out.push(line);
    for (const match of line.matchAll(/<<-?\s*(['"]?)([A-Za-z_][\w-]*)\1/g)) {
      if (match[2]) pending.push(match[2]);
    }
  }
  return out.join("\n");
}

/** Splits tokens into simple commands and strips env assignments and wrapper programs. */
export function simpleCommands(command: string): string[][] {
  const commands: string[][] = [];
  let current: string[] = [];
  for (const token of tokenize(stripHeredocs(command))) {
    if (SEPARATORS.has(token)) {
      if (current.length > 0) commands.push(current);
      current = [];
    } else {
      current.push(token);
    }
  }
  if (current.length > 0) commands.push(current);
  return commands.map(stripPrefixes).filter((c) => c.length > 0);
}

function stripPrefixes(words: string[]): string[] {
  let i = 0;
  for (;;) {
    const word = words[i];
    if (word === undefined) return [];
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) {
      i++;
    } else if (WRAPPERS.has(word)) {
      i++;
      // skip the wrapper's own options/arguments (e.g. `timeout 30`, `nice -n 5`)
      while (
        words[i] !== undefined &&
        (/^-/.test(words[i] ?? "") || /^\d+[smhd]?$/.test(words[i] ?? ""))
      )
        i++;
    } else {
      return words.slice(i);
    }
  }
}

/** Removes package-runner prefixes so `npx supabase …` / `pnpm exec supabase …` are checked too. */
function unwrapRunner(words: string[]): string[] {
  const [first, second] = words;
  if (first === "npx" || first === "bunx")
    return words.slice(1).filter((w, idx) => idx > 0 || !w.startsWith("-"));
  if (
    (first === "pnpm" || first === "yarn" || first === "npm") &&
    (second === "exec" || second === "dlx" || second === "x")
  ) {
    return words.slice(2);
  }
  if (first === "pnpm" && second === "supabase") return words.slice(1);
  return words;
}

/** git's global options come before the subcommand: `git -C dir -c k=v push …`. */
function gitSubcommand(words: string[]): { sub: string | undefined; args: string[] } {
  let i = 1;
  while (i < words.length) {
    const word = words[i] ?? "";
    if (word === "-C" || word === "-c" || word === "--git-dir" || word === "--work-tree") i += 2;
    else if (word.startsWith("-")) i++;
    else break;
  }
  return { sub: words[i], args: words.slice(i + 1) };
}

function checkGitPush(args: string[], ctx: GuardContext): string | null {
  const force = args.find(
    (a) =>
      a === "-f" ||
      a === "--force" ||
      a.startsWith("--force-with-lease") ||
      a === "--force-if-includes" ||
      a === "--mirror" ||
      (/^-[a-zA-Z]+$/.test(a) && a.includes("f")),
  );
  if (force !== undefined)
    return `Force pushes are not allowed (${force}). Push a new commit instead of rewriting history.`;

  const positional = args.filter((a) => !a.startsWith("-"));
  const refspecs = positional.slice(1); // first positional is the remote
  if (refspecs.some((r) => r.startsWith("+"))) return "Force pushes (+refspec) are not allowed.";
  for (const refspec of refspecs) {
    const dst = (refspec.includes(":") ? refspec.split(":")[1] : refspec) ?? "";
    const name = dst.replace(/^refs\/heads\//, "");
    if (PROTECTED_BRANCHES.has(name))
      return `Never push to ${name}. Work on a branch and open a PR with \`gh pr create\`.`;
  }
  if (
    refspecs.length === 0 &&
    ctx.currentBranch !== null &&
    PROTECTED_BRANCHES.has(ctx.currentBranch)
  ) {
    return `You are on ${ctx.currentBranch}; a bare \`git push\` would push to it. Create a branch (\`git switch -c <name>\`) and open a PR.`;
  }
  return null;
}

function checkRm(args: string[], ctx: GuardContext): string | null {
  const flags = args.filter((a) => a.startsWith("-") && a !== "--").join("");
  const recursive = /r|R|--recursive/.test(flags);
  const force = /f|--force/.test(flags);
  if (!recursive && !force) return null;
  const targets = args.filter((a) => !a.startsWith("-"));
  for (const target of targets) {
    if (target.startsWith("~") || target.includes("$")) {
      return `Refusing \`rm ${flags}\` on "${target}": only paths inside the repository may be deleted recursively.`;
    }
    const resolved = path.resolve(ctx.cwd, target);
    const rel = path.relative(ctx.repoRoot, resolved);
    if (
      rel === "" ||
      rel.startsWith("..") ||
      path.isAbsolute(rel) ||
      rel === ".git" ||
      rel.startsWith(`.git${path.sep}`)
    ) {
      return `Refusing \`rm ${flags}\` on "${target}" (resolves to ${resolved}): only paths inside the repository (and not the repo root or .git) may be deleted.`;
    }
  }
  return null;
}

const SUPABASE_REMOTE_SUBCOMMANDS = [
  ["link"],
  ["unlink"],
  ["db", "push"],
  ["db", "pull"],
  ["db", "dump"],
  ["functions", "deploy"],
  ["functions", "delete"],
  ["secrets"],
  ["projects"],
  ["branches"],
  ["storage"],
  ["sso"],
  ["domains"],
  ["vanity-subdomains"],
  ["postgres-config"],
  ["network-restrictions"],
  ["ssl-enforcement"],
];
const SUPABASE_REMOTE_FLAGS = ["--linked", "--db-url", "--project-ref"];

function checkSupabase(args: string[]): string | null {
  const flag = args.find((a) =>
    SUPABASE_REMOTE_FLAGS.some((f) => a === f || a.startsWith(`${f}=`)),
  );
  if (flag !== undefined) {
    return `Supabase commands against a remote project are not allowed (${flag}). Use the local stack (--local / supabase start); the human applies remote changes.`;
  }
  const positional = args.filter((a) => !a.startsWith("-"));
  for (const sub of SUPABASE_REMOTE_SUBCOMMANDS) {
    if (sub.every((word, i) => positional[i] === word)) {
      return `\`supabase ${sub.join(" ")}\` targets a remote project and is not allowed. Work against the local stack; the human runs remote/production commands.`;
    }
  }
  return null;
}

/** Returns a reason to block the command, or null to let it through to the permission rules. */
export function checkCommand(command: string, ctx: GuardContext): string | null {
  for (const raw of simpleCommands(command)) {
    const words = unwrapRunner(raw);
    const program = path.basename(words[0] ?? "");
    const args = words.slice(1);

    if (
      (program === "bash" || program === "sh" || program === "zsh") &&
      args[0] === "-c" &&
      args[1] !== undefined
    ) {
      const nested = checkCommand(args[1], ctx);
      if (nested) return nested;
      continue;
    }
    if (program === "git") {
      const { sub, args: gitArgs } = gitSubcommand(words);
      if (sub === "push") {
        const reason = checkGitPush(gitArgs, ctx);
        if (reason) return reason;
      }
    }
    if (program === "gh" && args[0] === "pr" && args[1] === "merge") {
      return "Agents never merge PRs (`gh pr merge`). Open the PR and leave merging to the human.";
    }
    if (program === "rm") {
      const reason = checkRm(args, ctx);
      if (reason) return reason;
    }
    if (program === "supabase") {
      const reason = checkSupabase(args);
      if (reason) return reason;
    }
  }
  return null;
}

function currentBranch(cwd: string): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  let input = "";
  for await (const chunk of process.stdin) input += String(chunk);
  const payload = JSON.parse(input) as { cwd?: string; tool_input?: { command?: unknown } };
  const command = payload.tool_input?.command;
  if (typeof command !== "string") return;
  const cwd = payload.cwd ?? process.cwd();
  const repoRoot = process.env.CLAUDE_PROJECT_DIR ?? path.resolve(import.meta.dirname, "../..");
  const reason = checkCommand(command, { cwd, repoRoot, currentBranch: currentBranch(cwd) });
  if (reason) {
    process.stderr.write(`Blocked by .claude guard: ${reason}\n`);
    process.exit(2);
  }
}

if (import.meta.main) await main();
