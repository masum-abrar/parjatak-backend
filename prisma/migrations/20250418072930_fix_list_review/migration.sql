/*
  Warnings:

  - You are about to drop the column `placeId` on the `ListReview` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ListReview" DROP CONSTRAINT "ListReview_placeId_fkey";

-- AlterTable
ALTER TABLE "ListReview" DROP COLUMN "placeId",
ADD COLUMN     "listId" TEXT;

-- AddForeignKey
ALTER TABLE "ListReview" ADD CONSTRAINT "ListReview_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE SET NULL ON UPDATE CASCADE;
