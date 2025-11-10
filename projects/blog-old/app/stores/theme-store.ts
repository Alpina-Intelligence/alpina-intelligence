import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'purple'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

/**
 * Theme store with localStorage persistence
 *
 * Manages application theme state and applies DOM changes.
 * Automatically persists theme preference to localStorage.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme: Theme) => {
        // Apply theme to DOM
        const html = document.documentElement

        // Remove all theme classes
        html.classList.remove('dark', 'purple-theme')

        // Apply the selected theme
        if (theme === 'dark') {
          html.classList.add('dark')
        } else if (theme === 'purple') {
          html.classList.add('purple-theme')
        }
        // 'light' uses :root (no class needed)

        // Update state
        set({ theme })
      },
    }),
    {
      name: 'theme-storage',
      // Reapply theme on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          const html = document.documentElement
          html.classList.remove('dark', 'purple-theme')

          if (state.theme === 'dark') {
            html.classList.add('dark')
          } else if (state.theme === 'purple') {
            html.classList.add('purple-theme')
          }
        }
      },
    }
  )
)
