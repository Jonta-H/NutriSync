import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { SexoBiologico } from "../../../generated/prisma/client";

// Dados para atualizar um paciente; todos os campos são opcionais
export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  gender?: string;

  @IsOptional()
  @IsEnum(SexoBiologico)
  biologicalSex?: SexoBiologico;

  // CPF com ou sem máscara (000.000.000-00 ou 00000000000)
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: "cpf inválido" })
  cpf?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone?: string;
}
