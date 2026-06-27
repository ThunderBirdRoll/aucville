import { sendEmail } from "../../lib/sendEmail";

export async function GET(request) {
  try {
    console.log("Cron running:", new Date().toISOString());

    await sendEmail({
      to: "am0774904@gmail.com",
      subject: "Vercel Cron Test",
      html: `
        <h2>Cron Working ✅</h2>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });

    return Response.json({
      success: true,
      message: "Email sent successfully",
      time: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Cron error:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}