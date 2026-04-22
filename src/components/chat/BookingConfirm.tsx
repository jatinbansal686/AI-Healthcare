import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Therapist } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";
import { Loader2, CalendarCheck, Clock, CheckCircle } from "lucide-react";
import { format, addHours } from "date-fns";

const bookingSchema = z.object({
  startDate: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Time is required"),
});
type BookingForm = z.infer<typeof bookingSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  therapist: Therapist;
  inquiryId: string;
  onSuccess: (message: string) => void;
}

export default function BookingConfirm({
  open,
  onClose,
  therapist,
  inquiryId,
  onSuccess,
}: Props) {
  const { session, profile } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "10:00",
    },
  });

  const onSubmit = async (values: BookingForm) => {
    if (!session) return;
    setLoading(true);
    try {
      const startTime = new Date(
        `${values.startDate}T${values.startTime}:00`,
      ).toISOString();
      const endTime = addHours(new Date(startTime), 1).toISOString();

      const { data, error } = await supabase.functions.invoke(
        "book-appointment",
        {
          body: {
            inquiryId,
            therapistId: therapist.id,
            startTime,
            endTime,
            patientName: profile?.full_name ?? "Patient",
            patientEmail: session.user.email,
          },
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setConfirmed(true);
      const dateLabel = format(new Date(startTime), "MMMM d, yyyy 'at' h:mm a");
      onSuccess(
        `Your appointment request with ${therapist.name} on ${dateLabel} has been sent! 🎉 You'll receive a confirmation email once ${therapist.name.split(" ")[0]} accepts. Check your inbox.`,
      );
    } catch (err: any) {
      toast({
        title: "Booking failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={confirmed ? undefined : onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            {confirmed ? "Request sent!" : "Book your session"}
          </DialogTitle>
          <DialogDescription>
            {confirmed ? (
              "The therapist will confirm shortly. Check your email."
            ) : (
              <>
                Scheduling a 1-hour session with{" "}
                <strong>{therapist.name}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm text-center text-muted-foreground">
              Your request has been sent to <strong>{therapist.name}</strong>.
              You'll receive an email when they respond.
            </p>
            <Badge variant="warning" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting therapist confirmation
            </Badge>
            <Button className="w-full mt-2" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date</Label>
              <Input
                id="startDate"
                type="date"
                min={format(new Date(), "yyyy-MM-dd")}
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Preferred time</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
              {errors.startTime && (
                <p className="text-xs text-destructive">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
              📧 A confirmation email will be sent to{" "}
              <strong>{session?.user.email}</strong>. The therapist will also
              receive a request email and must accept before the appointment is
              final.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Send request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
