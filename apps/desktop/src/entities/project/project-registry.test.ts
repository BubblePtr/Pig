import { beforeEach, describe, expect, it } from "vitest";
import {
  addProjectToRegistry,
  getProjectRegistry,
} from "@/entities/project/project-registry";

describe("Project Registry", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists manually added local directories by normalized absolute path", () => {
    const first = addProjectToRegistry("/Users/void/code/opensource/Pig/./", {
      now: () => "2026-06-30T08:00:00.000Z",
    });
    const second = addProjectToRegistry("/Users/void/Documents/study", {
      now: () => "2026-06-30T09:00:00.000Z",
    });

    expect(first).toMatchObject({
      added: true,
      project: {
        id: "/Users/void/code/opensource/Pig",
        path: "/Users/void/code/opensource/Pig",
        displayName: "Pig",
        addedAt: "2026-06-30T08:00:00.000Z",
      },
    });
    expect(second).toMatchObject({
      added: true,
      project: {
        id: "/Users/void/Documents/study",
        path: "/Users/void/Documents/study",
        displayName: "study",
        addedAt: "2026-06-30T09:00:00.000Z",
      },
    });
    expect(getProjectRegistry().map((project) => project.id)).toEqual([
      "/Users/void/Documents/study",
      "/Users/void/code/opensource/Pig",
    ]);
  });

  it("selects an existing normalized path without creating a duplicate Project", () => {
    addProjectToRegistry("/Users/void/code/opensource/Pig", {
      now: () => "2026-06-30T08:00:00.000Z",
    });
    const duplicate = addProjectToRegistry("/Users/void/code/opensource/Pig/packages/../", {
      now: () => "2026-06-30T10:00:00.000Z",
    });

    expect(duplicate).toMatchObject({
      added: false,
      project: {
        id: "/Users/void/code/opensource/Pig",
        addedAt: "2026-06-30T08:00:00.000Z",
      },
    });
    expect(getProjectRegistry()).toHaveLength(1);
  });

  it("does not require Git metadata when adding a Project", () => {
    addProjectToRegistry("/Users/void/Documents/notes-without-git", {
      now: () => "2026-06-30T08:00:00.000Z",
    });

    expect(getProjectRegistry()[0]).toMatchObject({
      id: "/Users/void/Documents/notes-without-git",
      displayName: "notes-without-git",
    });
  });
});
