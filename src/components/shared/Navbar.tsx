import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Heart, LogOut, User } from 'lucide-react'

export default function Navbar() {
  const { signOut } = useAuth()
  const { profile } = useAuthStore()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <Heart className="h-5 w-5 fill-primary" />
          <span>HealthScheduler</span>
        </Link>

        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile.full_name ?? profile.email}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}