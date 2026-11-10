import type { ZodType } from "zod";
import { HttpError } from "./error";

// translate schema failures into the same field error contract used by every content mutation
export function parseInput<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
    throw new HttpError(422, "VALIDATION_ERROR", "Please check the submitted fields.", fields);
  }
  return parsed.data;
}
