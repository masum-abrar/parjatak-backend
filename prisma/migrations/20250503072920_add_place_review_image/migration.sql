-- CreateTable
CREATE TABLE "PlaceReviewImage" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT,
    "image" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceReviewImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlaceReviewImage" ADD CONSTRAINT "PlaceReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "PlaceReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;
