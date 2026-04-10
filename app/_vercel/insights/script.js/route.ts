export function GET() {
  return new Response(
    "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };",
    {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}
