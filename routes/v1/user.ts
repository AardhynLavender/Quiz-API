import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";

export default CreateRouter(
  Prisma.user,
  "User",
  [
    "id",
    "first_name",
    "last_name",
    "username",
    "email",
    "password",
    "profile_picture_uri",
    "role",
  ]
  // [],
  // "271fbf9f9d9ecd5bba6da1234eff1f79"
);
