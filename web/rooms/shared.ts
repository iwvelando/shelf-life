import type { Engine } from "../engine-client";
import type { Stay } from "../useStay";
import type { Constants } from "../types";

export type RoomProps = {
  engine: Engine;
  ready: boolean;
  constants: Constants;
  stay: Stay;
  add: (more: Partial<Pick<Stay, "examined" | "deaths" | "seconds">>) => Stay;
};

export const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
