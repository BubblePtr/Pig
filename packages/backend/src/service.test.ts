import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createBackendService } from "./service";
import { createFakePiRpcTransport } from "@pigui/core/testing";

function fixtureAgentDir() {
  return join(process.cwd(), "fixtures/pi-agent");
}

describe("backend RPC service", () => {
  it("handles query commands through request/response envelopes", async () => {
    const service = createBackendService({
      agentDir: fixtureAgentDir(),
      gitClient: {
        isGitRepository: async () => true,
        addDetachedWorktree: async () => {},
      },
      piRpc: createFakePiRpcTransport(),
    });

    await expect(service.handleRequest({ id: "req-1", method: "list_sessions" })).resolves.toEqual({
      id: "req-1",
      result: expect.arrayContaining([
        expect.objectContaining({
          id: "newest-session",
          project: "gamma",
        }),
      ]),
    });
    await expect(
      service.handleRequest({
        id: "req-2",
        method: "get_session_detail",
        params: { id: "middle-session" },
      }),
    ).resolves.toEqual({
      id: "req-2",
      result: expect.objectContaining({
        id: "middle-session",
        turns: expect.any(Array),
      }),
    });
    await expect(service.handleRequest({ id: "req-3", method: "get_config_inventory" })).resolves.toEqual({
      id: "req-3",
      result: expect.objectContaining({
        defaultModel: "gpt-5-codex",
      }),
    });
  });

  it("routes Runtime Gateway commands and forwards Gateway events through the same service", async () => {
    const piRpc = createFakePiRpcTransport();
    const service = createBackendService({
      agentDir: fixtureAgentDir(),
      piRpc,
    });
    const events: unknown[] = [];

    service.onEvent((event) => {
      events.push(event);
    });

    await expect(
      service.handleRequest({
        id: "req-create",
        method: "create_session",
        params: {
          sessionId: "session-1",
          projectId: "project-1",
          cwd: process.cwd(),
        },
      }),
    ).resolves.toEqual({
      id: "req-create",
      result: expect.objectContaining({
        sessionId: "session-1",
        piSessionId: "pi-session-rpc",
      }),
    });
    await expect(
      service.handleRequest({
        id: "req-send",
        method: "send_prompt",
        params: {
          piSessionId: "pi-session-rpc",
          prompt: "Hello Pi",
        },
      }),
    ).resolves.toEqual({
      id: "req-send",
      result: expect.objectContaining({
        seq: 1,
        sessionId: "session-1",
        piSessionId: "pi-session-rpc",
        type: "message_update",
        payload: expect.objectContaining({
          role: "user",
          body: "Hello Pi",
        }),
      }),
    });

    piRpc.emitEvent({
      type: "message_end",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Hi from Pi" }],
      },
    });

    expect(events).toEqual([
      {
        type: "event",
        event: expect.objectContaining({
          seq: 1,
          sessionId: "session-1",
          piSessionId: "pi-session-rpc",
          type: "message_update",
          payload: expect.objectContaining({
            role: "user",
            body: "Hello Pi",
          }),
        }),
      },
      {
        type: "event",
        event: expect.objectContaining({
          seq: 2,
          sessionId: "session-1",
          piSessionId: "pi-session-rpc",
          type: "message_update",
          payload: expect.objectContaining({
            role: "assistant",
            body: "Hi from Pi",
          }),
        }),
      },
    ]);
  });
});
