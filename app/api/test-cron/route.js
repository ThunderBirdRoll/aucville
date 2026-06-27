export async function GET() {
  console.log("Cron running:", new Date().toISOString());

  return Response.json({
    success: true,
    time: new Date().toISOString()
  });
}