import { HomeLanding } from "../_components/home-landing";

export default async function LangHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return <HomeLanding lang={lang} />;
}
