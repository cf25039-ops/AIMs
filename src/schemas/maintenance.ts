import { z } from "zod";

export const ticketFormSchema = z.object({
  assetId: z.string().min(1, "Asset selection is required"),
  issueTitle: z.string().min(5, "Title must be at least 5 characters"),
  issueDescription: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["critical", "high", "medium", "low"]),
  attachmentUrl: z.string().optional(),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;
