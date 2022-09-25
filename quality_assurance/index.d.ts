import { User } from "@prisma/client";
interface UserSeed extends User {
  id: never;
}

interface SharedData {
  Auth: {
    Authorization: string;
  };
}

interface UserSharedData extends SharedData {
  AuthenticatedUserId?: number;
  UnauthenticatedUserId?: number;
  BasicUserId?: number | null;
  AdminUserId?: number | null;
  SuperUserId?: number | null;
}

interface Response {
  status: number;
  body: any;
}
