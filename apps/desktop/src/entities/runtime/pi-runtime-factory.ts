import type { PiRpcTransport, PiRuntimeBridge } from "@/entities/runtime/pi-runtime-bridge";
import { createPiRpcRuntimeBridge } from "@/entities/runtime/pi-rpc-runtime-bridge";
import { createPiRuntimeGatewayBridge } from "@/entities/runtime/gateway-runtime-bridge";
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
    return createPiRuntimeGatewayBridge({
      now: options.now,
    });
  }

  return createPiRpcRuntimeBridge({
    transport: options.transport,
    now: options.now,
  });
}
