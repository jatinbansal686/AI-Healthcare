import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <Heart className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  )
}