import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type TauriConfig = {
  build?: {
    devUrl?: string;
  };
};

type TauriCapability = {
  remote?: {
    urls?: string[];
  };
  permissions?: string[];
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), path), "utf8")) as T;
}

describe("Tauri capabilities", () => {
  it("allows the dev server origin to access Tauri APIs", () => {
    const tauriConfig = readJson<TauriConfig>("src-tauri/tauri.conf.json");
    const mainCapability = readJson<TauriCapability>(
      "src-tauri/capabilities/default.json",
    );
    const devUrl = tauriConfig.build?.devUrl;

    expect(devUrl).toBe("http://127.0.0.1:1420");
    expect(mainCapability.remote?.urls ?? []).toContain(devUrl);
  });

  it("allows the app to subscribe to runtime events from Tauri", () => {
    const mainCapability = readJson<TauriCapability>(
      "src-tauri/capabilities/default.json",
    );

    expect(mainCapability.permissions ?? []).toEqual(
      expect.arrayContaining([
        "core:event:allow-listen",
        "core:event:allow-unlisten",
      ]),
    );
  });
});
