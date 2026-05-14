/** Departments shown on registration and profile (keep in sync with org structure). */
export const EMPLOYEE_DEPARTMENTS = [
  'Research & Development',
  'Industry Collaboration',
  'Incubation & Acceleration',
  'Skill Development',
  'Operation',
  'Business Development',
  'IT Technology',
  'Lead',
] as const

export type EmployeeDepartment = (typeof EMPLOYEE_DEPARTMENTS)[number]
