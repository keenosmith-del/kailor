export type Account = {
  email: string;
  role: "admin" | "member";
  name?: string | null;
};
