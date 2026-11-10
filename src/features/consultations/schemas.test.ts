import { describe, expect, it } from "vitest";
import { consultationListQuerySchema, patchConsultationSchema, submitConsultationSchema } from "./schemas";

// protect the public boundary and editor filters from invalid consultation data
describe("consultation schemas", () => {
  // keep one valid request available for targeted schema rejection checks
  const validSubmission = {
    adult_contact_name: "Alex Example",
    email: "ALEX@example.com",
    relationship: "parent_guardian",
    message: "Please share details.",
    data_use_acknowledged: true,
    idempotency_key: "00000000-0000-4000-8000-000000000001",
    website: "",
  };

  it("normalizes a valid adult submission and keeps the honeypot empty", () => {
    expect(submitConsultationSchema.parse(validSubmission)).toMatchObject({
      adult_contact_name: "Alex Example",
      email: "alex@example.com",
      relationship: "parent_guardian",
      data_use_acknowledged: true,
    });
  });

  it("rejects unacknowledged, underage-role, malformed, and bot submissions", () => {
    expect(submitConsultationSchema.safeParse({ ...validSubmission, relationship: "student" }).success).toBe(false);
    expect(submitConsultationSchema.safeParse({ ...validSubmission, data_use_acknowledged: false }).success).toBe(false);
    expect(submitConsultationSchema.safeParse({ ...validSubmission, email: "not-an-email" }).success).toBe(false);
    expect(submitConsultationSchema.safeParse({ ...validSubmission, website: "filled" }).success).toBe(false);
    expect(submitConsultationSchema.safeParse({ ...validSubmission, idempotency_key: "not-a-uuid" }).success).toBe(false);
  });

  it("enforces public field bounds and rejects unexpected private fields", () => {
    expect(submitConsultationSchema.safeParse({ ...validSubmission, adult_contact_name: " " }).success).toBe(false);
    expect(submitConsultationSchema.safeParse({ ...validSubmission, message: "x".repeat(1501) }).success).toBe(false);
    expect(submitConsultationSchema.safeParse({ ...validSubmission, password: "secret" }).success).toBe(false);
  });

  it("bounds editor pagination and validates status transitions", () => {
    expect(consultationListQuerySchema.parse({ page: "2", status: "" })).toEqual({ page: 2 });
    expect(consultationListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(consultationListQuerySchema.safeParse({ status: "unknown" }).success).toBe(false);
    expect(patchConsultationSchema.safeParse({ status: "reviewed" }).success).toBe(true);
    expect(patchConsultationSchema.safeParse({ status: "deleted" }).success).toBe(false);
  });
});
