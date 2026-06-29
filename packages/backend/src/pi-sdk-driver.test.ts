import { describe, expect, it, vi } from "vitest";
import {
  PiSdkDriverUnsupportedError,
  createPiSdkDriver,
  type PiSdkRuntimeEvent,
  type PiSdkSessionRuntime,
} from "./pi-sdk-driver";

describe("Pi SDK driver", () => {
  it("constructs without a real SDK runtime and reports unsupported setup errors", async () => {
    const driver = createPiSdkDriver();

    await expect(
      driver.createSession({
        sessionId: "session-1",
        projectId: "pig",
        cwd: "/Users/void/code/opensource/Pig",
      }),
    ).rejects.toMatchObject({
      name: "PiSdkDriverUnsupportedError",
      capability: "create_session",
    });
  });

  it("adapts an injected SDK runtime to the Pi Runtime Driver contract", async () => {
    const sdkEventListeners: Array<(event: PiSdkRuntimeEvent) => void> = [];
    const sendPrompt = vi.fn(async () => {});
    const stopRun = vi.fn(async () => {});
    const runtime: PiSdkSessionRuntime = {
      piSessionId: "pi-sdk-session-1",
      runtimeId: "pi-sdk:session-1",
      status: "idle",
      summary: {
        provider: "openai",
        model: "gpt-5-codex",
        totalTokens: 0,
        totalCostUsd: 0,
      },
      sendPrompt,
      stopRun,
      async getSnapshot() {
        return {
          status: "completed",
          summary: {
            provider: "openai",
            model: "gpt-5-codex",
            totalTokens: 42,
            totalCostUsd: 0.001,
          },
        };
      },
      onEvent(listener) {
        sdkEventListeners.push(listener);

        return () => {};
      },
    };
    const driver = createPiSdkDriver({
      now: () => "2026-06-29T12:00:00.000Z",
      runtimeFactory: vi.fn(async () => runtime),
    });
    const events: unknown[] = [];

    driver.onEvent((event) => {
      events.push(event);
    });

    await expect(
      driver.createSession({
        sessionId: "session-1",
        projectId: "pig",
        cwd: "/Users/void/code/opensource/Pig",
      }),
    ).resolves.toEqual({
      sessionId: "session-1",
      runtimeId: "pi-sdk:session-1",
      piSessionId: "pi-sdk-session-1",
      projectId: "pig",
      cwd: "/Users/void/code/opensource/Pig",
      status: "idle",
      events: [],
      summary: {
        provider: "openai",
        model: "gpt-5-codex",
        totalTokens: 0,
        totalCostUsd: 0,
      },
      updatedAt: "2026-06-29T12:00:00.000Z",
    });
    await expect(
      driver.sendPrompt({
        piSessionId: "pi-sdk-session-1",
        prompt: "Build through SDK",
      }),
    ).resolves.toMatchObject({
      piSessionId: "pi-sdk-session-1",
      type: "message_update",
      payload: {
        kind: "message",
        role: "user",
        body: "Build through SDK",
      },
    });

    sdkEventListeners[0]?.({
      piSessionId: "pi-sdk-session-1",
      turnId: "turn-1",
      type: "message_update",
      payload: {
        kind: "message",
        role: "assistant",
        body: "SDK runtime event",
      },
    });

    await expect(driver.stopRun({ piSessionId: "pi-sdk-session-1" })).resolves.toMatchObject({
      piSessionId: "pi-sdk-session-1",
      type: "status",
      payload: {
        kind: "status",
        title: "Stopped",
      },
    });
    await expect(driver.getSnapshot("pi-sdk-session-1")).resolves.toMatchObject({
      status: "completed",
      summary: {
        totalTokens: 42,
        totalCostUsd: 0.001,
      },
    });
    expect(sendPrompt).toHaveBeenCalledWith("Build through SDK");
    expect(stopRun).toHaveBeenCalled();
    expect(events).toEqual([
      {
        piSessionId: "pi-sdk-session-1",
        turnId: "turn-1",
        type: "message_update",
        payload: {
          kind: "message",
          role: "assistant",
          body: "SDK runtime event",
        },
      },
    ]);
  });

  it("returns attributable unsupported errors for SDK capabilities that are not wired yet", async () => {
    const driver = createPiSdkDriver({
      runtimeFactory: async () => ({
        piSessionId: "pi-sdk-session-1",
        sendPrompt: async () => {},
      }),
    });

    await driver.createSession({
      sessionId: "session-1",
      projectId: "pig",
      cwd: "/Users/void/code/opensource/Pig",
    });

    await expect(
      driver.queueFollowUp({
        piSessionId: "pi-sdk-session-1",
        message: "Queue through SDK",
      }),
    ).rejects.toBeInstanceOf(PiSdkDriverUnsupportedError);
  });
});
