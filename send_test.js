import nodemailer from "nodemailer";

async function main() {
  const transporter = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 1025,
    secure: false,
    auth: {
      user: "test",
      pass: "test",
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const info = await transporter.sendMail({
    from: '"ForgeMail Studio" <studio@forgemail.dev>',
    to: "developer@example.com",
    subject: "Welcome to ForgeMail Studio 🚀",
    text: "This is a test email to verify the new Drawer-based email inspector. High-fidelity developer tools for everyone.",
    html: `
      <div style="font-family: sans-serif; background: #0c0c0c; color: #fff; padding: 40px; border-radius: 12px; border: 1px solid #ffffff10;">
        <h1 style="color: #fff; margin-bottom: 20px;">Welcome to Studio 🚀</h1>
        <p style="color: #888; font-size: 16px; line-height: 1.5;">
          You are currently viewing this email in the brand new <b>ForgeMail Drawer</b>. 
          This high-fidelity interaction model allows you to stay focused on your inbox while performing deep analysis on the right side.
        </p>
        <div style="margin-top: 30px; padding: 20px; background: #ffffff05; border-radius: 8px; border-left: 4px solid #fff;">
          <p style="margin: 0; font-weight: bold;">Developer Note:</p>
          <p style="margin: 10px 0 0 0; color: #666;">The drawer supports device previews, source inspection, and robust header analysis.</p>
        </div>
      </div>
    `,
  });

  console.log("Message sent: %s", info.messageId);
}

main().catch(console.error);
