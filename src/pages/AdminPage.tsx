// import { useState } from "react";
// import Navbar from "@/components/shared/Navbar";
// import ErrorBoundary from "@/components/shared/ErrorBoundary";
// import InquiryTable from "@/components/admin/InquiryTable";
// import AppointmentTable from "@/components/admin/AppointmentTable";
// import TherapistForm from "@/components/admin/TherapistForm";
// import { useAdminData } from "@/hooks/useAdminData";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Therapist } from "@/types";
// import { getInitials, capitalize } from "@/lib/utils";
// import {
//   Plus,
//   Users,
//   MessageSquare,
//   CalendarDays,
//   Trash2,
//   Pencil,
//   Loader2,
// } from "lucide-react";

// export default function AdminPage() {
//   const {
//     inquiries,
//     appointments,
//     therapists,
//     isLoadingInquiries,
//     isLoadingTherapists,
//     //upsertTherapist,
//     deleteTherapist,
//     updateTherapist,
//     createTherapist,
//   } = useAdminData();
//   const [editingTherapist, setEditingTherapist] = useState<
//     Therapist | undefined
//   >();
//   const [showForm, setShowForm] = useState(false);

//   const openForm = (t?: Therapist) => {
//     setEditingTherapist(t);
//     setShowForm(true);
//   };
//   const closeForm = () => {
//     setEditingTherapist(undefined);
//     setShowForm(false);
//   };

//   const handleUpsert = (
//     data: Partial<Therapist> & { email?: string; password?: string },
//   ) => {
//     if (editingTherapist) {
//       // Editing existing — use direct DB update
//       updateTherapist.mutate(
//         { ...data, id: editingTherapist.id },
//         { onSuccess: closeForm },
//       );
//     } else {
//       // Creating new — use Edge Function which creates Auth user + therapist record
//       createTherapist.mutate(data as any, { onSuccess: closeForm });
//     }
//   };

//   return (
//     <ErrorBoundary>
//       <div className="min-h-screen bg-muted/20">
//         <Navbar />
//         <main className="container py-8 max-w-6xl">
//           <div className="mb-6">
//             <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//             <p className="text-sm text-muted-foreground mt-1">
//               Manage therapists, review inquiries, and track appointments.
//             </p>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
//             {[
//               {
//                 icon: MessageSquare,
//                 label: "Total inquiries",
//                 value: inquiries.length,
//               },
//               {
//                 icon: CalendarDays,
//                 label: "Appointments",
//                 value: appointments.length,
//               },
//               {
//                 icon: Users,
//                 label: "Active therapists",
//                 value: therapists.filter((t) => t.is_active).length,
//               },
//             ].map(({ icon: Icon, label, value }) => (
//               <div
//                 key={label}
//                 className="bg-background rounded-lg border p-4 flex items-center gap-3"
//               >
//                 <Icon className="h-8 w-8 text-primary/60" />
//                 <div>
//                   <p className="text-2xl font-bold">{value}</p>
//                   <p className="text-xs text-muted-foreground">{label}</p>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <Tabs defaultValue="inquiries">
//             <TabsList className="mb-4">
//               <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
//               <TabsTrigger value="appointments">Appointments</TabsTrigger>
//               <TabsTrigger value="therapists">Therapists</TabsTrigger>
//             </TabsList>

//             <TabsContent value="inquiries">
//               {isLoadingInquiries ? (
//                 <div className="flex justify-center py-12">
//                   <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//                 </div>
//               ) : (
//                 <InquiryTable inquiries={inquiries} />
//               )}
//             </TabsContent>

//             <TabsContent value="appointments">
//               <AppointmentTable appointments={appointments} />
//             </TabsContent>

//             <TabsContent value="therapists">
//               <div className="flex justify-between items-center mb-4">
//                 <p className="text-sm text-muted-foreground">
//                   {therapists.length} therapist
//                   {therapists.length !== 1 ? "s" : ""}
//                 </p>
//                 <Button size="sm" onClick={() => openForm()}>
//                   <Plus className="h-4 w-4 mr-1" /> Add therapist
//                 </Button>
//               </div>

//               {isLoadingTherapists ? (
//                 <div className="flex justify-center py-12">
//                   <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//                 </div>
//               ) : (
//                 <div className="grid gap-3">
//                   {therapists.map((t) => (
//                     <div
//                       key={t.id}
//                       className="bg-background border rounded-lg p-4 flex items-center gap-4"
//                     >
//                       <Avatar className="h-10 w-10">
//                         {t.photo_url && <AvatarImage src={t.photo_url} />}
//                         <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
//                       </Avatar>
//                       <div className="flex-1 min-w-0">
//                         <p className="font-medium text-sm">{t.name}</p>
//                         <div className="flex flex-wrap gap-1 mt-1">
//                           {t.specialties.slice(0, 3).map((s) => (
//                             <Badge
//                               key={s}
//                               variant="secondary"
//                               className="text-xs"
//                             >
//                               {capitalize(s)}
//                             </Badge>
//                           ))}
//                         </div>
//                       </div>
//                       <Badge
//                         variant={t.is_active ? "success" : "outline"}
//                         className="hidden sm:inline-flex"
//                       >
//                         {t.is_active ? "Active" : "Inactive"}
//                       </Badge>
//                       <div className="flex gap-1">
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           onClick={() => openForm(t)}
//                         >
//                           <Pencil className="h-4 w-4" />
//                         </Button>
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           onClick={() => deleteTherapist.mutate(t.id)}
//                           className="text-destructive hover:text-destructive"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </TabsContent>
//           </Tabs>
//         </main>

//         <Dialog open={showForm} onOpenChange={closeForm}>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>
//                 {editingTherapist ? "Edit therapist" : "Add new therapist"}
//               </DialogTitle>
//             </DialogHeader>
//             <TherapistForm
//               therapist={editingTherapist}
//               onSubmit={handleUpsert}
//               onCancel={closeForm}
//               loading={
//                 editingTherapist
//                   ? updateTherapist.isPending
//                   : createTherapist.isPending
//               }
//             />
//           </DialogContent>
//         </Dialog>
//       </div>
//     </ErrorBoundary>
//   );
// }
//ALL ABOVE CODE IS WORKING AND SAVED ON GITHUB

import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
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
import {
  getInitials,
  capitalize,
  formatDateTime,
  formatDate,
} from "@/lib/utils";
import {
  Plus,
  Users,
  MessageSquare,
  CalendarDays,
  Trash2,
  Pencil,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { INQUIRY_STATUS_LABELS } from "@/lib/constants";

// ── Appointment status badge helper ──────────────────────────────────────────
function ConfirmationBadge({ status }: { status: string }) {
  if (status === "accepted")
    return <Badge variant="success">Therapist Confirmed</Badge>;
  if (status === "rejected")
    return <Badge variant="destructive">Therapist Declined</Badge>;
  return (
    <Badge variant="warning" className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      Awaiting Therapist
    </Badge>
  );
}

export default function AdminPage() {
  const {
    inquiries,
    appointments,
    therapists,
    isLoadingInquiries,
    isLoadingAppointments,
    isLoadingTherapists,
    createTherapist,
    updateTherapist,
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

  const handleUpsert = (data: any) => {
    if (editingTherapist) {
      updateTherapist.mutate(
        { ...data, id: editingTherapist.id },
        { onSuccess: closeForm },
      );
    } else {
      createTherapist.mutate(data, { onSuccess: closeForm });
    }
  };

  const pendingCount = appointments.filter(
    (a) => a.confirmation_status === "pending",
  ).length;
  const scheduledCount = appointments.filter(
    (a) => a.confirmation_status === "accepted",
  ).length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-muted/20">
        <Navbar />
        <main className="container py-8 max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage therapists, patient inquiries, and appointments.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              {
                icon: MessageSquare,
                label: "Total inquiries",
                value: inquiries.length,
                color: "text-blue-500",
              },
              {
                icon: Clock,
                label: "Pending confirmation",
                value: pendingCount,
                color: "text-amber-500",
              },
              {
                icon: CalendarDays,
                label: "Confirmed sessions",
                value: scheduledCount,
                color: "text-green-500",
              },
              {
                icon: Users,
                label: "Active therapists",
                value: therapists.filter((t) => t.is_active).length,
                color: "text-purple-500",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="bg-background rounded-lg border p-4 flex items-center gap-3"
              >
                <Icon className={`h-8 w-8 ${color} opacity-70 shrink-0`} />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <Tabs defaultValue="appointments">
            <TabsList className="mb-4">
              <TabsTrigger value="appointments">
                Appointments
                {pendingCount > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
              <TabsTrigger value="therapists">Therapists</TabsTrigger>
            </TabsList>

            {/* ── APPOINTMENTS TAB ─────────────────────────────────────── */}
            <TabsContent value="appointments">
              {isLoadingAppointments ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No appointments yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Patient
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Therapist
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Date & Time
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Duration
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Google Cal
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((apt) => {
                        const start = new Date(apt.start_time);
                        const end = new Date(apt.end_time);
                        const mins = Math.round(
                          (end.getTime() - start.getTime()) / 60000,
                        );
                        return (
                          <tr
                            key={apt.id}
                            className="border-b hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-sm">
                                {apt.patient?.full_name ?? "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {apt.patient?.email ?? ""}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              {apt.therapist?.name ?? "—"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-sm">
                                {formatDate(apt.start_time)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {start.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {mins} min
                            </td>
                            <td className="px-4 py-3">
                              {apt.google_calendar_event_id ? (
                                <Badge
                                  variant="success"
                                  className="text-xs flex items-center gap-1 w-fit"
                                >
                                  <Calendar className="h-3 w-3" />
                                  Event created
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Not linked
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <ConfirmationBadge
                                status={apt.confirmation_status ?? "pending"}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── INQUIRIES TAB ────────────────────────────────────────── */}
            <TabsContent value="inquiries">
              {isLoadingInquiries ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No inquiries yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Patient
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Problem described
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Specialty needed
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Insurance
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Matched therapist
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((inq) => (
                        <tr
                          key={inq.id}
                          className="border-b hover:bg-muted/30 transition-colors align-top"
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(inq.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm">
                              {inq.patient?.full_name ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {inq.patient?.email ?? ""}
                            </p>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="text-sm line-clamp-2 text-muted-foreground">
                              {inq.problem_description ?? "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {inq.extracted_specialty ? (
                              <Badge variant="secondary" className="text-xs">
                                {capitalize(inq.extracted_specialty)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-sm">
                            {inq.insurance_info
                              ? capitalize(inq.insurance_info)
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {inq.therapist ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  {inq.therapist.photo_url && (
                                    <AvatarFallback className="text-xs">
                                      {getInitials(inq.therapist.name)}
                                    </AvatarFallback>
                                  )}
                                  <AvatarFallback className="text-xs">
                                    {getInitials(inq.therapist.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {inq.therapist.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Not matched
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                inq.status === "scheduled"
                                  ? "success"
                                  : inq.status === "failed"
                                    ? "destructive"
                                    : inq.status === "cancelled"
                                      ? "outline"
                                      : "secondary"
                              }
                              className="text-xs"
                            >
                              {INQUIRY_STATUS_LABELS[inq.status] ?? inq.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── THERAPISTS TAB ───────────────────────────────────────── */}
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
                        {t.photo_url && (
                          <AvatarFallback>{getInitials(t.name)}</AvatarFallback>
                        )}
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
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteTherapist.mutate(t.id)}
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
              loading={
                editingTherapist
                  ? updateTherapist.isPending
                  : createTherapist.isPending
              }
            />
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}
