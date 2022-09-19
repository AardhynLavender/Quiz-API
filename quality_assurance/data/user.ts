import { Role } from "@prisma/client";
import { UserSeed } from "quality_assurance";
import CreateProfilePictureURI, { HashString } from "./../../util/profile";

export const UnregisteredUser = {
  email: "gOrr@op.ac.nz",
  username: "gOrr",
  first_name: "Grayson",
  last_name: "Orr",
  password: "p@ssw0rd",
  role: Role.ADMIN_USER,
} as UserSeed;

export const SuperUser = {
  email: "jsalmon@gmail.com",
  username: "jsalmon",
  first_name: "Jeffany",
  last_name: "Salmon",
  password: "1mag!ne",
  profile_picture_uri: CreateProfilePictureURI(HashString("imagine")),
  role: Role.SUPER_USER,
} as UserSeed;

export const AdminUser = {
  email: "jsiracusa@gmail.com",
  username: "jSiracusa",
  first_name: "John",
  last_name: "Siracusa",
  password: "d!dntD0AnyResearch",
  profile_picture_uri: CreateProfilePictureURI(HashString("ATP")),
  role: Role.ADMIN_USER,
} as UserSeed;

const first_name = "Merlin";
const email = "mmann@gmail.com";
const hash = HashString(first_name + email);
const profile_picture_uri = CreateProfilePictureURI(hash);
const password = "always2th!ngs";
export const BasicUser = {
  email,
  first_name,
  profile_picture_uri,
  password,
  confirm_password: password,
  username: "mmann",
  last_name: "Mann",
  role: Role.BASIC_USER,
};

export const UnauthenticatedUser = {
  ...BasicUser,
  password: "wrong_password",
};
