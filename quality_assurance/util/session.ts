const TOKEN = "token";

export const Session: Record<string, string | number | object> = {};

export const StoreToken = (token: string) => {
  Session[TOKEN] = token;
};

export const RetrieveToken = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const token = Session[TOKEN];
    if (token && typeof token === "string") resolve(token);
    else reject(new Error("Unable to retrieve token"));
  });
