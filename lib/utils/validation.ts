/**
 * Zod schemas for validation
 */

import { z } from "zod";

// Base examples - will be expanded later
export const intervalSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export type IntervalInput = z.infer<typeof intervalSchema>;
