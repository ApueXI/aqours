import { z } from "zod";
import { kind, text } from "../common.js";

export function publishGuidanceSettingsInput(body: unknown, settings: string) {
  return settings === "guidance"
    ? z.object({ kind, text, source: text }).strict().parse(body)
    : z
        .object({ contactText: text, inspectionText: text, waterText: text })
        .strict()
        .parse(body);
}
