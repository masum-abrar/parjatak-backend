/*
  Warnings:

  - You are about to drop the `_ParentUserId` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ParentUserId" DROP CONSTRAINT "_ParentUserId_A_fkey";

-- DropForeignKey
ALTER TABLE "_ParentUserId" DROP CONSTRAINT "_ParentUserId_B_fkey";

-- DropTable
DROP TABLE "_ParentUserId";

-- CreateTable
CREATE TABLE "Follower" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Follower_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
