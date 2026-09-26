import { BiologicalSex } from "../../../generated/prisma/client";

// Dados para atualizar um paciente; todos os campos são opcionais
export class UpdatePatientDto {
  name?: string;

  birthDate?: Date;

  gender?: string;

  biologicalSex?: BiologicalSex;

  // CPF com ou sem máscara (000.000.000-00 ou 00000000000)
  cpf?: string;

  phone?: string;
}
