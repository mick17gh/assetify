import { z } from "zod";
import { DOCUMENT_TYPE } from "@/constants";
import { enumFromConst } from "./helpers";

export const updateDocumentSchema = z.object({
  id: z.string().cuid(),
  documentType: enumFromConst(DOCUMENT_TYPE),
  displayName: z.string().trim().min(1).max(200),
});

export const deleteDocumentSchema = z.object({
  id: z.string().cuid(),
});
