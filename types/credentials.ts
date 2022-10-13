import { User } from "@prisma/client";

interface UserRegistration extends User {
  confirm_password: string;
}

interface Credentials {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

export { Credentials, UserRegistration };
