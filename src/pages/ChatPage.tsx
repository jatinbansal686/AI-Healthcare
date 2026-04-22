import Navbar from '@/components/shared/Navbar'
import ChatWindow from '@/components/chat/ChatWindow'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <main className="flex-1 overflow-hidden container max-w-2xl mx-auto py-4 px-4">
          <div className="h-full border rounded-xl overflow-hidden shadow-sm bg-background flex flex-col">
            <ChatWindow />
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}