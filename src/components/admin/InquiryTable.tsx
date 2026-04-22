import { Inquiry } from '@/types'
import { Badge } from '@/components/ui/badge'
import { capitalize, formatDateTime } from '@/lib/utils'
import { INQUIRY_STATUS_LABELS } from '@/lib/constants'

const statusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  pending:          'warning',
  matched:          'secondary',
  awaiting_booking: 'secondary',
  scheduled:        'success',
  cancelled:        'outline',
  failed:           'destructive',
}

interface Props { inquiries: Inquiry[] }

export default function InquiryTable({ inquiries }: Props) {
  if (!inquiries.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No inquiries yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Problem</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Specialty</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Insurance</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Therapist</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inq) => (
            <tr key={inq.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {formatDateTime(inq.created_at)}
              </td>
              <td className="px-4 py-3 max-w-[200px]">
                <p className="truncate">{inq.problem_description}</p>
              </td>
              <td className="px-4 py-3">
                {inq.extracted_specialty ? (
                  <Badge variant="secondary">{capitalize(inq.extracted_specialty)}</Badge>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {inq.insurance_info ? capitalize(inq.insurance_info) : '—'}
              </td>
              <td className="px-4 py-3">
                {inq.therapist ? inq.therapist.name : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant[inq.status] ?? 'default'}>
                  {INQUIRY_STATUS_LABELS[inq.status] ?? inq.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}