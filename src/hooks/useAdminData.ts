// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { supabase } from '@/lib/supabaseClient'
// import { useAuthStore } from '@/store/authStore'
// import { Inquiry, Appointment, Therapist } from '@/types'
// import { useToast } from '@/hooks/useToast'

// export function useAdminData() {
//   const { session } = useAuthStore()
//   const queryClient = useQueryClient()
//   const { toast } = useToast()

//   const inquiriesQuery = useQuery({
//     queryKey: ['admin', 'inquiries'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('inquiries')
//         .select('*, therapist:therapists(id,name,photo_url)')
//         .order('created_at', { ascending: false })
//         .limit(100)
//       if (error) throw error
//       return data as Inquiry[]
//     },
//     enabled: !!session,
//   })

//   const appointmentsQuery = useQuery({
//     queryKey: ['admin', 'appointments'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('appointments')
//         .select('*, therapist:therapists(id,name,photo_url), patient:user_profiles(id,full_name,email)')
//         .order('start_time', { ascending: false })
//         .limit(100)
//       if (error) throw error
//       return data as Appointment[]
//     },
//     enabled: !!session,
//   })

//   const therapistsQuery = useQuery({
//     queryKey: ['admin', 'therapists'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('therapists')
//         .select('*')
//         .order('name')
//       if (error) throw error
//       return data as Therapist[]
//     },
//     enabled: !!session,
//   })

//   // Replace the upsertTherapist mutation with these two:

// const createTherapist = useMutation({
//   mutationFn: async (payload: {
//     email: string
//     password: string
//     name: string
//     bio?: string
//     photo_url?: string
//     gender: string
//     specialties: string[]
//     accepted_insurance: string[]
//     languages: string[]
//     google_calendar_id?: string
//   }) => {
//     const { data: { session } } = await supabase.auth.getSession()
//     const { data, error } = await supabase.functions.invoke('create-therapist', {
//       body: payload,
//       headers: { Authorization: `Bearer ${session?.access_token}` },
//     })
//     if (error) throw error
//     if (data?.error) throw new Error(data.error)
//     return data
//   },
//   onSuccess: () => {
//     queryClient.invalidateQueries({ queryKey: ['admin', 'therapists'] })
//     toast({ title: 'Therapist account created successfully.' })
//   },
//   onError: (err: any) => {
//     toast({ title: 'Error', description: err.message, variant: 'destructive' })
//   },
// })

// const updateTherapist = useMutation({
//   mutationFn: async (payload: Partial<Therapist> & { id: string }) => {
//     const { error } = await supabase
//       .from('therapists')
//       .update(payload)
//       .eq('id', payload.id)
//     if (error) throw error
//   },
//   onSuccess: () => {
//     queryClient.invalidateQueries({ queryKey: ['admin', 'therapists'] })
//     toast({ title: 'Therapist updated.' })
//   },
//   onError: (err: any) => {
//     toast({ title: 'Error', description: err.message, variant: 'destructive' })
//   },
// })

//   const deleteTherapist = useMutation({
//     mutationFn: async (id: string) => {
//       const { error } = await supabase.from('therapists').update({ is_active: false }).eq('id', id)
//       if (error) throw error
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['admin', 'therapists'] })
//       toast({ title: 'Therapist deactivated.' })
//     },
//   })

//   return {
//     inquiries: inquiriesQuery.data ?? [],
//     appointments: appointmentsQuery.data ?? [],
//     therapists: therapistsQuery.data ?? [],
//     isLoadingInquiries: inquiriesQuery.isLoading,
//     isLoadingAppointments: appointmentsQuery.isLoading,
//     isLoadingTherapists: therapistsQuery.isLoading,
//     updateTherapist,
//     deleteTherapist,
//     createTherapist
//   }
// }

//ABOVE ALL CODE IS WORKING AND SAVED ON GITHUB

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { Inquiry, Appointment, Therapist, UserProfile } from "@/types";
import { useToast } from "@/hooks/useToast";

export function useAdminData() {
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Inquiries ─────────────────────────────────────────────────────────────
  const inquiriesQuery = useQuery({
    queryKey: ["admin", "inquiries"],
    queryFn: async () => {
      // Step 1: fetch raw inquiries
      const { data: rawInquiries, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      if (!rawInquiries?.length) return [];

      // Step 2: collect unique IDs
      const patientIds = [
        ...new Set(rawInquiries.map((i) => i.patient_id).filter(Boolean)),
      ];
      const therapistIds = [
        ...new Set(
          rawInquiries.map((i) => i.matched_therapist_id).filter(Boolean),
        ),
      ];

      // Step 3: fetch patients and therapists in parallel
      const [patientsRes, therapistsRes] = await Promise.all([
        patientIds.length
          ? supabase
              .from("user_profiles")
              .select("id, full_name, email")
              .in("id", patientIds)
          : Promise.resolve({ data: [] }),
        therapistIds.length
          ? supabase
              .from("therapists")
              .select("id, name, photo_url")
              .in("id", therapistIds)
          : Promise.resolve({ data: [] }),
      ]);

      // Step 4: build lookup maps
      const patientMap = Object.fromEntries(
        (patientsRes.data ?? []).map((p) => [p.id, p]),
      );
      const therapistMap = Object.fromEntries(
        (therapistsRes.data ?? []).map((t) => [t.id, t]),
      );

      // Step 5: enrich
      return rawInquiries.map((inq) => ({
        ...inq,
        patient: patientMap[inq.patient_id] ?? null,
        therapist: therapistMap[inq.matched_therapist_id] ?? null,
      })) as Inquiry[];
    },
    enabled: !!session,
    refetchInterval: 30_000,
  });

  // ── Appointments ──────────────────────────────────────────────────────────
  const appointmentsQuery = useQuery({
    queryKey: ["admin", "appointments"],
    queryFn: async () => {
      // Step 1: fetch raw appointments
      const { data: rawApts, error } = await supabase
        .from("appointments")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(200);
      if (error) throw error;
      if (!rawApts?.length) return [];

      // Step 2: collect unique IDs
      const patientIds = [
        ...new Set(rawApts.map((a) => a.patient_id).filter(Boolean)),
      ];
      const therapistIds = [
        ...new Set(rawApts.map((a) => a.therapist_id).filter(Boolean)),
      ];

      // Step 3: fetch in parallel
      const [patientsRes, therapistsRes] = await Promise.all([
        patientIds.length
          ? supabase
              .from("user_profiles")
              .select("id, full_name, email")
              .in("id", patientIds)
          : Promise.resolve({ data: [] }),
        therapistIds.length
          ? supabase
              .from("therapists")
              .select("id, name")
              .in("id", therapistIds)
          : Promise.resolve({ data: [] }),
      ]);

      // Step 4: build maps
      const patientMap = Object.fromEntries(
        (patientsRes.data ?? []).map((p) => [p.id, p]),
      );
      const therapistMap = Object.fromEntries(
        (therapistsRes.data ?? []).map((t) => [t.id, t]),
      );

      // Step 5: enrich
      return rawApts.map((apt) => ({
        ...apt,
        patient: patientMap[apt.patient_id] ?? null,
        therapist: therapistMap[apt.therapist_id] ?? null,
      })) as Appointment[];
    },
    enabled: !!session,
    refetchInterval: 15_000,
  });

  // ── Therapists ────────────────────────────────────────────────────────────
  const therapistsQuery = useQuery({
    queryKey: ["admin", "therapists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("therapists")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Therapist[];
    },
    enabled: !!session,
  });

  // ── Create therapist via Edge Function ───────────────────────────────────
  const createTherapist = useMutation({
    mutationFn: async (payload: any) => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke(
        "create-therapist",
        {
          body: payload,
          headers: { Authorization: `Bearer ${s?.access_token}` },
        },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapists"] });
      toast({ title: "Therapist account created." });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ── Update therapist ──────────────────────────────────────────────────────
  const updateTherapist = useMutation({
    mutationFn: async (payload: Partial<Therapist> & { id: string }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from("therapists")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapists"] });
      toast({ title: "Therapist updated." });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ── Deactivate therapist ──────────────────────────────────────────────────
  const deleteTherapist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("therapists")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapists"] });
      toast({ title: "Therapist deactivated." });
    },
  });

  return {
    inquiries: inquiriesQuery.data ?? [],
    appointments: appointmentsQuery.data ?? [],
    therapists: therapistsQuery.data ?? [],
    isLoadingInquiries: inquiriesQuery.isLoading,
    isLoadingAppointments: appointmentsQuery.isLoading,
    isLoadingTherapists: therapistsQuery.isLoading,
    createTherapist,
    updateTherapist,
    deleteTherapist,
  };
}
