import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Therapist } from '@/types'
import { SPECIALTIES, INSURANCE_PROVIDERS, LANGUAGES, GENDER_OPTIONS } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  bio:      z.string().optional(),
  photo_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  gender:   z.enum(['male', 'female', 'non-binary', 'prefer_not_to_say']),
})
type FormValues = z.infer<typeof schema>

interface Props { therapist: Therapist; onSaved: () => void }

export default function ProfileForm({ therapist, onSaved }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [specialties, setSpecialties] = useState<string[]>(therapist.specialties)
  const [insurance, setInsurance]     = useState<string[]>(therapist.accepted_insurance)
  const [languages, setLanguages]     = useState<string[]>(therapist.languages)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bio: therapist.bio ?? '', photo_url: therapist.photo_url ?? '', gender: therapist.gender },
  })

  const toggle = (arr: string[], setArr: (a: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('therapists').update({
        ...values, specialties, accepted_insurance: insurance, languages,
      }).eq('id', therapist.id)
      if (error) throw error
      toast({ title: 'Profile updated!' })
      onSaved()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Textarea {...register('bio')} rows={4} placeholder="Describe your background and approach…" />
      </div>

      <div className="space-y-1.5">
        <Label>Profile photo URL</Label>
        <Input type="url" {...register('photo_url')} placeholder="https://…" />
        {errors.photo_url && <p className="text-xs text-destructive">{errors.photo_url.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Gender</Label>
        <Controller name="gender" control={control} render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>

      <div className="space-y-2">
        <Label>Specialties</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <button key={s} type="button" onClick={() => toggle(specialties, setSpecialties, s)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${specialties.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
              {capitalize(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Accepted Insurance</Label>
        <div className="flex flex-wrap gap-2">
          {INSURANCE_PROVIDERS.map((ins) => (
            <button key={ins} type="button" onClick={() => toggle(insurance, setInsurance, ins)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${insurance.includes(ins) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
              {capitalize(ins)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button key={lang} type="button" onClick={() => toggle(languages, setLanguages, lang)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${languages.includes(lang) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
              {lang}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Save profile
      </Button>
    </form>
  )
}