import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'mgs', 'mgs-tactical', 'mgs-data', 'mgs-grid'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const MGSBasic: Story = {
  render: () => (
    <Card variant="mgs" className="w-[350px]">
      <CardHeader>
        <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider">
          CODEC COMMUNICATION
        </CardTitle>
        <CardDescription className="text-mgs-teal/70 font-mono text-xs">
          INCOMING TRANSMISSION...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-mgs-teal/90 font-mono text-sm">
          Snake, this is Colonel Campbell. Your mission is to infiltrate the enemy base and retrieve the Metal Gear data.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="mgs" size="mgs-compact">ROGER</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const MGSTactical: Story = {
  render: () => (
    <Card variant="mgs-tactical" className="w-[400px]">
      <CardHeader>
        <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider">
          TACTICAL ESPIONAGE ACTION
        </CardTitle>
        <CardDescription className="text-mgs-orange font-mono text-xs">
          VR TRAINING MODE
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="text-mgs-teal/70">SNEAKING:</div>
          <div className="text-mgs-teal">ACTIVE</div>
          <div className="text-mgs-teal/70">WEAPON:</div>
          <div className="text-mgs-orange">SOCOM</div>
          <div className="text-mgs-teal/70">ALERT:</div>
          <div className="text-mgs-teal">NORMAL</div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="mgs" size="mgs-compact">START</Button>
        <Button variant="mgs-alert" size="mgs-compact">ABORT</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const MGSData: Story = {
  render: () => (
    <Card variant="mgs-data" className="w-[350px]">
      <CardHeader>
        <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider">
          DATA TRANSFER
        </CardTitle>
        <CardDescription className="text-mgs-teal/70 font-mono text-xs">
          UPLOADING TO CODEC...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between text-mgs-teal/70">
            <span>PROGRESS:</span>
            <span className="text-mgs-teal">78%</span>
          </div>
          <div className="w-full bg-mgs-dark-800 rounded-full h-2">
            <div className="bg-mgs-teal h-2 rounded-full w-3/4 animate-pulse"></div>
          </div>
          <div className="text-mgs-teal/50 text-xs">
            Transferring classified documents...
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const MGSGrid: Story = {
  render: () => (
    <Card variant="mgs-grid" className="w-[350px]">
      <CardHeader>
        <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider">
          MISSION BRIEFING
        </CardTitle>
        <CardDescription className="text-mgs-orange font-mono text-xs">
          OPERATION: SHADOW MOSES
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 font-mono text-xs text-mgs-teal/90">
          <p>OBJECTIVE: Neutralize terrorist threat</p>
          <p>LOCATION: Shadow Moses Island</p>
          <p>ESTIMATED TIME: 0600 HOURS</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="mgs-tactical" size="mgs">DEPLOY</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const MGSShowcase: Story = {
  render: () => (
    <div className="mgs-theme mgs-grid min-h-screen p-8">
      <div className="mgs-scanlines absolute inset-0 pointer-events-none" />
      <div className="max-w-6xl mx-auto space-y-8">
        <h2 className="text-mgs-teal font-tactical text-3xl mb-12 mgs-glitch text-center">
          TACTICAL ESPIONAGE INTERFACE
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="mgs" className="w-full">
            <CardHeader>
              <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider text-sm">
                CODEC LINK
              </CardTitle>
              <CardDescription className="text-mgs-teal/70 font-mono text-xs">
                140.85 MHz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-mgs-teal/90 font-mono text-xs">
                Otacon here. The guard patterns have changed. Be careful, Snake.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="mgs" size="mgs-compact">RESPOND</Button>
            </CardFooter>
          </Card>

          <Card variant="mgs-tactical" className="w-full">
            <CardHeader>
              <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider text-sm">
                WEAPON STATUS
              </CardTitle>
              <CardDescription className="text-mgs-orange font-mono text-xs">
                EQUIPPED
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-mgs-teal/70">SOCOM:</span>
                  <span className="text-mgs-teal">12/12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mgs-teal/70">CHAFF G:</span>
                  <span className="text-mgs-teal">3</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="mgs-alert" size="mgs-compact">RELOAD</Button>
            </CardFooter>
          </Card>

          <Card variant="mgs-data" className="w-full">
            <CardHeader>
              <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider text-sm">
                SYSTEM STATUS
              </CardTitle>
              <CardDescription className="text-mgs-teal/70 font-mono text-xs">
                ALL SYSTEMS NOMINAL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-xs">
                <div className="text-mgs-teal/70">HEALTH: 100%</div>
                <div className="text-mgs-teal/70">STAMINA: 85%</div>
                <div className="text-mgs-teal/70">ALERT: NORMAL</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};