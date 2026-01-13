-- CreateEnum
CREATE TYPE "BaseCurrency" AS ENUM ('USD', 'BIRR');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "baseCurrency" "BaseCurrency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "usdToBirrRate" DECIMAL(65,30) NOT NULL DEFAULT 120;
