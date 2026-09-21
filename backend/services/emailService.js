import nodemailer from "nodemailer";

const requiredEmailVariables = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
  "CLIENT_URL"
];

const getEmailConfig = () => {
  const missing = requiredEmailVariables.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Password reset email is not configured. Missing environment variables: ${missing.join(", ")}`);
  }

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Password reset email is not configured. SMTP_PORT must be a valid port number.");
  }

  return { port };
};

export const sendPasswordResetEmail = async ({ email, name, token }) => {
  const { port } = getEmailConfig();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  const resetUrl = `${process.env.CLIENT_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your ReliefGrid password",
    text: `Hello${name ? ` ${name}` : ""},\n\nUse this link to reset your ReliefGrid password:\n${resetUrl}\n\nThis link expires in 15 minutes and can be used only once. If you did not request this, you can ignore this email.`,
    html: `<p>Hello${name ? ` ${name}` : ""},</p><p>Use the link below to reset your ReliefGrid password:</p><p><a href="${resetUrl}">Reset your ReliefGrid password</a></p><p>This link expires in 15 minutes and can be used only once. If you did not request this, you can ignore this email.</p>`
  });
};
