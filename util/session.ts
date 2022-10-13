import { Environment } from "./environment";
import Prisma from "./prismaConfig";

const CreateExpiryDate = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000);

const RevokeSession = async (id: number) =>
  await Prisma.session.delete({ where: { user_id: id } });

const CreateSession = async (id: number) => {
  const token = await Prisma.session.create({
    data: {
      user_id: id,
      expires_at: CreateExpiryDate(parseInt(Environment.SESSION_LIFETIME)),
    },
  });
  if (!token) throw new Error("Failed to create a new session");
  return token.key;
};

export { CreateSession, RevokeSession };
