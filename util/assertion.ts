/**
 * @filename assertion.ts
 * @author Aardhyn Lavender
 *
 * @description This file contains generic textural asserts for the application.
 */

const Regex: Record<string, RegExp> = {
  Email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/, // Based on https://www.w3resource.com/javascript/form/email-validation.php... modified to require second level domain
  Alphanumeric: /^[a-z0-9\s]+$/i,
  ContainsNumber: /.*\d.*/,
  ContainsSpecialCharacter: /.*[^a-zA-Z\d\s].*/,
};

// eslint-disable-next-line no-unused-vars
type Assertion = (value: string) => void;

const AssertEquality = (field: string, value: string, confirmValue: string) => {
  if (value !== confirmValue) throw `${field}s must be the same`;
};

const AssertLength = (
  value: string,
  field: string,
  min: number,
  max: number
) => {
  if (value.length < min)
    throw `${field} must be longer than ${min} characters`;
  if (value.length > max)
    throw `${field} must be shorter than ${max} characters`;
};

const CreateTextFieldAssertion =
  (field: string, min: number, max: number): Assertion =>
  (value) => {
    if (!value || !value.length) throw `${field} must not be empty`;
    AssertLength(value, field, min, max);
  };

const CreatePasswordAssertion =
  (min: number, max: number): Assertion =>
  (value) => {
    AssertLength(value, "Password", min, max);
    if (!Regex.ContainsNumber.test(value))
      throw "password must contain a number";
    if (!Regex.ContainsSpecialCharacter.test(value))
      throw "password must contain a special character";
  };

const CreateEmailAssertion = () => (email: string, username: string) => {
  if (!email || !email.length) throw "email must not be empty";
  if (!Regex.Email.test(email)) throw "email must be a valid email address";
  if (!email.toLowerCase().includes(username.toLowerCase()))
    throw "email must contain the username";
};

// API //

export const AssertValid = {
  FirstName: CreateTextFieldAssertion("First Name", 2, 50),
  LastName: CreateTextFieldAssertion("Last Name", 2, 50),
  Username: CreateTextFieldAssertion("Username", 5, 10),
  Email: CreateEmailAssertion(),
  Password: CreatePasswordAssertion(8, 16),
};

export default AssertValid;
export { AssertEquality };
