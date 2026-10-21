import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  AddressSnapshot,
  PsgcPlace,
  PsgcPart,
  StructuredAddressInput,
} from "@aqours/contracts";
import { fail } from "../../utils/errors.js";

export const datasetVersion = "PSGC-2Q-2026";
const directory = path.resolve(
  import.meta.dirname,
  "../../../../psgc-address-data/data",
);
interface Node {
  psgc_code: string;
  name: string;
  geographic_level: PsgcPart["level"];
  children: Node[];
}
interface Entry {
  place: PsgcPlace;
  ancestry: PsgcPart[];
  children: string[];
}
let entries: Map<string, Entry> | undefined;
let roots: string[] = [];
function catalog() {
  if (entries) return entries;
  const loaded = new Map<string, Entry>();
  const index = JSON.parse(
    readFileSync(path.join(directory, "list-of-all-regions.json"), "utf8"),
  ) as { psgc_code: string; file: string }[];
  function visit(node: Node, parents: PsgcPart[]) {
    if (!/^\d{10}$/.test(node.psgc_code) || loaded.has(node.psgc_code))
      throw new Error("Invalid PSGC catalog");
    const part: PsgcPart = {
      code: node.psgc_code,
      name: node.name,
      level: node.geographic_level,
    };
    const ancestry = [...parents, part];
    loaded.set(part.code, {
      place: { ...part, hasChildren: node.children.length > 0 },
      ancestry,
      children: node.children.map((child) => child.psgc_code),
    });
    node.children.forEach((child) => visit(child, ancestry));
  }
  for (const region of index) {
    const filename = path.resolve(directory, region.file);
    if (!filename.startsWith(directory + path.sep))
      throw new Error("Invalid PSGC index path");
    const data = JSON.parse(readFileSync(filename, "utf8")) as { region: Node };
    if (data.region.psgc_code !== region.psgc_code)
      throw new Error("Invalid PSGC region");
    visit(data.region, []);
  }
  roots = index.map((region) => region.psgc_code);
  entries = loaded;
  return entries;
}
export function regions(): PsgcPlace[] {
  const data = catalog();
  return roots.map((code) => data.get(code)!.place);
}
export function children(parentCode: string): PsgcPlace[] {
  const data = catalog(),
    entry = data.get(parentCode);
  if (!entry) fail(400, "Unknown PSGC parent code");
  return entry.children.map((code) => data.get(code)!.place);
}
export function addressSnapshot(
  input: StructuredAddressInput,
): AddressSnapshot {
  const entry = catalog().get(input.barangayCode);
  if (!entry || entry.place.level !== "barangay")
    fail(400, "Select a valid PSGC barangay");
  return {
    barangayCode: entry.place.code,
    streetDetails: input.streetDetails.trim(),
    datasetVersion,
    ancestry: entry.ancestry.map((part) => ({ ...part })),
  };
}
export function formatAddress(snapshot: AddressSnapshot) {
  return [
    snapshot.streetDetails,
    ...[...snapshot.ancestry].reverse().map((part) => part.name),
    "Philippines",
  ]
    .filter(Boolean)
    .join(", ");
}
/** Canonicalize supplied selections; text-only corrections clear stale structured data. */
export function addressFields(
  input: Record<string, any>,
  previous?: Record<string, any>,
) {
  if (input.structuredAddress) {
    const structuredAddress = addressSnapshot(input.structuredAddress);
    return { address: formatAddress(structuredAddress), structuredAddress };
  }
  return {
    address: input.address ?? previous?.address,
    structuredAddress:
      input.structuredAddress === null ||
      (input.address !== undefined && input.address !== previous?.address)
        ? null
        : (previous?.structuredAddress ?? null),
  };
}
