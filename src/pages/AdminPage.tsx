import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import InquiryTable from "@/components/admin/InquiryTable";
import AppointmentTable from "@/components/admin/AppointmentTable";
import TherapistForm from "@/components/admin/TherapistForm";
import { useAdminData } from "@/hooks/useAdminData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Therapist } from "@/types";
import { getInitials, capitalize } from "@/lib/utils";
import {
  Plus,
  Users,
  MessageSquare,
  CalendarDays,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";

export default function AdminPage() {
  const {
    inquiries,
    appointments,
    therapists,
    isLoadingInquiries,
    isLoadingTherapists,
    upsertTherapist,
    deleteTherapist,
  } = useAdminData();
  const [editingTherapist, setEditingTherapist] = useState<
    Therapist | undefined
  >();
  const [showForm, setShowForm] = useState(false);

  const openForm = (t?: Therapist) => {
    setEditingTherapist(t);
    setShowForm(true);
  };
  const closeForm = () => {
    setEditingTherapist(undefined);
    setShowForm(false);
  };

  const handleUpsert = (data: Partial<Therapist>) => {
    upsertTherapist.mutate(data, { onSuccess: closeForm });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-muted/20">
        <Navbar />
        <main className="container py-8 max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage therapists, review inquiries, and track appointments.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: MessageSquare,
                label: "Total inquiries",
                value: inquiries.length,
              },
              {
                icon: CalendarDays,
                label: "Appointments",
                value: appointments.length,
              },
              {
                icon: Users,
                label: "Active therapists",
                value: therapists.filter((t) => t.is_active).length,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-background rounded-lg border p-4 flex items-center gap-3"
              >
                <Icon className="h-8 w-8 text-primary/60" />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <Tabs defaultValue="inquiries">
            <TabsList className="mb-4">
              <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="therapists">Therapists</TabsTrigger>
            </TabsList>

            <TabsContent value="inquiries">
              {isLoadingInquiries ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <InquiryTable inquiries={inquiries} />
              )}
            </TabsContent>

            <TabsContent value="appointments">
              <AppointmentTable appointments={appointments} />
            </TabsContent>

            <TabsContent value="therapists">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {therapists.length} therapist
                  {therapists.length !== 1 ? "s" : ""}
                </p>
                <Button size="sm" onClick={() => openForm()}>
                  <Plus className="h-4 w-4 mr-1" /> Add therapist
                </Button>
              </div>

              {isLoadingTherapists ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {therapists.map((t) => (
                    <div
                      key={t.id}
                      className="bg-background border rounded-lg p-4 flex items-center gap-4"
                    >
                      <Avatar className="h-10 w-10">
                        {t.photo_url && <AvatarImage src={t.photo_url} />}
                        <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{t.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.specialties.slice(0, 3).map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="text-xs"
                            >
                              {capitalize(s)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant={t.is_active ? "success" : "outline"}
                        className="hidden sm:inline-flex"
                      >
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openForm(t)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteTherapist.mutate(t.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <Dialog open={showForm} onOpenChange={closeForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTherapist ? "Edit therapist" : "Add new therapist"}
              </DialogTitle>
            </DialogHeader>
            <TherapistForm
              therapist={editingTherapist}
              onSubmit={handleUpsert}
              onCancel={closeForm}
              loading={upsertTherapist.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}
