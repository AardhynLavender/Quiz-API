/**
 * @filename validation.ts
 * @author Aardhyn Lavender
 *
 * @description This file contains the validation functions for the application.
 */

/**
 * TODO:  Convert validators to promises.
 *        This will allow them to `reject` with the reason for failing validation.
 */

// REGULAR EXPRESSIONS //

const Regex: Record<string, RegExp> = {
  Email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/, // Based on https://www.w3resource.com/javascript/form/email-validation.php... modified to require second level domain
  Alphanumeric: /^[a-z0-9\s]+$/i,
  ContainsNumber: /.*\d.*/,
  ContainsSpecialCharacter: /.*[^a-zA-Z\d\s].*/,
};

// TYPES //

interface Validator {
  // eslint-disable-next-line no-unused-vars
  Validate: (value: string) => boolean;
}

interface TextFieldValidator extends Validator {
  min: number;
  max: number;
}

// VALIDATORS //

const ValidLength = (value: string, min: number, max: number) =>
  value.length >= min && value.length <= max;

const CreateTextFieldValidator = (
  min: number,
  max: number
): TextFieldValidator => ({
  min,
  max,
  Validate: (value) =>
    !!value && Regex.Alphanumeric.test(value) && ValidLength(value, min, max),
});

const CreatePasswordValidator = (
  min: number,
  max: number
): TextFieldValidator => ({
  min,
  max,
  Validate: (value) =>
    Regex.ContainsNumber.test(value) &&
    Regex.ContainsSpecialCharacter.test(value) &&
    ValidLength(value, min, max),
});

/**
 * Validate a string against an email address
 * @returns true if the value is a valid email address and contains `username`
 */
const CreateEmailValidator = () => ({
  Validate: (email: string, username: string) =>
    !!email &&
    Regex.Email.test(email) &&
    email.toLowerCase().includes(username.toLowerCase()),
});

// API //

export const Validation = {
  first_name: CreateTextFieldValidator(2, 50),
  last_name: CreateTextFieldValidator(2, 50),
  username: CreateTextFieldValidator(5, 10),
  email: CreateEmailValidator(),
  password: CreatePasswordValidator(8, 16),
};

export default Validation;
