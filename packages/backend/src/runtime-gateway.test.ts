import { describe, expect, it } from "vitest";
import { createRuntimeGatewayService, type PiRuntimeDriver } from "./runtime-gateway";

function createFakeRuntimeDriver(): PiRuntimeDriver {
  return {
    async createSession(input) {
      return {
        sessionId: input.sessionId,
        runtimeId: `runtime:${input.sessionId}`,
        piSessionId: "pi-session-1",
        projectId: input.projectId,
        cwd: input.cwd,
        status: "idle",
        events: [],
        summary: {
          provider: "openai",
          model: "gpt-5-codex",
          totalTokens: 0,
          totalCostUsd: 0,
        },
        updatedAt: "2026-06-29T12:00:00.000Z",
      };
    },
    async sendPrompt(input) {
      return {
        piSessionId: input.piSessionId,
        type: "message_update",
        payload: {
          kind: "message",
          role: "user",
          body: input.prompt,
        },
      };
    },
    async queueFollowUp(input) {
      return {
        id: "queued-1",
        piSessionId: input.piSessionId,
        body: input.message,
        status: "pending",
        createdAt: "2026-06-29T12:00:00.000Z",
      };
    },
    async withdrawQueuedMessage(input) {
      return {
        id: input.queuedMessageId,
        piSessionId: input.piSessionId,
        body: "queued",
        status: "withdrawn",
        createdAt: "2026-06-29T12:00:00.000Z",
        withdrawnAt: "2026-06-29T12:00:00.000Z",
      };
    },
    async steerRun(input) {
      return {
        piSessionId: input.piSessionId,
        type: "control",
        payload: {
          kind: "control",
          role: "user",
          title: "Steer",
          body: input.message,
        },
      };
    },
    async stopRun(input) {
      return {
        piSessionId: input.piSessionId,
        type: "status",
        payload: {
          kind: "status",
          title: "Stopped",
          body: "Pi stopped the active run.",
        },
      };
    },
    async getSnapshot(piSessionId) {
      return {
        sessionId: "app-session-1",
        runtimeId: "runtime:app-session-1",
        piSessionId,
        projectId: "pig",
        cwd: "/repo",
        status: "idle",
        events: [],
        updatedAt: "2026-06-29T12:00:00.000Z",
      };
    },
    onEvent() {
      return () => {};
    },
  };
}

describe("Runtime Gateway service", () => {
  it("dispatches PiGUI runtime methods and emits product event envelopes", async () => {
    const service = createRuntimeGatewayService({
      driver: createFakeRuntimeDriver(),
      now: () => "2026-06-29T12:00:00.000Z",
      idFactory: () => "evt-fixed",
    });
    const events: unknown[] = [];

    service.onEvent((event) => events.push(event));

    await expect(
      service.handleRequest({
        id: "req-create",
        method: "create_session",
        params: {
          sessionId: "app-session-1",
          projectId: "pig",
          cwd: "/repo",
        },
      }),
    ).resolves.toEqual({
      id: "req-create",
      result: expect.objectContaining({
        runtimeId: "runtime:app-session-1",
        piSessionId: "pi-session-1",
      }),
    });

    await expect(
      service.handleRequest({
        id: "req-prompt",
        method: "send_prompt",
        params: {
          piSessionId: "pi-session-1",
          prompt: "Build the gateway.",
        },
      }),
    ).resolves.toEqual({
      id: "req-prompt",
      result: expect.objectContaining({
        seq: 1,
        sessionId: "app-session-1",
        piSessionId: "pi-session-1",
        type: "message_update",
      }),
    });

    expect(events).toEqual([
      {
        type: "event",
        event: expect.objectContaining({
          id: "evt-fixed",
          seq: 1,
          sessionId: "app-session-1",
          piSessionId: "pi-session-1",
          type: "message_update",
          payload: expect.objectContaining({
            body: "Build the gateway.",
          }),
        }),
      },
    ]);
  });
});
