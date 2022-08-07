import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";

export default CreateRouter(
  Prisma.department,
  "department",
  ["name", "institutionId"],
  "245bcaaa8a5250e9a7a337a028c3acf7",
  ["institution" /*, "User"  */] // shows password... not a good idea
);
