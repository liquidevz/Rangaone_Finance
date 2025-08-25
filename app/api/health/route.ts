export const dynamic = 'force-static';

export async function GET() {
  const deploymentInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    uptime: process.uptime()
  }
  
  return Response.json(deploymentInfo)
}