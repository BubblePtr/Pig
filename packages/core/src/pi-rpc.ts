// Pi RPC protocol — the transport contract spoken on both ends of the seam:
// the utilityProcess backend drives `pi`, the renderer transport relays it.

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
