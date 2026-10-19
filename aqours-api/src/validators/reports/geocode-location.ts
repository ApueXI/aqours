import { z } from "zod";
import { text } from "../common.js";
export const geocodeInput = z.object({ address: text }).strict();
