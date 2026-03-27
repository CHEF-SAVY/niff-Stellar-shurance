import { z } from "zod";
import { ClaimSchema } from "./vote";

/**
 * Extended ClaimSchema for the Claims Board.
 * Adds optional server-provided fields without modifying the original schema.
 */
export const ClaimBoardSchema = ClaimSchema.extend({
  deadline_timestamp: z.string().optional(), // ISO-8601 server timestamp (Req 3.1)
  quorum_threshold: z.number().optional(), // minimum votes for a valid decision (Req 1.5)
});

export type ClaimBoard = z.infer<typeof ClaimBoardSchema>;
