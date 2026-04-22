export const SPECIALTIES = [
  'anxiety',
  'depression',
  'trauma',
  'ptsd',
  'ocd',
  'grief',
  'family_therapy',
  'adolescents',
  'relationships',
  'stress',
  'mens_health',
  'substance_abuse',
  'identity',
  'cultural_adjustment',
  'mindfulness',
  'anger_management',
] as const

export const INSURANCE_PROVIDERS = [
  'aetna',
  'bcbs',
  'cigna',
  'united',
  'humana',
  'medicaid',
  'medicare',
  'self_pay',
] as const

export const LANGUAGES = [
  'English',
  'Spanish',
  'Hindi',
  'Malayalam',
  'Yoruba',
  'Mandarin',
  'French',
  'Arabic',
] as const

export const GENDER_OPTIONS = [
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'non-binary',        label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  pending:          'Pending',
  matched:          'Matched',
  awaiting_booking: 'Awaiting Booking',
  scheduled:        'Scheduled',
  cancelled:        'Cancelled',
  failed:           'No Match Found',
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  confirmed:    'Confirmed',
  cancelled:    'Cancelled',
  rescheduled:  'Rescheduled',
  no_show:      'No Show',
}