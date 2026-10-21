import { structuredAddress } from "../structured-address.js";
import { z } from "zod";
import { text } from "../common.js";
export const geocodeInput = z
  .object({ address: text, structuredAddress })
  .strict();
