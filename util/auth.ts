import { User } from "@prisma/client";
import bcryptjs from "bcryptjs";

const AccessingOwn = (
  data: User,
  user: User,
  operation: "read" | "modify"
): { success: boolean; message: string } => {
  const { username: fetchedUsername } = data;
  const { username: accessor_username } = user;
  return fetchedUsername === accessor_username
    ? { success: true, message: "" }
    : {
        success: false,
        message: `A BASIC_USER can only ${operation} his own data! Try ${
          operation === "read" ? "GET" : "PUT"
        } api/users/${user.id}/`,
      };
};

const STANDARD_ROUNDS = 10;
const StandardHash = async (string: string) => {
  const salt = await bcryptjs.genSalt(STANDARD_ROUNDS);
  const hash = await bcryptjs.hash(string, salt);
  return hash;
};

export { AccessingOwn, StandardHash };
