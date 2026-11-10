// carry safe status and field details from trusted application validation to routes
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  // preserve a stable json error contract across api adapters
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
