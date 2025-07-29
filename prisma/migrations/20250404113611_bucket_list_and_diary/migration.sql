-- CreateTable
CREATE TABLE "Diary" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "placeId" TEXT,
    "description" TEXT,
    "title" TEXT,
    "slug" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryImage" (
    "id" TEXT NOT NULL,
    "diaryId" TEXT,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BucketList" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "placeId" TEXT,
    "description" TEXT,
    "title" TEXT,
    "slug" TEXT,
    "targetDate" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BucketList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BucketListImage" (
    "id" TEXT NOT NULL,
    "bucketListId" TEXT,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BucketListImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BucketListLike" (
    "id" TEXT NOT NULL,
    "bucketListId" TEXT,
    "parentUserId" TEXT,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BucketListLike_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Diary" ADD CONSTRAINT "Diary_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diary" ADD CONSTRAINT "Diary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryImage" ADD CONSTRAINT "DiaryImage_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "Diary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BucketList" ADD CONSTRAINT "BucketList_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BucketList" ADD CONSTRAINT "BucketList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BucketListImage" ADD CONSTRAINT "BucketListImage_bucketListId_fkey" FOREIGN KEY ("bucketListId") REFERENCES "BucketList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BucketListLike" ADD CONSTRAINT "BucketListLike_bucketListId_fkey" FOREIGN KEY ("bucketListId") REFERENCES "BucketList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BucketListLike" ADD CONSTRAINT "BucketListLike_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BucketListLike" ADD CONSTRAINT "BucketListLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
