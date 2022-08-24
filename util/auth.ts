import { User } from "@prisma/client";

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

export default AccessingOwn;
