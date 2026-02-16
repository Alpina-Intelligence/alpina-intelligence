import { Sun, Moon, Sparkles } from 'lucide-react'
import { useThemeStore } from '../store'
import './theme-switcher.css'

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="theme-switcher">
      <button
        className={`theme-button ${theme === 'light' ? 'active' : ''}`}
        onClick={() => setTheme('light')}
        aria-label="Light theme"
      >
        <Sun className="theme-icon" />
        <span>Light</span>
      </button>
      <button
        className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
        aria-label="Dark theme"
      >
        <Moon className="theme-icon" />
        <span>Dark</span>
      </button>
      <button
        className={`theme-button ${theme === 'purple' ? 'active' : ''}`}
        onClick={() => setTheme('purple')}
        aria-label="Purple theme"
      >
        <Sparkles className="theme-icon" />
        <span>Purple</span>
      </button>
    </div>
  )
}
