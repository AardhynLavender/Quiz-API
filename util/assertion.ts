import { Pluralize, ToSentenceCase } from "./string";

export const Regex: Record<string, RegExp> = {
  Email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/, // Based on https://www.w3resource.com/javascript/form/email-validation.php... modified to require second level domain
  Alphanumeric: /^[a-zA-Z0-9 ]*$/,
  ContainsNumber: /.*\d.*/,
  ContainsSpecialCharacter: /.*[^a-zA-Z\d\s].*/,
};

// eslint-disable-next-line no-unused-vars
type Assertion = (value: string) => void;

const AssertEquality = (field: string, value: string, confirmValue: string) => {
  if (value !== confirmValue)
    throw `${Pluralize(ToSentenceCase(field))} must be the same`;
};

const AssertLength = (
  value: string,
  field: string,
  min: number,
  max: number
) => {
  if (value.length < min)
    throw `${field} must be longer than ${min} ${Pluralize("character", min)}`;
  if (value.length > max)
    throw `${field} must be shorter than ${max} ${Pluralize("character", max)}`;
};

const AssertDefined = (value: string, field: string) => {
  if (!value || !value.length) throw `${field} must not be empty`;
};

const CreateTextFieldAssertion =
  (field: string, min: number, max: number): Assertion =>
  (value) => {
    AssertDefined(value, field);
    AssertLength(value, field, min, max);
  };

const CreatePasswordAssertion =
  (min: number, max: number): Assertion =>
  (value) => {
    AssertDefined(value, "Password");
    AssertLength(value, "Password", min, max);
    if (!Regex.ContainsNumber.test(value))
      throw "Password must contain a number";
    if (!Regex.ContainsSpecialCharacter.test(value))
      throw "Password must contain a special character";
  };

const CreatePasswordConfirmationAssertion =
  () => (password: string, confirmation: string) => {
    AssertDefined(confirmation, "Confirm Password");
    AssertEquality("password", password, confirmation);
  };

const CreateEmailAssertion = () => (email: string, username: string) => {
  AssertDefined(email, "Email");
  if (!Regex.Email.test(email)) throw "Email must be a valid email address";
  if (!email.toLowerCase().includes(username.toLowerCase()))
    throw "email must contain the username";
};

export const AssertValid = {
  FirstName: CreateTextFieldAssertion("First Name", 2, 50),
  LastName: CreateTextFieldAssertion("Last Name", 2, 50),
  Username: CreateTextFieldAssertion("Username", 5, 10),
  Email: CreateEmailAssertion(),
  Password: CreatePasswordAssertion(8, 16),
  PasswordConfirmation: CreatePasswordConfirmationAssertion(),
};

export default AssertValid;
export { AssertEquality };
