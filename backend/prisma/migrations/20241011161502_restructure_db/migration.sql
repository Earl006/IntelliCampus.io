/*
  Warnings:

  - You are about to drop the column `chatRoomId` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the `ChatRoom` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_chatRoomId_fkey";

-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_cohortId_fkey";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "chatRoomId",
ADD COLUMN     "cohortChatRoomId" TEXT,
ADD COLUMN     "courseChatRoomId" TEXT;

-- DropTable
DROP TABLE "ChatRoom";

-- CreateTable
CREATE TABLE "CourseChatRoom" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortChatRoom" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,

    CONSTRAINT "CohortChatRoom_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourseChatRoom" ADD CONSTRAINT "CourseChatRoom_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortChatRoom" ADD CONSTRAINT "CohortChatRoom_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_courseChatRoomId_fkey" FOREIGN KEY ("courseChatRoomId") REFERENCES "CourseChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_cohortChatRoomId_fkey" FOREIGN KEY ("cohortChatRoomId") REFERENCES "CohortChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
