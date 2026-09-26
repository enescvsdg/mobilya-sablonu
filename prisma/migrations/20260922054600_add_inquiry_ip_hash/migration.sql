-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "inquiries_ipHash_createdAt_idx" ON "inquiries"("ipHash", "createdAt");
