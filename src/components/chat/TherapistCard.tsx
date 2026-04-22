import { Therapist } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { capitalize, getInitials } from '@/lib/utils'
import { Globe, Shield, User } from 'lucide-react'

interface Props {
  therapist: Therapist
  onSelect: (therapist: Therapist) => void
}

export default function TherapistCard({ therapist, onSelect }: Props) {
  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            {therapist.photo_url && <AvatarImage src={therapist.photo_url} alt={therapist.name} />}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(therapist.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{therapist.name}</h3>
            {therapist.bio && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{therapist.bio}</p>
            )}

            <div className="flex flex-wrap gap-1 mt-2">
              {therapist.specialties.slice(0, 3).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {capitalize(s)}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {therapist.accepted_insurance.slice(0, 2).map(capitalize).join(', ')}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {therapist.languages.join(', ')}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {capitalize(therapist.gender)}
              </span>
            </div>
          </div>
        </div>

        <Button className="w-full mt-3" size="sm" onClick={() => onSelect(therapist)}>
          Book with {therapist.name.split(' ')[0]}
        </Button>
      </CardContent>
    </Card>
  )
}