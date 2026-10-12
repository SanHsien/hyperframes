import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const ADOPTION = Object.freeze({
  owner: "SanHsien/hyperframes",
  number: 2,
  branch: "sync/upstream-d94708e5",
  base: "82f7e6f2f32283b2074736f2b7deea6b810450a2",
  reviewedHead: "9aa1b4a8cb51baa253a2f890d9df0414160ccb4a",
  baseline: "7609091171650913d3afd6050b9bc643d9432c56",
});

export function selectCommentBase(event, repository, checkoutHead, isAncestor) {
  const pr = event.pull_request;
  if (!pr || !/^[a-f0-9]{40}$/.test(pr.base?.sha ?? "") || pr.head?.sha !== checkoutHead) {
    throw new Error("Comments requires the PR's exact checkout head and base SHA");
  }
  const applies =
    repository === ADOPTION.owner &&
    pr.head.repo?.full_name === ADOPTION.owner &&
    event.number === ADOPTION.number &&
    pr.head.ref === ADOPTION.branch &&
    pr.base.sha === ADOPTION.base;
  if (!applies) return pr.base.sha;
  if (
    !isAncestor(ADOPTION.reviewedHead, checkoutHead) ||
    !isAncestor(ADOPTION.baseline, ADOPTION.reviewedHead)
  ) {
    throw new Error("Comments adoption history does not match the reviewed PR");
  }
  return ADOPTION.baseline;
}

export function commentCheckBase(root, env = process.env) {
  if (env.GITHUB_ACTIONS !== "true") return env.COMMENT_CHECK_BASE ?? "origin/main";
  if (env.GITHUB_EVENT_NAME !== "pull_request") throw new Error("Unsupported Comments CI event");
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const isAncestor = (from, to) => {
    try {
      git(["merge-base", "--is-ancestor", from, to]);
      return true;
    } catch (error) {
      if (error.status === 1) return false;
      throw error;
    }
  };
  // In CI the event and fixed adoption record own the base, never COMMENT_CHECK_BASE.
  return selectCommentBase(
    JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8")),
    env.GITHUB_REPOSITORY,
    git(["rev-parse", "HEAD"]),
    isAncestor,
  );
}
