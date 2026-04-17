/*
  Warnings:

  - You are about to drop the column `token` on the `sessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refresh_token_hash]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `refresh_token_hash` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "sessions_token_key";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "token",
ADD COLUMN     "refresh_token_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");
