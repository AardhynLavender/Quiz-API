import { User } from "@prisma/client";
import bcryptjs from "bcryptjs";

/**
 * determine if the user is accessing their own data
 * @param data the data fetched
 * @param user the user who made the request
 * @returns an indication of whether the user is authorized to access the data
 */
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
