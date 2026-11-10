import type { CONSULTATION_RELATIONSHIPS, CONSULTATION_STATUSES } from "./shared";

// describe adult contact roles accepted for an inquiry
export type ConsultationRelationship = (typeof CONSULTATION_RELATIONSHIPS)[number];

// share the inbox workflow states across editor-facing contracts
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

// carry only the validated public fields needed for a private request
export type SubmitConsultationInput = {
  adult_contact_name: string;
  email: string;
  relationship: ConsultationRelationship;
  message?: string;
  data_use_acknowledged: true;
  idempotency_key: string;
};

// keep the public receipt opaque and free of submitted private details
export type ConsultationReceipt = { receipt_id: string };

// expose the persisted minimal inquiry fields to authorized editors
export type ConsultationInquiry = {
  id: string;
  adult_contact_name: string;
  email: string;
  relationship: ConsultationRelationship;
  message: string | null;
  data_use_acknowledged: boolean;
  status: ConsultationStatus;
  created_at: string;
  updated_at: string;
};

// define the stable pagination envelope for the private inbox
export type ConsultationList = {
  items: ConsultationInquiry[];
  total: number;
  page: number;
  pageSize: number;
};
