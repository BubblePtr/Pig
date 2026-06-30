import { beforeEach, describe, expect, it } from "vitest";
import {
  clearFollowUpDraft,
  getFollowUpDraft,
  hasFollowUpDraft,
  saveFollowUpDraft,
} from "@/entities/session/follow-up-drafts";

describe("Follow-up Draft storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists one follow-up draft per Session id", () => {
    saveFollowUpDraft("session-a", "Continue A");
    saveFollowUpDraft("session-b", "Continue B");

    expect(getFollowUpDraft("session-a")?.message).toBe("Continue A");
    expect(getFollowUpDraft("session-b")?.message).toBe("Continue B");
    expect(hasFollowUpDraft("session-a")).toBe(true);
    expect(hasFollowUpDraft("session-missing")).toBe(false);
  });

  it("clears only the selected Session draft after successful submit", () => {
    saveFollowUpDraft("session-a", "Continue A");
    saveFollowUpDraft("session-b", "Continue B");

    clearFollowUpDraft("session-a");

    expect(getFollowUpDraft("session-a")).toBeNull();
    expect(getFollowUpDraft("session-b")?.message).toBe("Continue B");
  });
});
