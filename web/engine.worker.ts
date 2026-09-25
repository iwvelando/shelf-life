/// <reference lib="webworker" />
import type { Request } from "./types";
declare const Go: new () => {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
};
declare const shelfLife: (json: string) => string;

let ready: Promise<void> | undefined;
async function init(base: string) {
  // Classic worker keeps Go's runtime unmodified and works on ordinary static hosts.
  importScripts(`${base}wasm_exec.js`);
  const go = new Go();
  const response = await fetch(`${base}engine.wasm`);
  if (!response.ok)
    throw new Error(`The engine failed to download (${response.status})`);
  const { instance } = await WebAssembly.instantiate(
    await response.arrayBuffer(),
    go.importObject,
  );
  void go.run(instance);
}

self.onmessage = async ({
  data,
}: MessageEvent<{ id: number; request: Request; base: string }>) => {
  try {
    await (ready ??= init(data.base).catch((error) => {
      ready = undefined;
      throw error;
    }));
    const result = JSON.parse(shelfLife(JSON.stringify(data.request)));
    self.postMessage(
      "error" in result
        ? { id: data.id, error: result.error }
        : { id: data.id, result },
    );
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
