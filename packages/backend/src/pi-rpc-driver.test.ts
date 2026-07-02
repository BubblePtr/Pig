import { describe, expect, it } from "vitest";
import { createFakePiRpcTransport } from "@pigui/core/testing";
import { createPiRpcProcessDriver } from "./pi-rpc-driver";

describe("Pi RPC process driver", () => {
  it("adapts Pi RPC transport commands and raw events to Runtime Gateway driver events", async () => {
    const transport = createFakePiRpcTransport({
      sessionId: "pi-session-rpc",
      model: {
        provider: "openai",
        id: "gpt-5-codex",
      },
      now: () => "2026-06-29T12:00:00.000Z",
    });
    const driver = createPiRpcProcessDriver({
      transport,
      now: () => "2026-06-29T12:00:00.000Z",
    });
    const observedEvents: unknown[] = [];

    driver.onEvent((event) => observedEvents.push(event));

    const snapshot = await driver.createSession({
      sessionId: "app-session-1",
      projectId: "pig",
      cwd: "/Users/void/code/opensource/Pig",
    });
    const accepted = await driver.sendPrompt({
      piSessionId: snapshot.piSessionId,
      prompt: "Create a Runtime Gateway session.",
    });

    transport.emitEvent({
      type: "message_end",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Gateway session is ready." }],
        timestamp: 1_782_539_201_000,
      },
    });
    transport.emitEvent({
      type: "tool_execution_start",
      toolCallId: "tool-read-1",
      toolName: "read",
      args: { path: "README.md" },
    });

    expect(transport.startCalls).toEqual([
      {
        command: "pi",
        args: ["--mode", "rpc", "--session-id", "app-session-1"],
        cwd: "/Users/void/code/opensource/Pig",
      },
    ]);
    expect(transport.commands).toEqual([
      expect.objectContaining({ type: "get_state" }),
      expect.objectContaining({
        type: "prompt",
        message: "Create a Runtime Gateway session.",
      }),
    ]);
    expect(snapshot).toMatchObject({
      sessionId: "app-session-1",
      runtimeId: "pi-rpc:app-session-1",
      piSessionId: "pi-session-rpc",
      projectId: "pig",
      status: "idle",
      summary: {
        provider: "openai",
        model: "gpt-5-codex",
      },
    });
    expect(accepted).toMatchObject({
      piSessionId: "pi-session-rpc",
      type: "message_update",
      payload: {
        kind: "message",
        role: "user",
        body: "Create a Runtime Gateway session.",
      },
    });
    expect(observedEvents).toEqual([
      expect.objectContaining({
        piSessionId: "pi-session-rpc",
        type: "message_update",
        payload: expect.objectContaining({
          kind: "message",
          role: "assistant",
          body: "Gateway session is ready.",
        }),
      }),
      expect.objectContaining({
        piSessionId: "pi-session-rpc",
        type: "tool_execution_update",
        payload: expect.objectContaining({
          kind: "tool-call",
          title: "read",
          body: "{\"path\":\"README.md\"}",
        }),
      }),
    ]);
  });

  it("drops raw RPC user message lifecycle events so the prompt is projected once", async () => {
    const transport = createFakePiRpcTransport({
      sessionId: "pi-session-rpc",
      now: () => "2026-07-01T08:00:00.000Z",
    });
    const driver = createPiRpcProcessDriver({
      transport,
      now: () => "2026-07-01T08:00:00.000Z",
    });
    const observedEvents: unknown[] = [];

    driver.onEvent((event) => observedEvents.push(event));

    const snapshot = await driver.createSession({
      sessionId: "app-session-1",
      projectId: "pig",
      cwd: "/Users/void/code/opensource/Pig",
    });
    const accepted = await driver.sendPrompt({
      piSessionId: snapshot.piSessionId,
      prompt: "Why is the prompt duplicated?",
    });

    for (const type of ["message_start", "message_end"] as const) {
      transport.emitEvent({
        type,
        message: {
          role: "user",
          content: [{ type: "text", text: "Why is the prompt duplicated?" }],
          timestamp: 1_783_564_800_000,
        },
      });
    }

    expect(accepted).toMatchObject({
      type: "message_update",
      payload: {
        kind: "message",
        role: "user",
        body: "Why is the prompt duplicated?",
      },
    });
    expect(observedEvents).toEqual([]);
  });
});
