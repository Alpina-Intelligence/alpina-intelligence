import type { Meta, StoryObj } from "@storybook/react-vite";
import { MDXProvider } from "@mdx-js/react";
import { mdxComponents } from "./mdx-components";

function MDXProse({ children }: { children: React.ReactNode }) {
  return (
    <article className="prose-retro">
      <MDXProvider components={mdxComponents}>{children}</MDXProvider>
    </article>
  );
}

function SampleArticle() {
  const {
    h1: H1,
    h2: H2,
    h3: H3,
    p: P,
    a: A,
    ul: UL,
    ol: OL,
    li: LI,
    pre: Pre,
    code: Code,
    blockquote: Blockquote,
    hr: HR,
    strong: Strong,
    em: Em,
    table: Table,
    thead: THead,
    tr: TR,
    th: TH,
    td: TD,
  } = mdxComponents as Record<string, React.ComponentType<Record<string, unknown>>>;

  return (
    <>
      <H1>Article Title</H1>
      <P>
        This is a sample article demonstrating all the styled prose elements.
        Here is some <Strong>bold text</Strong> and some <Em>italic text</Em>,
        plus a <A href="#">link to somewhere</A>.
      </P>

      <H2>Section Heading</H2>
      <P>
        Below is an unordered list showing the terminal-style bullet markers:
      </P>
      <UL>
        <LI>Player analysis with deep statistical breakdowns</LI>
        <LI>Predictive models trained on historical data</LI>
        <LI>Strategic insights from advanced metrics</LI>
      </UL>

      <H3>Subsection Heading</H3>
      <P>And here is an ordered list:</P>
      <OL>
        <LI>First, ingest data from the NHL API</LI>
        <LI>Then, process through our statistical pipeline</LI>
        <LI>Finally, surface predictions in the UI</LI>
      </OL>

      <Blockquote>
        <P>
          The best tools are the ones that get out of your way and let you focus
          on the questions that matter.
        </P>
      </Blockquote>

      <H2>Code Example</H2>
      <Pre>
        <Code className="language-typescript">{`export const Route = createFileRoute("/analysis/$playerId")({
  loader: async ({ params }) => {
    return fetchPlayerStats(params.playerId);
  },
  component: PlayerAnalysis,
});`}</Code>
      </Pre>
      <P>
        You can also use <Code>inline code</Code> within paragraphs.
      </P>

      <H2>Data Table</H2>
      <Table>
        <THead>
          <TR>
            <TH>Metric</TH>
            <TH>Value</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <tbody>
          <TR>
            <TD>xG Model Accuracy</TD>
            <TD>94.2%</TD>
            <TD>Active</TD>
          </TR>
          <TR>
            <TD>Sync Latency</TD>
            <TD>245ms</TD>
            <TD>Nominal</TD>
          </TR>
          <TR>
            <TD>Records Processed</TD>
            <TD>1.2M</TD>
            <TD>Active</TD>
          </TR>
        </tbody>
      </Table>

      <HR />
      <P>
        <Em>Alpina Intelligence Platform v2.0 -- System Online</Em>
      </P>
    </>
  );
}

const meta = {
  title: "Blog/MDXProse",
  component: MDXProse,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof MDXProse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullArticle: Story = {
  args: {
    children: <SampleArticle />,
  },
};
