const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("📧 Sending OTP email...");
    console.log("📧 From:", process.env.EMAIL_USER);
    console.log("📧 To:", to);

    console.log("🔍 Verifying Gmail SMTP connection...");

    await transporter.verify();

    console.log("✅ Gmail SMTP connection verified");

    const info = await transporter.sendMail({
      from: `"AutoTest OTP" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Accepted:", info.accepted);
    console.log("📧 Rejected:", info.rejected);

    return true;

  } catch (error) {
    console.error("❌ OTP EMAIL ERROR");
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("Response:", error.response);
    console.error("Message:", error.message);

    throw error;
  }
};

module.exports = sendEmail;