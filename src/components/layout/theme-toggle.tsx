import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '../ui/button'
import { setTheme, type Theme } from '@/lib/theme'

export function ThemeToggle() {
  // Initialise from what the FOUC script already applied to <html>.
  const [theme, setThemeState] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Đổi giao diện sáng/tối"
      title={theme === 'dark' ? 'Chuyển sáng' : 'Chuyển tối'}
    >
      {theme === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  )
}
