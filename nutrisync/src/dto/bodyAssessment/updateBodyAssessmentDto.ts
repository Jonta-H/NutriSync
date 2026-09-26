import type { ActivityLevel } from "../../../generated/prisma/client";

// Dados para atualizar uma avaliação corporal; todos os campos são opcionais
export interface UpdateBodyAssessmentDto {
  assessmentDate?: Date;

  // Peso em kg
  weigth?: number;

  // Altura em metros
  heigth?: number;

  activityLevel?: ActivityLevel;
}
