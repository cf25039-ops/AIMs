import { z } from "zod";

export const assetTransferSchema = z.object({
  assetId: z.string().min(1, "Asset selection is required"),
  toDepartmentId: z.string().min(1, "Destination department is required"),
  toPic: z.string().min(3, "New PIC name must be at least 3 characters"),
  transferReason: z.string().min(10, "Please provide a valid reason (min 10 characters)"),
});

export type AssetTransferValues = z.infer<typeof assetTransferSchema>;
