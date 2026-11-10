import { z } from "zod";
import { CONSULTATION_RELATIONSHIPS, CONSULTATION_STATUSES } from "./shared";

// validate bounded adult contact fields before accepting public submissions
export const submitConsultationSchema = z.object({
  adult_contact_name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  relationship: z.enum(CONSULTATION_RELATIONSHIPS),
  message: z.string().trim().max(1500).optional(),
  data_use_acknowledged: z.literal(true),
  idempotency_key: z.uuid(),
  website: z.string().max(0).optional().default(""),
}).strict();

// bound inbox filters so editor queries stay predictable and private
export const consultationListQuerySchema = z.object({
  status: z.preprocess((value) => value === "" ? undefined : value, z.enum(CONSULTATION_STATUSES).optional()),
  page: z.coerce.number().int().min(1).max(99_999).default(1),
}).strict();

// accept only a deliberate status transition from an authorized editor
export const patchConsultationSchema = z.object({
  status: z.enum(CONSULTATION_STATUSES),
}).strict();

// validate record identities before issuing a private inbox mutation
export const consultationIdSchema = z.uuid();
