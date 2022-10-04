import { JwtPayload } from "jsonwebtoken";

interface Credentials {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

export { Credentials };
