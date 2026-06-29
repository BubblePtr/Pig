// Pi RPC protocol — the legacy low-level process contract. Runtime Gateway is
// the product-facing API; backend drivers may still use these types internally.

export type PiRpcCommand = {
  id?: string;
  type: string;
  [key: string]: unknown;
};

export type PiRpcResponse = {
  id?: string;
  type: "response";
  command: string;
  success: boolean;
  data?: unknown;
  error?: string;
};

export type PiRpcRawEvent = {
  type: string;
  [key: string]: unknown;
};

export type PiRpcTransportStartInput = {
  command: "pi";
  args: string[];
  cwd: string;
};

export type PiRpcTransport = {
  start(input: PiRpcTransportStartInput): Promise<void>;
  send(command: PiRpcCommand): Promise<PiRpcResponse>;
  onEvent(listener: (event: PiRpcRawEvent) => void): () => void;
  stop?(): Promise<void>;
};
