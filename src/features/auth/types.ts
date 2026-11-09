// share only the safe email and validation feedback needed by the invited login form
export type LoginActionState = {
  email: string;
  message: string | null;
  messageKind: "error" | "notice" | null;
  fieldErrors: {
    email?: string;
    password?: string;
  };
};
