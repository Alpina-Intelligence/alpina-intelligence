import type { Preview } from '@storybook/react'
import { withThemeByClassName } from '@storybook/addon-themes'
import '../src/styles/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true, // Disable backgrounds addon since we're using theme toggle
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
        purple: 'purple-theme',
      },
      defaultTheme: 'light',
    }),
  ],
}

export default preview
