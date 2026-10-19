import type { Envelope } from '@aqours/contracts';

export type PageFetcher = <T>(path: string) => Promise<Envelope<T>>;

export async function fetchAllPages<T>(fetch: PageFetcher, path: string): Promise<Envelope<T[]>> {
  const values: T[] = [];
  let offset = 0;
  let asOf: string | undefined;
  for (;;) {
    const separator = path.includes('?') ? '&' : '?';
    const response = await fetch<T[]>(`${path}${separator}limit=100&offset=${offset}`);
    if (!Array.isArray(response.data)) throw new Error('The list response could not be verified. Refresh to try again.');
    values.push(...response.data);
    asOf = response.asOf ?? asOf;
    const page = response.page;
    if (!page || offset + response.data.length >= page.total) {
      return { data: values, page: { offset: 0, limit: values.length, total: values.length }, asOf };
    }
    if (page.offset !== offset || response.data.length === 0) {
      throw new Error('The list changed while loading. Refresh before using incomplete information.');
    }
    offset += response.data.length;
  }
}
