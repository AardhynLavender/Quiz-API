// import { Router } from "express"
import Prisma from "../../util/prismaConfig";
import CreateRouter from "./generic";

export default CreateRouter(
  Prisma.institution,
  "institution",
  ["name", "region", "country"],
  "aa3bbab1553308b5a205f355b0b3fc53"
  // ["User"] // shows password... not a good idea
);
