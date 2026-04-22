import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Chrome } from "lucide-react";

export default function CalendarConnect() {
  const { session } = useAuthStore();

  const connectCalendar = () => {
    if (!session) return;
    const SCOPES = "https://www.googleapis.com/auth/calendar.events";
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-callback`;
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state: session.access_token,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <Button onClick={connectCalendar} variant="outline" className="gap-2">
      <Chrome className="h-4 w-4" />
      Connect Google Calendar
    </Button>
  );
}
