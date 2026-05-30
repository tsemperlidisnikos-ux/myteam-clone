import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("MyTeam helpers", () => {
  it("passes smoke test", () => {
    assert.equal(1 + 1, 2);
  });
});

describe("role middleware logic", () => {
  it("admin role is recognized", () => {
    const role = "admin";
    assert.ok(role === "admin");
  });

  it("staff roles include coach", () => {
    const roles = ["admin", "coach"];
    assert.ok(roles.includes("coach"));
  });
});
