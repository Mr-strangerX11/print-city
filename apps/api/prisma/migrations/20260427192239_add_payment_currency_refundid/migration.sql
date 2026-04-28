-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NPR',
ADD COLUMN     "refundId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");
