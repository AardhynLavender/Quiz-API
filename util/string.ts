const CreateFakePassword = (min: number, max: number) =>
  "*".repeat(Math.floor(Math.random() * (max - min + 1) + min));

const ToSentenceCase = (string: string) =>
  `${string.charAt(0).toUpperCase()}${string.slice(1).toLowerCase()}`;

export { CreateFakePassword, ToSentenceCase };
