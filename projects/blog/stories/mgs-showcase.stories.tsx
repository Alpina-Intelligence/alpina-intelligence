import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Quote } from '@/components/ui/quote';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { PostCard } from '@/components/blog/post-card';
import { ArticleHeader } from '@/components/blog/article-header';
import { AuthorBio } from '@/components/blog/author-bio';

const meta = {
  title: 'MGS Theme/Complete Showcase',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
const sampleAuthor = {
  name: "Solid Snake",
  avatar: "/api/placeholder/100/100",
  bio: "Legendary soldier and tactical espionage expert",
  title: "Special Operations Agent",
  company: "FOXHOUND",
  website: "https://example.com",
  social: {
    twitter: "https://twitter.com/example",
    github: "https://github.com/example",
  }
};

const samplePosts = [
  {
    href: "/posts/tactical-espionage",
    title: "Tactical Espionage Action: A Guide to Stealth Operations",
    excerpt: "Master the art of infiltration with advanced techniques used by special forces around the world.",
    publishedAt: "2024-01-15",
    readingTime: "8 min",
    tags: ["Tactics", "Stealth", "Operations"],
    author: sampleAuthor,
    featured: true,
  },
  {
    href: "/posts/codec-technology",
    title: "CODEC Communication Systems",
    excerpt: "Understanding advanced communication protocols in hostile environments.",
    publishedAt: "2024-01-10",
    readingTime: "5 min",
    tags: ["Technology", "Communication"],
    author: sampleAuthor,
  },
  {
    href: "/posts/shadow-moses",
    title: "Shadow Moses Incident: Lessons Learned",
    excerpt: "A retrospective analysis of the Shadow Moses Island incident and its implications.",
    publishedAt: "2024-01-05",
    readingTime: "12 min",
    tags: ["History", "Analysis", "Security"],
    author: sampleAuthor,
  }
];

const navigation = [
  { href: "/", label: "Home", active: true },
  { href: "/posts", label: "Posts" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const sidebarSections = [
  {
    title: "Navigation",
    items: [
      { href: "/", label: "Home", active: true },
      { href: "/posts", label: "All Posts" },
      { href: "/categories", label: "Categories" },
      { href: "/tags", label: "Tags" },
    ]
  },
  {
    title: "Recent Posts",
    items: [
      { href: "/posts/1", label: "Tactical Espionage", badge: "NEW" },
      { href: "/posts/2", label: "CODEC Systems" },
      { href: "/posts/3", label: "Shadow Moses" },
    ]
  }
];

export const CompleteInterface: Story = {
  render: () => (
    <div className="mgs-theme min-h-screen bg-mgs-dark-900">
      <div className="mgs-grid absolute inset-0 opacity-30" />
      <div className="mgs-scanlines absolute inset-0 pointer-events-none" />

      {/* Header */}
      <Header
        variant="mgs-tactical"
        logo={
          <Heading variant="mgs" size="h5">
            TACTICAL BLOG
          </Heading>
        }
        navigation={navigation}
        actions={
          <div className="flex items-center gap-2">
            <Input
              variant="mgs"
              placeholder="SEARCH..."
              className="w-40"
            />
            <Button variant="mgs" size="mgs-compact">
              LOGIN
            </Button>
          </div>
        }
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          variant="mgs-tactical"
          sections={sidebarSections}
          header={
            <div className="space-y-2">
              <Heading variant="mgs-terminal" size="h6">
                MISSION CONTROL
              </Heading>
              <Text variant="mgs-muted" size="xs">
                TACTICAL BLOG SYSTEM v2.0
              </Text>
            </div>
          }
          footer={
            <div className="space-y-2">
              <Text variant="mgs-muted" size="xs">
                STATUS: ONLINE
              </Text>
              <div className="flex gap-1">
                <Badge variant="mgs-new">LIVE</Badge>
                <Badge variant="mgs">SECURE</Badge>
              </div>
            </div>
          }
        />

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Hero Section */}
            <section className="text-center space-y-6">
              <Heading variant="mgs" size="h1" className="mgs-glitch">
                TACTICAL ESPIONAGE BLOG
              </Heading>
              <Text variant="mgs" size="lg">
                Classified intelligence reports and operational briefings
              </Text>
              <div className="flex justify-center gap-4">
                <Button variant="mgs-tactical" size="mgs">
                  START MISSION
                </Button>
                <Button variant="mgs-alert" size="mgs">
                  EMERGENCY PROTOCOL
                </Button>
              </div>
            </section>

            {/* Featured Quote */}
            <Quote
              variant="mgs-codec"
              author="Colonel Campbell"
              cite="MGS1"
            >
              Snake, we're not tools of the government or anyone else. Fighting was the only thing I was good at, but at least I always fought for what I believed in.
            </Quote>

            {/* Components Showcase */}
            <section className="space-y-8">
              <Heading variant="mgs-terminal" size="h2">
                SYSTEM COMPONENTS
              </Heading>

              {/* Typography Examples */}
              <Card variant="mgs-tactical">
                <CardHeader>
                  <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider">
                    Typography System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Text variant="mgs-muted" size="xs">HEADINGS:</Text>
                      <Heading variant="mgs-terminal" size="h3">H3 Terminal</Heading>
                      <Heading variant="mgs" size="h4">H4 Glitch</Heading>
                      <Heading variant="mgs-alert" size="h5">H5 Alert</Heading>
                    </div>
                    <div>
                      <Text variant="mgs-muted" size="xs">TEXT VARIANTS:</Text>
                      <Text variant="mgs">MGS Terminal Text</Text>
                      <Text variant="mgs-muted">MGS Muted Text</Text>
                      <Text variant="mgs-alert">MGS Alert Text</Text>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interactive Elements */}
              <Card variant="mgs-data">
                <CardHeader>
                  <CardTitle className="text-mgs-teal font-mono uppercase tracking-wider">
                    Interactive Elements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Text variant="mgs-muted" size="xs">BUTTONS:</Text>
                      <div className="space-y-2">
                        <Button variant="mgs" size="mgs-compact" className="w-full">
                          MGS Basic
                        </Button>
                        <Button variant="mgs-tactical" size="mgs-compact" className="w-full">
                          MGS Tactical
                        </Button>
                        <Button variant="mgs-alert" size="mgs-compact" className="w-full">
                          MGS Alert
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Text variant="mgs-muted" size="xs">BADGES:</Text>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="mgs">MGS</Badge>
                        <Badge variant="mgs-alert">ALERT</Badge>
                        <Badge variant="mgs-new">NEW</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Text variant="mgs-muted" size="xs">AVATARS:</Text>
                      <div className="flex gap-2">
                        <Avatar variant="mgs" size="sm">
                          <AvatarFallback variant="mgs">SS</AvatarFallback>
                        </Avatar>
                        <Avatar variant="mgs" size="default">
                          <AvatarFallback variant="mgs">OC</AvatarFallback>
                        </Avatar>
                        <Avatar variant="mgs-alert" size="lg">
                          <AvatarFallback variant="mgs-alert">GR</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Text variant="mgs-muted" size="xs">FORM INPUTS:</Text>
                    <div className="grid grid-cols-2 gap-4">
                      <Input variant="mgs" placeholder="MGS Terminal Input" />
                      <Input variant="mgs-alert" placeholder="Alert Input" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Blog Posts Grid */}
            <section className="space-y-6">
              <Heading variant="mgs-terminal" size="h2">
                MISSION REPORTS
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {samplePosts.map((post, index) => (
                  <PostCard
                    key={index}
                    variant={post.featured ? "mgs-featured" : "mgs"}
                    {...post}
                  />
                ))}
              </div>
            </section>

            {/* Article Header Example */}
            <section className="space-y-6">
              <Heading variant="mgs-terminal" size="h2">
                ARTICLE HEADER
              </Heading>
              <ArticleHeader
                variant="mgs-tactical"
                title="Operation Shadow Moses: Complete Mission Briefing"
                excerpt="A comprehensive analysis of the Shadow Moses Island incident, including tactical approaches, equipment analysis, and lessons learned from the field."
                publishedAt="January 15, 2024"
                readingTime="12 min"
                tags={["Operations", "Tactical", "Analysis", "Shadow Moses"]}
                author={sampleAuthor}
              />
            </section>

            {/* Author Bio Example */}
            <section className="space-y-6">
              <Heading variant="mgs-terminal" size="h2">
                PERSONNEL FILE
              </Heading>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AuthorBio
                  variant="mgs"
                  layout="horizontal"
                  author={sampleAuthor}
                />
                <AuthorBio
                  variant="mgs-tactical"
                  layout="vertical"
                  author={{
                    ...sampleAuthor,
                    name: "Gray Fox",
                    bio: "Cyborg ninja and former FOXHOUND member specializing in close-quarters combat.",
                  }}
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  ),
};

export const ComponentLibrary: Story = {
  render: () => (
    <div className="mgs-theme min-h-screen bg-mgs-dark-900 p-8">
      <div className="mgs-grid absolute inset-0 opacity-20" />
      <div className="max-w-6xl mx-auto space-y-12">
        <Heading variant="mgs" size="h1" className="text-center mgs-glitch">
          MGS COMPONENT LIBRARY
        </Heading>

        {/* All Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buttons */}
          <Card variant="mgs">
            <CardHeader>
              <CardTitle className="text-mgs-teal font-mono">BUTTONS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="mgs" size="mgs">MGS Basic</Button>
                <Button variant="mgs-tactical" size="mgs">MGS Tactical</Button>
                <Button variant="mgs-alert" size="mgs">MGS Alert</Button>
                <Button variant="mgs" size="mgs-compact">Compact</Button>
              </div>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card variant="mgs-tactical">
            <CardHeader>
              <CardTitle className="text-mgs-teal font-mono">CARDS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 border border-mgs-teal/30 rounded text-xs text-mgs-teal font-mono">
                  MGS Basic Card
                </div>
                <div className="p-3 border border-mgs-teal/50 rounded text-xs text-mgs-teal font-mono mgs-brackets">
                  MGS Tactical Card
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card variant="mgs-data">
            <CardHeader>
              <CardTitle className="text-mgs-teal font-mono">TYPOGRAPHY</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Heading variant="mgs-terminal" size="h4">Terminal Heading</Heading>
              <Heading variant="mgs" size="h5">Glitch Heading</Heading>
              <Text variant="mgs">MGS Terminal Text</Text>
              <Text variant="mgs-muted">MGS Muted Text</Text>
            </CardContent>
          </Card>

          {/* Forms */}
          <Card variant="mgs-grid">
            <CardHeader>
              <CardTitle className="text-mgs-teal font-mono">FORM ELEMENTS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input variant="mgs" placeholder="Terminal Input" />
              <Input variant="mgs-alert" placeholder="Alert Input" />
              <div className="flex gap-2">
                <Badge variant="mgs">MGS</Badge>
                <Badge variant="mgs-alert">Alert</Badge>
                <Badge variant="mgs-new">New</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
};