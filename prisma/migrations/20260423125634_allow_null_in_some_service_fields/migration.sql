-- AlterTable
ALTER TABLE "services" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "estimated_duration_min_in_minutes" DROP NOT NULL,
ALTER COLUMN "estimated_duration_max_in_minutes" DROP NOT NULL;
