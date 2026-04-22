import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GoogleOAuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error  = params.get('error')
    const success = params.get('success')

    if (error) {
      setStatus('error')
      setMessage(decodeURIComponent(error))
    } else if (success === 'true') {
      setStatus('success')
      setMessage('Your Google Calendar has been connected successfully.')
      setTimeout(() => navigate('/therapist'), 2500)
    } else {
      setStatus('error')
      setMessage('Unexpected callback state. Please try again.')
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm space-y-4">
        {status === 'loading' && <LoadingSpinner />}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold">Calendar connected!</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">Redirecting to dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Connection failed</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => navigate('/therapist')}>Back to dashboard</Button>
          </>
        )}
      </div>
    </div>
  )
}