import { JwtPayload } from "jsonwebtoken";

interface Credentials {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

interface User extends JwtPayload {
  id: string;
  name: string;
}

export { Credentials, User };
