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
  first_name: "jeffany",
  last_name: "salmon",
  password: "1mag!ne",
  role: "SUPER_USER",
};

export const UnauthenticatedUser = {
  ...SuperAdmin,
  password: "wrong_password",
};

export const AdminUser = {};

export const BasicUser = {};
