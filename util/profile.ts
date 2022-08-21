const CreateProfilePictureURI = (hash: number) =>
  `https://avatars.dicebear.com/api/human/${hash}.svg`;

const coefficient = 5; // darn magic numbers again...
const HashString = (string: string) => {
  return Array.from(string).reduce((fullHash, _, index) => {
    const charCode = string.charCodeAt(index);
    const hash: number = (fullHash << coefficient) - fullHash + charCode;
    return hash;
  }, 0);
};

export default CreateProfilePictureURI;
export { HashString };
