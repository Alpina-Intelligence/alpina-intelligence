import type { Meta, StoryObj } from "@storybook/react-vite";
import { BlogPostCard } from "./BlogPostCard";

const meta = {
  title: "Blog/BlogPostCard",
  component: BlogPostCard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof BlogPostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Introducing Alpina Intelligence",
    date: "2026-04-03",
    description:
      "Our first transmission — an overview of the platform architecture and what we are building.",
    tags: ["announcement", "platform", "analytics"],
  },
};

export const SingleTag: Story = {
  args: {
    title: "Sync Engine Deep Dive",
    date: "2026-04-10",
    description:
      "How we built a real-time data pipeline that ingests NHL stats and keeps everything in sync.",
    tags: ["engineering"],
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "Advanced Hockey Analytics: Using Expected Goals Models to Predict Season Outcomes",
    date: "2026-04-17",
    description:
      "A technical breakdown of our xG model — the data sources, feature engineering, and validation methodology behind our predictions.",
    tags: ["analytics", "machine-learning", "methodology"],
  },
};

export const NoTags: Story = {
  args: {
    title: "Quick Update",
    date: "2026-05-01",
    description: "A short status update on recent platform changes.",
    tags: [],
  },
};
