import { fail } from "../../utils/errors.js";

export async function weatherJson(url: URL): Promise<unknown> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Weather provider unavailable");
    return await response.json();
  } catch {
    fail(
      503,
      "Weather is temporarily unavailable. Try again shortly.",
      "provider_unavailable",
    );
  }
}
