import type { ActivityLevel } from './Patient';

export type BodyAssessment = {
  id: number;
  patientId: number;
  assessmentDate: string;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
};
