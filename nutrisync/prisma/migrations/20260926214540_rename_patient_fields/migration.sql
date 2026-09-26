/*
  Warnings:

  - You are about to drop the `Paciente` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BiologicalSex" AS ENUM ('MASCULINO', 'FEMININO');

-- DropTable
DROP TABLE "Paciente";

-- DropEnum
DROP TYPE "SexoBiologico";

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" VARCHAR(40) NOT NULL,
    "biological_sex" "BiologicalSex" NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpf_key" ON "Patient"("cpf");
