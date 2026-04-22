import { Appointment } from '@/types'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/constants'
import { CalendarCheck } from 'lucide-react'

const statusVariant: Record<string, 'default' | 'success' | 'destructive' | 'outline'> = {
  confirmed:   'success',
  cancelled:   'destructive',
  rescheduled: 'default',
  no_show:     'outline',
}

interface Props { appointments: Appointment[] }

export default function AppointmentTable({ appointments }: Props) {
  if (!appointments.length) {
    return (
      <div className="py-12 text-center">
        <CalendarCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No appointments scheduled yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date & Time</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Therapist</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Duration</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Calendar</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt) => {
            const start = new Date(apt.start_time)
            const end   = new Date(apt.end_time)
            const mins  = Math.round((end.getTime() - start.getTime()) / 60000)
            return (
              <tr key={apt.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-xs">
                  {formatDateTime(apt.start_time)}
                </td>
                <td className="px-4 py-3">
                  {apt.patient?.full_name ?? apt.patient?.email ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {apt.therapist?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {mins} min
                </td>
                <td className="px-4 py-3">
                  {apt.google_calendar_event_id ? (
                    <Badge variant="success" className="text-xs">Synced</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Pending</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[apt.status] ?? 'default'}>
                    {APPOINTMENT_STATUS_LABELS[apt.status] ?? apt.status}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}