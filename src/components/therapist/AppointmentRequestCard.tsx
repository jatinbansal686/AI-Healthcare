import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Loader2, User } from 'lucide-react'

interface Props {
  appointment: any
  onUpdate:    () => void
}

export default function AppointmentRequestCard({ appointment, onUpdate }: Props) {
  const { toast }         = useToast()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  const handle = async (action: 'accept' | 'reject') => {
    setLoading(action)
    try {
      const newStatus = action === 'accept' ? 'accepted' : 'rejected'

      const { error } = await supabase
        .from('appointments')
        .update({
          confirmation_status: newStatus,
          ...(action === 'reject' ? { status: 'cancelled' } : {}),
        })
        .eq('id', appointment.id)

      if (error) throw error

      // Update inquiry status
      if (action === 'accept') {
        await supabase
          .from('inquiries')
          .update({ status: 'scheduled' })
          .eq('id', appointment.inquiry_id)
      } else {
        await supabase
          .from('inquiries')
          .update({ status: 'matched' })
          .eq('id', appointment.inquiry_id)
      }

      // Send notification email to patient via edge function
      await supabase.functions.invoke('notify-patient', {
        body: { appointmentId: appointment.id, action },
      })

      toast({
        title: action === 'accept' ? 'Appointment accepted' : 'Appointment declined',
        description: action === 'accept'
          ? 'The patient has been notified.'
          : 'The patient has been notified and can request another time.',
      })
      onUpdate()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  const statusConfig = {
    pending:  { label: 'Awaiting your response', variant: 'warning'  as const, icon: Clock },
    accepted: { label: 'Confirmed',              variant: 'success'  as const, icon: CheckCircle },
    rejected: { label: 'Declined',               variant: 'outline'  as const, icon: XCircle },
  }
  const cfg = statusConfig[appointment.confirmation_status as keyof typeof statusConfig]
    ?? statusConfig.pending

  return (
    <Card className={appointment.confirmation_status === 'pending' ? 'border-primary/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="font-medium text-sm truncate">
                {appointment.patient?.full_name ?? appointment.patient?.email ?? 'Patient'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(appointment.start_time)}
              <span className="mx-1">·</span>
              1 hour
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

        {/* Action buttons — only show for pending */}
        {appointment.confirmation_status === 'pending' && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handle('accept')}
              disabled={!!loading}
            >
              {loading === 'accept'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => handle('reject')}
              disabled={!!loading}
            >
              {loading === 'reject'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
              Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}