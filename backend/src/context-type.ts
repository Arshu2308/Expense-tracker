export interface UserPayload {
  id: number;
  email: string;
}

export interface Context {
  user: UserPayload | null;
}
