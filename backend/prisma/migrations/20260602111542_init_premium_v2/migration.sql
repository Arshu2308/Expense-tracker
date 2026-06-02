/*
  Warnings:

  - Added the required column `accountId` to the `RecurringExpense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RecurringExpense" ADD COLUMN     "accountId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
