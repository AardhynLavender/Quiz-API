-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_USER', 'ADMIN_USER', 'BASIC_USER');

-- CreateEnum
CREATE TYPE "Rating" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profile_picture_uri" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'BASIC_USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Difficulty" (
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "Difficulty_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "Question_id" INTEGER NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL,
    "difficulty_type" TEXT NOT NULL,
    "category_type" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "winner_id" INTEGER NOT NULL,
    "average_score" DOUBLE PRECISION NOT NULL,
    "average_rating" "Rating" NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "rating" "Rating" NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_name_key" ON "Difficulty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_text_key" ON "Answer"("text");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_Question_id_key" ON "Answer"("Question_id");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_name_key" ON "Quiz"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Result_quiz_id_key" ON "Result"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_user_id_key" ON "Submission"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_quiz_id_key" ON "Submission"("quiz_id");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_Question_id_fkey" FOREIGN KEY ("Question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_difficulty_type_fkey" FOREIGN KEY ("difficulty_type") REFERENCES "Difficulty"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_category_type_fkey" FOREIGN KEY ("category_type") REFERENCES "Category"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
