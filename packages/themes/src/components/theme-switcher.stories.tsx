import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { ThemeSwitcher } from './theme-switcher'

const meta = {
  title: 'Themes/ThemeSwitcher',
  component: ThemeSwitcher,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeSwitcher>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default theme switcher with all three theme options
 */
export const Default: Story = {}

/**
 * Test theme switching functionality
 * This story demonstrates interaction testing with the theme switcher
 */
export const InteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Find all theme buttons
    const lightBtn = canvas.getByRole('button', { name: /light/i })
    const darkBtn = canvas.getByRole('button', { name: /dark/i })
    const purpleBtn = canvas.getByRole('button', { name: /purple/i })

    // Verify all buttons are present
    await expect(lightBtn).toBeInTheDocument()
    await expect(darkBtn).toBeInTheDocument()
    await expect(purpleBtn).toBeInTheDocument()

    // Test clicking dark theme
    await userEvent.click(darkBtn)
    // Note: DOM class changes happen on document.documentElement
    // In a real app, you'd verify the theme state or visual changes

    // Test clicking purple theme
    await userEvent.click(purpleBtn)

    // Test clicking back to light theme
    await userEvent.click(lightBtn)
  },
}

/**
 * Visual example showing the theme switcher in a card
 */
export const InCard: Story = {
  decorators: [
    (Story) => (
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">Choose Your Theme</h3>
        <Story />
      </div>
    ),
  ],
}
