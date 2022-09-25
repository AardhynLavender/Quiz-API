const AuthHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
export default AuthHeader;
