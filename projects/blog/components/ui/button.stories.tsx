import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'mgs', 'mgs-tactical', 'mgs-alert'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'mgs', 'mgs-compact'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Button',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Button',
  },
};

export const Icon: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: '🚀',
  },
};

// MGS Theme Stories
export const MGSBasic: Story = {
  args: {
    variant: 'mgs',
    size: 'mgs',
    children: 'INFILTRATE',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const MGSTactical: Story = {
  args: {
    variant: 'mgs-tactical',
    size: 'mgs',
    children: 'TACTICAL ESPIONAGE',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const MGSAlert: Story = {
  args: {
    variant: 'mgs-alert',
    size: 'mgs',
    children: 'ALERT STATUS',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const MGSCompact: Story = {
  args: {
    variant: 'mgs',
    size: 'mgs-compact',
    children: 'CODEC',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const MGSShowcase: Story = {
  render: () => (
    <div className="mgs-theme mgs-grid min-h-screen p-8 space-y-4">
      <div className="mgs-scanlines absolute inset-0 pointer-events-none" />
      <h2 className="text-mgs-teal font-tactical text-2xl mb-8 mgs-glitch">
        METAL GEAR SOLID UI THEME
      </h2>
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <Button variant="mgs" size="mgs">VR TRAINING</Button>
          <Button variant="mgs-tactical" size="mgs">SNEAKING MODE</Button>
          <Button variant="mgs-alert" size="mgs">NO WEAPON</Button>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Button variant="mgs" size="mgs-compact">LEVEL 14</Button>
          <Button variant="mgs" size="mgs-compact">LEVEL 15</Button>
          <Button variant="mgs" size="mgs-compact">LEVEL 01</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};