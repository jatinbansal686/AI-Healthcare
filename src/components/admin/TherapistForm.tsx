import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Therapist } from '@/types'
import { SPECIALTIES, INSURANCE_PROVIDERS, LANGUAGES, GENDER_OPTIONS } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'
import { useState } from 'react'

const therapistSchema = z.object({
  name:              z.string().min(2, 'Name is required'),
  bio:               z.string().optional(),
  photo_url:         z.string().url('Invalid URL').optional().or(z.literal('')),
  gender:            z.enum(['male', 'female', 'non-binary', 'prefer_not_to_say']),
  google_calendar_id: z.string().optional(),
})
type TherapistFormValues = z.infer<typeof therapistSchema>

interface Props {
  therapist?: Therapist
  onSubmit: (data: Partial<Therapist>) => void
  onCancel: () => void
  loading?: boolean
}

export default function TherapistForm({ therapist, onSubmit, onCancel, loading }: Props) {
  const [specialties, setSpecialties]     = useState<string[]>(therapist?.specialties ?? [])
  const [insurance, setInsurance]         = useState<string[]>(therapist?.accepted_insurance ?? [])
  const [languages, setLanguages]         = useState<string[]>(therapist?.languages ?? ['English'])

  const { register, handleSubmit, control, formState: { errors } } = useForm<TherapistFormValues>({
    resolver: zodResolver(therapistSchema),
    defaultValues: {
      name:               therapist?.name ?? '',
      bio:                therapist?.bio ?? '',
      photo_url:          therapist?.photo_url ?? '',
      gender:             therapist?.gender ?? 'prefer_not_to_say',
      google_calendar_id: therapist?.google_calendar_id ?? '',
    },
  })

  const toggle = (arr: string[], setArr: (a: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  const handleFormSubmit = (values: TherapistFormValues) => {
    onSubmit({
      ...values,
      id:                therapist?.id,
      specialties,
      accepted_insurance: insurance,
      languages,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Gender *</Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" {...register('bio')} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="photo_url">Photo URL</Label>
        <Input id="photo_url" type="url" placeholder="https://…" {...register('photo_url')} />
        {errors.photo_url && <p className="text-xs text-destructive">{errors.photo_url.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="google_calendar_id">Google Calendar ID (email)</Label>
        <Input id="google_calendar_id" placeholder="therapist@gmail.com" {...register('google_calendar_id')} />
      </div>

      {/* Specialties */}
      <div className="space-y-2">
        <Label>Specialties *</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <button
              key={s} type="button"
              onClick={() => toggle(specialties, setSpecialties, s)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                specialties.includes(s)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:border-primary'
              }`}
            >
              {capitalize(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Insurance */}
      <div className="space-y-2">
        <Label>Accepted insurance *</Label>
        <div className="flex flex-wrap gap-2">
          {INSURANCE_PROVIDERS.map((ins) => (
            <button
              key={ins} type="button"
              onClick={() => toggle(insurance, setInsurance, ins)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                insurance.includes(ins)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:border-primary'
              }`}
            >
              {capitalize(ins)}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <Label>Languages *</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang} type="button"
              onClick={() => toggle(languages, setLanguages, lang)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                languages.includes(lang)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:border-primary'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {therapist ? 'Save changes' : 'Add therapist'}
        </Button>
      </div>
    </form>
  )
}