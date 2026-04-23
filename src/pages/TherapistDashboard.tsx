import { useEffect, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import ProfileForm from "@/components/therapist/ProfileForm";
import CalendarConnect from "@/components/therapist/CalendarConnect";
import AppointmentRequestCard from "@/components/therapist/AppointmentRequestCard";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { Therapist, Appointment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDateTime } from "@/lib/utils";
import { CalendarCheck, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TherapistDashboard() {
  const { session } = useAuthStore();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Fetch therapist profile
      const { data: t } = await supabase
        .from("therapists")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      setTherapist(t);

      if (t) {
        // Fetch appointments without joins
        const { data: rawApts } = await supabase
          .from("appointments")
          .select("*")
          .eq("therapist_id", t.id)
          .order("start_time", { ascending: false })
          .limit(50);

        if (rawApts?.length) {
          // Collect unique patient IDs
          const patientIds = [
            ...new Set(rawApts.map((a) => a.patient_id).filter(Boolean)),
          ];

          // Fetch patient profiles separately
          const { data: patients } = patientIds.length
            ? await supabase
                .from("user_profiles")
                .select("id, full_name, email")
                .in("id", patientIds)
            : { data: [] };

          const patientMap = Object.fromEntries(
            (patients ?? []).map((p) => [p.id, p]),
          );

          // Enrich appointments with patient data
          const enriched = rawApts.map((apt) => ({
            ...apt,
            patient: patientMap[apt.patient_id] ?? null,
          }));

          setAppointments(enriched);
        } else {
          setAppointments([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Navbar />
        <main className="container py-12 max-w-lg text-center">
          <p className="text-muted-foreground">
            Your therapist profile has not been set up yet. Please contact an
            admin.
          </p>
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-muted/20">
        <Navbar />
        <main className="container py-8 max-w-4xl">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-16 w-16">
              {therapist.photo_url && <AvatarImage src={therapist.photo_url} />}
              <AvatarFallback className="text-lg">
                {getInitials(therapist.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{therapist.name}</h1>
              <p className="text-sm text-muted-foreground">
                Therapist dashboard
              </p>
            </div>
          </div>

          <Tabs defaultValue="appointments">
            <TabsList className="mb-6">
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="profile">My profile</TabsTrigger>
              <TabsTrigger value="calendar">Google Calendar</TabsTrigger>
            </TabsList>

            {/* <TabsContent value="appointments">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No appointment requests yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <AppointmentRequestCard
                      key={apt.id}
                      appointment={apt}
                      onUpdate={loadData}
                    />
                  ))}
                </div>
              )}{" "}
              : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {apt.patient?.full_name ??
                            apt.patient?.email ??
                            "Patient"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(apt.start_time)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          apt.status === "confirmed" ? "success" : "outline"
                        }
                      >
                        {apt.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )
            </TabsContent> */}
            <TabsContent value="appointments">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No appointment requests yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <AppointmentRequestCard
                      key={apt.id}
                      appointment={apt}
                      onUpdate={loadData}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Edit your profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileForm therapist={therapist} onSaved={loadData} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Google Calendar connection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {therapist.google_refresh_token ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">
                            Calendar connected
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {therapist.google_calendar_id}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="text-sm font-medium">Not connected</p>
                          <p className="text-xs text-muted-foreground">
                            Connect your Google Calendar to receive booking
                            events.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <CalendarConnect />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ErrorBoundary>
  );
}
