import { fail } from "../../utils/errors.js";

export class WeatherCache<T> {
  private values = new Map<string, { value: T; until: number }>();
  private pending = new Map<string, Promise<T>>();

  constructor(
    private ttl: number,
    private maximum = 500,
  ) {}

  async get(key: string, load: () => Promise<T>): Promise<T> {
    const saved = this.values.get(key);
    this.values.delete(key);
    if (saved && saved.until > Date.now()) {
      this.values.set(key, saved);
      return saved.value;
    }
    const running = this.pending.get(key);
    if (running) return running;
    if (this.pending.size >= this.maximum)
      fail(503, "Weather is busy. Try again shortly.", "provider_unavailable");
    const request = Promise.resolve()
      .then(load)
      .then((value) => {
        this.values.set(key, { value, until: Date.now() + this.ttl });
        while (this.values.size > this.maximum)
          this.values.delete(this.values.keys().next().value!);
        return value;
      })
      .finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }
}
