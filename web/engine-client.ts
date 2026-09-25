import type {
  Constants,
  Effort,
  EffortReport,
  FallReport,
  Found,
  Location,
  Mode,
  Page,
  Request,
  SearchReport,
  TimeReport,
} from "./types";

// One worker for the page. The Go engine loads inside it on the first request.
export class Engine {
  private worker = new Worker(new URL("./engine.worker.ts", import.meta.url));
  private next = 0;
  private pending = new Map<
    number,
    { resolve: (value: any) => void; reject: (reason: Error) => void }
  >();
  private failed: Error | undefined;

  constructor() {
    this.worker.onmessage = ({ data }) => {
      const task = this.pending.get(data.id);
      if (!task) return;
      this.pending.delete(data.id);
      if (data.error) task.reject(new Error(data.error));
      else task.resolve(data.result);
    };
    this.worker.onerror = () => {
      this.failed = new Error(
        "The Library's engine could not start. Try reloading the page.",
      );
      for (const task of this.pending.values()) task.reject(this.failed);
      this.pending.clear();
    };
  }

  private request<T>(request: Request): Promise<T> {
    if (this.failed) return Promise.reject(this.failed);
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({
        id,
        request,
        base: new URL(import.meta.env.BASE_URL, location.href).href,
      });
    });
  }

  constants = () => this.request<Constants>({ action: "constants" });
  page = (location?: Location) =>
    this.request<Page>({ action: "page", location });
  locate = (text: string, mode: Mode) =>
    this.request<Found>({ action: "locate", text, mode });
  reckon = (effort: Effort) =>
    this.request<EffortReport>({ action: "reckon", effort });
  search = (examined: number) =>
    this.request<SearchReport>({ action: "search", examined });
  fall = (deaths: number) =>
    this.request<FallReport>({ action: "fall", deaths });
  time = (seconds: number) =>
    this.request<TimeReport>({ action: "time", seconds });
}
