import * as repository from "../repositories/bodyAssessmentRepository"
import * as patientService from "./patientService"

import type { BodyAssessment } from "../../generated/prisma/client"
import type { CreateBodyAssessmentDto } from "../dto/bodyAssessment/createBodyAssessmentDto"
import type { UpdateBodyAssessmentDto } from "../dto/bodyAssessment/updateBodyAssessmentDto"

import { NotFoundError } from "../errors/NotFoundError"

export async function create(data: CreateBodyAssessmentDto): Promise<BodyAssessment> {
    // Verifica se o paciente existe antes de registrar a avaliação
    await patientService.findById(data.patientId)

    return repository.create(data)
}

export async function findById(id: number): Promise<BodyAssessment> {
    const assessment = await repository.findById(id)

    if(!assessment) throw new NotFoundError("Avaliação corporal não encontrada.");

    return assessment
}

export async function findAll(): Promise<BodyAssessment[]> {
    return repository.findAll()
}

export async function findAllByPatientId(patientId: number): Promise<BodyAssessment[]> {
    // Retorna 404 se o paciente não existir, em vez de uma lista vazia
    await patientService.findById(patientId)

    return repository.findAllByPatientId(patientId)
}

export async function updateById(id: number, data: UpdateBodyAssessmentDto): Promise<BodyAssessment> {
    await findById(id)

    return repository.updateById(id, data)
}

export async function deleteById(id: number): Promise<BodyAssessment> {
    await findById(id)

    return repository.deleteById(id)
}
