// lib/sendEmail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html, attachments }) {
  try {
    const mailOptions = {
      from: `"Aucville" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // Make sure attachment content is always a real Buffer (not a base64 string)
    // — this is what makes attachments actually show up in Gmail.
    if (attachments?.length) {
      mailOptions.attachments = attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content, "base64"),
        contentType: a.contentType || "application/octet-stream",
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    return info;

  } catch (err) {
    console.error("sendEmail error:", err.message);
    throw err;
  }
}