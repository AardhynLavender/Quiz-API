import CreateProfilePictureURI, { HashString } from "./../../util/profile";

export const UnregisteredUser = {
  email: "gOrr@op.ac.nz",
  username: "gOrr",
  first_name: "Grayson",
  last_name: "Orr",
  password: "p@ssw0rd",
  role: "ADMIN_USER",
};

export const SuperAdmin = {
  email: "jsalmon@gmail.com",
  username: "jsalmon",
  first_name: "Jeffany",
  last_name: "Salmon",
  password: "1mag!ne",
  role: "SUPER_USER",
};

export const UnauthenticatedUser = {
  ...SuperAdmin,
  password: "wrong_password",
};

export const AdminUser = {};

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
  role: "BASIC_USER",
};
