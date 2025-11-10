import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Terminal as TerminalIcon,
} from 'lucide-react'
import { useId, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'

export const Route = createFileRoute('/')({
  component: Home,
})

const chartData = [
  { month: 'Jan', value: 186, revenue: 80 },
  { month: 'Feb', value: 305, revenue: 200 },
  { month: 'Mar', value: 237, revenue: 120 },
  { month: 'Apr', value: 73, revenue: 190 },
  { month: 'May', value: 209, revenue: 130 },
  { month: 'Jun', value: 214, revenue: 140 },
]

const chartConfig = {
  value: {
    label: 'Value',
    color: 'oklch(0.75 0.20 145)', // Terminal green
  },
  revenue: {
    label: 'Revenue',
    color: 'oklch(0.75 0.20 145)', // Terminal green
  },
}

function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [progress, setProgress] = useState(60)

  // Generate unique IDs for form fields
  const emailId = useId()
  const passwordId = useId()
  const termsId = useId()
  const notificationsId = useId()
  const marketingId = useId()
  const darkModeId = useId()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">shadcn/ui Theme Showcase</h1>
          <p className="text-lg text-muted-foreground">
            Explore how different themes style components
          </p>
          <ThemeSwitcher />
        </div>

        {/* Alerts Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Alerts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                This is an informational alert message.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Something went wrong with your request.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Forms Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Form Components</h2>
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={emailId}>Email</Label>
                <Input id={emailId} type="email" placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={passwordId}>Password</Label>
                <Input id={passwordId} type="password" placeholder="••••••••" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id={termsId} />
                <Label htmlFor={termsId} className="text-sm font-normal">
                  I agree to the terms and conditions
                </Label>
              </div>
              <Button className="w-full">Create Account</Button>
            </CardContent>
          </Card>
        </section>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </section>

        {/* Progress & Switch Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Interactive Components</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
                <CardDescription>Upload progress: {progress}%</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                  >
                    Decrease
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    Increase
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Switches</CardTitle>
                <CardDescription>Toggle settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={notificationsId}>Enable notifications</Label>
                  <Switch id={notificationsId} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={marketingId}>Marketing emails</Label>
                  <Switch id={marketingId} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={darkModeId}>Dark mode</Label>
                  <Switch id={darkModeId} />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Calendar Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Calendar</h2>
          <Card className="w-fit">
            <CardHeader>
              <CardTitle>Pick a Date</CardTitle>
              <CardDescription>
                Selected: {date?.toLocaleDateString() || 'None'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </section>

        {/* Charts Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Charts</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bar Chart</CardTitle>
                <CardDescription>Monthly values</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Line Chart</CardTitle>
                <CardDescription>Revenue trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cards Grid */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">Cards</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is a sample card demonstrating the styling.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Success
                </CardTitle>
                <CardDescription>Operation completed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your changes have been saved successfully.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TerminalIcon className="h-5 w-5" />
                  Terminal
                </CardTitle>
                <CardDescription>Command line interface</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-mono">
                  $ npm install @shadcn/ui
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
