export const dynamic = 'force-static';

export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}