import { API_BASE_URL } from './lib/api'

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">
          TA
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          TA-HR
        </h1>
        <p className="text-muted-foreground">
          Hệ thống quản lý nhân sự &amp; tính lương
        </p>
        <p className="text-xs font-mono text-muted-foreground">
          API: {API_BASE_URL || '(proxy /api)'}
        </p>
      </div>
    </div>
  )
}

export default App
