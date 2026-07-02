import type { PiRpcTransport, PiRuntimeBridge } from "@/entities/runtime/pi-runtime-bridge";
import { createPiRpcRuntimeBridge } from "@/entities/runtime/pi-rpc-runtime-bridge";
import { createRuntimeGatewayClient } from "@/entities/runtime/runtime-gateway-client";
import { createInMemoryPiRuntimeBridge } from "@/entities/runtime/in-memory-pi-runtime-bridge";
import { isElectronRuntime } from "@/shared/runtime";

export type DefaultPiRuntimeBridgeOptions = {
  transport?: PiRpcTransport;
  now?: () => string;
};

export function createDefaultPiRuntimeBridge(
  options: DefaultPiRuntimeBridgeOptions = {},
): PiRuntimeBridge {
  if (!options.transport && !isElectronRuntime()) {
    return createInMemoryPiRuntimeBridge({
      now: options.now,
    });
  }

  if (!options.transport) {
    return createRuntimeGatewayClient({
      now: options.now,
    });
  }

  return createPiRpcRuntimeBridge({
    transport: options.transport,
    now: options.now,
  });
}
