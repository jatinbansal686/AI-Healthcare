import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      )
    }
    return this.props.children
  }
}