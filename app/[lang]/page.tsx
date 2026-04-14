import { PortfolioShell } from "../_components/portfolio-shell";

export default async function LangHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  await params;

  return <PortfolioShell />;
}
