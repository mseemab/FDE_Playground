import { describe, expect, it } from "vitest";
import { checkCommand, simpleCommands, type GuardContext } from "./guard-bash";

const onBranch: GuardContext = {
  cwd: "/repo/apps/pantry-pal",
  repoRoot: "/repo",
  currentBranch: "claude/feature",
};
const onMain: GuardContext = { ...onBranch, currentBranch: "main" };

const blocked = (cmd: string, ctx = onBranch) => {
  expect(checkCommand(cmd, ctx), cmd).not.toBeNull();
};
const allowed = (cmd: string, ctx = onBranch) => {
  expect(checkCommand(cmd, ctx), cmd).toBeNull();
};

describe("simpleCommands", () => {
  it("splits on shell operators and strips env assignments and wrappers", () => {
    expect(simpleCommands('FOO=1 timeout 30 git push origin main && echo "a && b" | wc')).toEqual([
      ["git", "push", "origin", "main"],
      ["echo", "a && b"],
      ["wc"],
    ]);
  });
});

describe("heredocs", () => {
  it("ignores here-document bodies (data, not commands)", () => {
    allowed(
      "cat > SKILL.md <<'EOF'\nthe human runs `supabase link` and git push origin main\nEOF\necho ok",
    );
    allowed("cat <<-EOF > x\n\trm -rf /\n\tEOF");
  });

  it("still checks commands after the heredoc ends", () => {
    blocked("cat > a <<EOF\nhello\nEOF\ngit push origin main");
  });
});

describe("git push", () => {
  it.each([
    "git push origin main",
    "git push -u origin main",
    "git push origin HEAD:main",
    "git push origin feature:refs/heads/main",
    "git -C . push origin main",
    "git -c push.default=current push origin master",
    "cd /repo && git push origin main",
    "bash -c 'git push origin main'",
    "echo $(git push origin main)",
  ])("blocks pushes to main: %s", (cmd) => {
    blocked(cmd);
  });

  it.each([
    "git push --force origin feature",
    "git push -f",
    "git push -uf origin feature",
    "git push --force-with-lease origin feature",
    "git push origin +feature",
  ])("blocks force pushes: %s", (cmd) => {
    blocked(cmd);
  });

  it("blocks a bare push while on main", () => {
    blocked("git push", onMain);
    blocked("git push -u origin", onMain);
  });

  it.each([
    "git push",
    "git push -u origin claude/feature",
    "git push origin HEAD",
    "git push origin maintenance",
  ])("allows normal branch pushes: %s", (cmd) => {
    allowed(cmd);
  });
});

describe("gh", () => {
  it("blocks merging PRs but allows creating and viewing them", () => {
    blocked("gh pr merge 12 --squash");
    allowed("gh pr create --fill");
    allowed("gh pr view 12");
  });
});

describe("rm", () => {
  it.each([
    "rm -rf /",
    "rm -rf ~/projects",
    "rm -rf ../..",
    "rm -rf ../../../other",
    "rm -rf $HOME/x",
    "rm -r /tmp/x",
    "rm -rf /repo",
    "rm -rf ../../.git",
    "/bin/rm -rf /etc",
  ])("blocks recursive/forced deletes outside the repo: %s", (cmd) => {
    blocked(cmd);
  });

  it.each([
    "rm -rf .next node_modules",
    "rm -rf ../../apps/test-scaffold",
    "rm -f src/tmp.ts",
    "rm notes.txt ../../../x",
  ])("allows deletes inside the repo: %s", (cmd) => {
    allowed(cmd);
  });
});

describe("supabase", () => {
  it.each([
    "supabase link --project-ref abc",
    "supabase db push",
    "npx supabase db push",
    "pnpm exec supabase db pull",
    "pnpm supabase functions deploy hello",
    "supabase gen types typescript --linked",
    "supabase db reset --db-url postgres://x",
    "supabase secrets set KEY=value",
  ])("blocks remote-targeting commands: %s", (cmd) => {
    blocked(cmd);
  });

  it.each([
    "supabase start",
    "supabase db reset",
    "supabase gen types typescript --local",
    "supabase migration new add_items",
    "supabase status",
  ])("allows local commands: %s", (cmd) => {
    allowed(cmd);
  });
});
