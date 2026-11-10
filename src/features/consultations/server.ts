export { CONSULTATION_PAGE_SIZE, CONSULTATION_RELATIONSHIPS, CONSULTATION_STATUSES } from "./shared";
export {
  consultationIdSchema,
  consultationListQuerySchema,
  patchConsultationSchema,
  submitConsultationSchema,
} from "./schemas";
export type {
  ConsultationInquiry,
  ConsultationList,
  ConsultationReceipt,
  ConsultationRelationship,
  ConsultationStatus,
  SubmitConsultationInput,
} from "./types";
export {
  deleteConsultationInquiry,
  listConsultationInquiries,
  submitConsultation,
  updateConsultationInquiryStatus,
} from "./service.server";
