export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#164E63"/><text x="32" y="39" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">EMP</text></svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400"
    }
  });
}
