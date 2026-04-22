export type UserRole = 'patient' | 'therapist' | 'admin'

export type InquiryStatus =
  | 'pending'
  | 'matched'
  | 'awaiting_booking'
  | 'scheduled'
  | 'cancelled'
  | 'failed'

export type AppointmentStatus =
  | 'confirmed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show'

export type TherapistGender =
  | 'male'
  | 'female'
  | 'non-binary'
  | 'prefer_not_to_say'

export interface UserProfile {
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
  created_at: string
}

export interface Therapist {
  id: string
  user_id: string | null
  name: string
  bio: string | null
  photo_url: string | null
  specialties: string[]
  accepted_insurance: string[]
  languages: string[]
  gender: TherapistGender
  google_calendar_id: string | null
  google_refresh_token?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Inquiry {
  id: string
  patient_id: string
  problem_description: string
  requested_schedule: string | null
  insurance_info: string | null
  preferred_language: string | null
  preferred_gender: string | null
  extracted_specialty: string | null
  matched_therapist_id: string | null
  status: InquiryStatus
  ai_summary: string | null
  created_at: string
  updated_at: string
  therapist?: Therapist
}

export interface Appointment {
  id: string
  inquiry_id: string
  therapist_id: string
  patient_id: string
  start_time: string
  end_time: string
  google_calendar_event_id: string | null
  status: AppointmentStatus
  notes: string | null
  created_at: string
  therapist?: Therapist
  patient?: UserProfile
}

export interface ChatMessage {
  id: string
  patient_id: string
  inquiry_id: string | null
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface GeminiExtraction {
  problem: string
  specialty_needed: string
  requested_schedule: string
  insurance_info: string
  preferred_language: string
  preferred_gender: string
  is_complete: boolean
  follow_up_question?: string
}

export interface HandleChatResponse {
  reply: string
  extraction: GeminiExtraction | null
  inquiryId: string | null
}

export interface FindTherapistResponse {
  matches: Therapist[]
}

export interface BookAppointmentPayload {
  inquiryId: string
  therapistId: string
  startTime: string
  endTime: string
  patientName: string
  patientEmail: string
}