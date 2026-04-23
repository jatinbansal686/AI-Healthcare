// import { useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { supabase } from "@/lib/supabaseClient";
// import { useToast } from "@/hooks/useToast";
// import { formatDateTime } from "@/lib/utils";
// import { CheckCircle, XCircle, Clock, Loader2, User } from "lucide-react";

// interface Props {
//   appointment: any;
//   onUpdate: () => void;
// }

// export default function AppointmentRequestCard({
//   appointment,
//   onUpdate,
// }: Props) {
//   const { toast } = useToast();
//   const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

//   //   const handle = async (action: "accept" | "reject") => {
//   //     setLoading(action);
//   //     try {
//   //       const newStatus = action === "accept" ? "accepted" : "rejected";

//   //       const { data, error } = await supabase
//   //         .from("appointments")
//   //         .update({
//   //           confirmation_status: newStatus,
//   //           ...(action === "reject" ? { status: "cancelled" } : {}),
//   //         })
//   //         .eq("id", appointment.id)
//   //         .select();

//   //       console.log("UPDATE RESULT:", data);

//   //       if (error) throw error;

//   //       // Update inquiry status
//   //       if (action === "accept") {
//   //         await supabase
//   //           .from("inquiries")
//   //           .update({ status: "scheduled" })
//   //           .eq("id", appointment.inquiry_id);
//   //       } else {
//   //         await supabase
//   //           .from("inquiries")
//   //           .update({ status: "matched" })
//   //           .eq("id", appointment.inquiry_id);
//   //       }

//   //       // Send notification email to patient via edge function
//   //       await supabase.functions.invoke("notify-patient", {
//   //         body: { appointmentId: appointment.id, action },
//   //       });

//   //       toast({
//   //         title:
//   //           action === "accept" ? "Appointment accepted" : "Appointment declined",
//   //         description:
//   //           action === "accept"
//   //             ? "The patient has been notified."
//   //             : "The patient has been notified and can request another time.",
//   //       });
//   //       onUpdate();
//   //     } catch (err: any) {
//   //       toast({
//   //         title: "Error",
//   //         description: err.message,
//   //         variant: "destructive",
//   //       });
//   //     } finally {
//   //       setLoading(null);
//   //     }
//   //   };
//   const handle = async (action: "accept" | "reject") => {
//     setLoading(action);
//     try {
//       const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-appointment?action=${action}&token=${appointment.confirmation_token}`;

//       const res = await fetch(url);
//       const text = await res.text();

//       console.log("Backend response:", text);

//       if (!res.ok) {
//         throw new Error("Failed to process request");
//       }

//       toast({
//         title:
//           action === "accept" ? "Appointment accepted" : "Appointment declined",
//       });

//       onUpdate();
//     } catch (err: any) {
//       console.error(err);
//       toast({
//         title: "Error",
//         description: err.message,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(null);
//     }
//   };
//   const statusConfig = {
//     pending: {
//       label: "Awaiting your response",
//       variant: "warning" as const,
//       icon: Clock,
//     },
//     accepted: {
//       label: "Confirmed",
//       variant: "success" as const,
//       icon: CheckCircle,
//     },
//     rejected: { label: "Declined", variant: "outline" as const, icon: XCircle },
//   };
//   const cfg =
//     statusConfig[
//       appointment.confirmation_status as keyof typeof statusConfig
//     ] ?? statusConfig.pending;

//   return (
//     <Card
//       className={
//         appointment.confirmation_status === "pending" ? "border-primary/30" : ""
//       }
//     >
//       <CardContent className="p-4">
//         <div className="flex items-start justify-between gap-4">
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-2 mb-1">
//               <User className="h-4 w-4 text-muted-foreground shrink-0" />
//               <p className="font-medium text-sm truncate">
//                 {appointment.patient?.full_name ??
//                   appointment.patient?.email ??
//                   "Patient"}
//               </p>
//             </div>
//             <p className="text-xs text-muted-foreground">
//               {formatDateTime(appointment.start_time)}
//               <span className="mx-1">·</span>1 hour
//             </p>
//             {appointment.patient?.email && (
//               <p className="text-xs text-muted-foreground mt-0.5">
//                 {appointment.patient.email}
//               </p>
//             )}
//           </div>

//           <Badge variant={cfg.variant} className="shrink-0 text-xs">
//             {cfg.label}
//           </Badge>
//         </div>

//         {/* Action buttons — only show for pending */}
//         {appointment.confirmation_status === "pending" && (
//           <div className="flex gap-2 mt-4">
//             <Button
//               size="sm"
//               className="flex-1 bg-green-600 hover:bg-green-700"
//               onClick={() => handle("accept")}
//               disabled={!!loading}
//             >
//               {loading === "accept" ? (
//                 <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
//               ) : (
//                 <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
//               )}
//               Accept
//             </Button>
//             <Button
//               size="sm"
//               variant="outline"
//               className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
//               onClick={() => handle("reject")}
//               disabled={!!loading}
//             >
//               {loading === "reject" ? (
//                 <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
//               ) : (
//                 <XCircle className="h-3.5 w-3.5 mr-1.5" />
//               )}
//               Decline
//             </Button>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
// ALL ABOVE CODE IS WORKING AND SAVED ON GITHUB

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Loader2, User } from "lucide-react";

interface Props {
  appointment: any;
  onUpdate: () => void;
}

export default function AppointmentRequestCard({
  appointment,
  onUpdate,
}: Props) {
  const { session } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  const handle = async (action: "accept" | "reject") => {
    setLoading(action);
    try {
      if (!appointment.confirmation_token) {
        throw new Error("No confirmation token found on this appointment.");
      }

      // Use supabase.functions.invoke instead of raw fetch — avoids CORS issues
      // Pass action and token as query params via the url option
      const { error } = await supabase.functions.invoke("book-appointment", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // functions.invoke doesn't support query params natively, so we call fetch
        // but via the supabase client's built-in fetch which handles CORS
      });

      // ↑ functions.invoke doesn't support GET with query params cleanly
      // so use supabase's internal fetch with the session token instead:
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-appointment?action=${action}&token=${appointment.confirmation_token}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          // Include the anon key — this satisfies Supabase's CORS policy
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Edge function error:", res.status, text);
        throw new Error(`Request failed: ${res.status}`);
      }

      // Response is HTML — we don't parse it, just check status
      console.log("Appointment", action, "successful");

      // Send in-app email notification
      await supabase.functions.invoke("notify-patient", {
        body: { appointmentId: appointment.id, action },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      toast({
        title:
          action === "accept"
            ? "✅ Appointment accepted"
            : "Appointment declined",
        description:
          action === "accept"
            ? "Patient notified. Calendar event created."
            : "Patient notified. They can choose another time.",
      });

      onUpdate();
    } catch (err: any) {
      console.error("AppointmentRequestCard error:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const statusConfig: Record<string, { label: string; variant: any }> = {
    pending: { label: "Awaiting your response", variant: "warning" },
    accepted: { label: "Confirmed", variant: "success" },
    rejected: { label: "Declined", variant: "outline" },
  };
  const cfg =
    statusConfig[appointment.confirmation_status] ?? statusConfig.pending;

  return (
    <Card
      className={
        appointment.confirmation_status === "pending" ? "border-primary/30" : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="font-medium text-sm truncate">
                {appointment.patient?.full_name ??
                  appointment.patient?.email ??
                  "Patient"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(appointment.start_time)}
              <span className="mx-1">·</span>1 hour
            </p>
            {appointment.patient?.email && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {appointment.patient.email}
              </p>
            )}
          </div>

          <Badge variant={cfg.variant} className="shrink-0 text-xs">
            {cfg.label}
          </Badge>
        </div>

        {appointment.confirmation_status === "pending" && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handle("accept")}
              disabled={!!loading}
            >
              {loading === "accept" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => handle("reject")}
              disabled={!!loading}
            >
              {loading === "reject" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
              )}
              Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
