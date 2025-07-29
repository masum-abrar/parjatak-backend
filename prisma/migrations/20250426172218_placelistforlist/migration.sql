-- CreateTable
CREATE TABLE "ListPlace" (
    "id" TEXT NOT NULL,
    "listId" TEXT,
    "placeId" TEXT,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListPlace_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ListPlace" ADD CONSTRAINT "ListPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListPlace" ADD CONSTRAINT "ListPlace_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListPlace" ADD CONSTRAINT "ListPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
