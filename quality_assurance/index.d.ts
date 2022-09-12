import { User } from "@prisma/client";
interface UserSeed extends User {
  id: never;
}

interface UserSharedData {
  Auth: {
    Authorization: string;
  };
  AuthenticatedUserId?: number;
}

interface Response {
  status: number;
  body: unknown;
}
