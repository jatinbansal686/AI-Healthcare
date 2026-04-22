import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { Inquiry, Appointment, Therapist } from '@/types'
import { useToast } from '@/hooks/useToast'

export function useAdminData() {
  const { session } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const inquiriesQuery = useQuery({
    queryKey: ['admin', 'inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*, therapist:therapists(id,name,photo_url)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as Inquiry[]
    },
    enabled: !!session,
  })

  const appointmentsQuery = useQuery({
    queryKey: ['admin', 'appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, therapist:therapists(id,name,photo_url), patient:user_profiles(id,full_name,email)')
        .order('start_time', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as Appointment[]
    },
    enabled: !!session,
  })

  const therapistsQuery = useQuery({
    queryKey: ['admin', 'therapists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('therapists')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Therapist[]
    },
    enabled: !!session,
  })

  // Replace the upsertTherapist mutation with these two:

const createTherapist = useMutation({
  mutationFn: async (payload: {
    email: string
    password: string
    name: string
    bio?: string
    photo_url?: string
    gender: string
    specialties: string[]
    accepted_insurance: string[]
    languages: string[]
    google_calendar_id?: string
  }) => {
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke('create-therapist', {
      body: payload,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'therapists'] })
    toast({ title: 'Therapist account created successfully.' })
  },
  onError: (err: any) => {
    toast({ title: 'Error', description: err.message, variant: 'destructive' })
  },
})

const updateTherapist = useMutation({
  mutationFn: async (payload: Partial<Therapist> & { id: string }) => {
    const { error } = await supabase
      .from('therapists')
      .update(payload)
      .eq('id', payload.id)
    if (error) throw error
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'therapists'] })
    toast({ title: 'Therapist updated.' })
  },
  onError: (err: any) => {
    toast({ title: 'Error', description: err.message, variant: 'destructive' })
  },
})

  const deleteTherapist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('therapists').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'therapists'] })
      toast({ title: 'Therapist deactivated.' })
    },
  })

  return {
    inquiries: inquiriesQuery.data ?? [],
    appointments: appointmentsQuery.data ?? [],
    therapists: therapistsQuery.data ?? [],
    isLoadingInquiries: inquiriesQuery.isLoading,
    isLoadingAppointments: appointmentsQuery.isLoading,
    isLoadingTherapists: therapistsQuery.isLoading,
    updateTherapist,
    deleteTherapist,
    createTherapist
  }
}