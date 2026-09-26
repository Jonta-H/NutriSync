import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { SexoBiologico } from "../../../generated/prisma/client";

// Dados necessários para cadastrar um novo paciente
// Campos obrigatórios pois são necessários para a avaliação corporal
export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome!: string;

  @Type(() => Date)
  @IsDate()
  dataNascimento!: Date;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  genero!: string;

  @IsEnum(SexoBiologico)
  sexoBiologico!: SexoBiologico;

  // CPF com ou sem máscara (000.000.000-00 ou 00000000000)
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: "cpf inválido" })
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telefone!: string;
}
