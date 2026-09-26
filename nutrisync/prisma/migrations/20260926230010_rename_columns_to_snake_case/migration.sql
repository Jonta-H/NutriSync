-- Renomeia as colunas preservando os dados (o Prisma geraria DROP + ADD COLUMN)

-- AlterTable
ALTER TABLE "Patient" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "Patient" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "BodyAssessment" RENAME COLUMN "weigth" TO "weight";
ALTER TABLE "BodyAssessment" RENAME COLUMN "heigth" TO "height";
ALTER TABLE "BodyAssessment" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "BodyAssessment" RENAME COLUMN "updatedAt" TO "updated_at";
