/*
  Warnings:

  - You are about to drop the column `expriry` on the `Session` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "expriry",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;
