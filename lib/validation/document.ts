import { z } from "zod";
import { DOCUMENT_TYPE } from "@/constants";
import { enumFromConst } from "./helpers";

export const updateDocumentSchema = z.object({
  id: z.string().cuid(),
  documentType: enumFromConst(DOCUMENT_TYPE),
});

export const deleteDocumentSchema = z.object({
  id: z.string().cuid(),
});
