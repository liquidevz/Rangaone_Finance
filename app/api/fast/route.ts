export const runtime = 'edge';

export async function GET() {
  return Response.json({ status: 'ok', timestamp: Date.now() }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  });
}

export async function POST(req: Request) {
  const data = await req.json();
  return Response.json({ success: true, data }, { 
    headers: { 'Cache-Control': 'no-store' }
  });
}
