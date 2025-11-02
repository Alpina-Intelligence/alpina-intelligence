'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark' | 'purple'

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement

    // Remove all theme classes
    html.classList.remove('dark', 'purple-theme')

    // Apply the selected theme
    if (newTheme === 'dark') {
      html.classList.add('dark')
    } else if (newTheme === 'purple') {
      html.classList.add('purple-theme')
    }
    // 'light' uses :root (no class needed)
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        onClick={() => handleThemeChange('light')}
      >
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        onClick={() => handleThemeChange('dark')}
      >
        Dark
      </Button>
      <Button
        variant={theme === 'purple' ? 'default' : 'outline'}
        onClick={() => handleThemeChange('purple')}
      >
        Purple
      </Button>
    </div>
  )
}
