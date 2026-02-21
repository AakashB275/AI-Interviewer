import nodemailer from 'nodemailer';

// Create transporter — works with Gmail, Outlook, or any SMTP
function createTransporter() {
  // For Gmail: enable "App Passwords" in your Google account
  // (Google Account → Security → 2-Step Verification → App Passwords)
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,     // your-email@gmail.com
      pass: process.env.EMAIL_PASS      // your app password (NOT your real password)
    }
  });
}

/**
 * Send welcome/confirmation email after registration
 */
export async function sendWelcomeEmail({ to, userName }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured — skipping welcome email');
    return null;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"TrainMeAI" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to TrainMeAI! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TrainMeAI</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f8f9fa; font-family: 'Segoe UI', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 40px 40px 30px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:800; letter-spacing:-0.5px;">TrainMeAI</h1>
                    <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:15px;">AI-Powered Interview Practice</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px 40px 20px;">
                    <h2 style="color:#111827; font-size:22px; margin:0 0 16px;">Welcome aboard, ${userName}! 👋</h2>
                    <p style="color:#4b5563; font-size:15px; line-height:1.7; margin:0 0 20px;">
                      Your account has been successfully created. You're now ready to practice interviews with our AI, 
                      get real-time feedback, and build the confidence to land your dream job.
                    </p>

                    <!-- Steps -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff; border-radius:8px; padding:24px; margin-bottom:28px;">
                      <tr><td>
                        <p style="color:#1e40af; font-weight:700; margin:0 0 14px; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Get Started in 3 Steps</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:6px 0;">
                              <span style="display:inline-block; background:#2563eb; color:white; border-radius:50%; width:22px; height:22px; text-align:center; line-height:22px; font-size:12px; font-weight:700; margin-right:10px;">1</span>
                              <span style="color:#374151; font-size:14px;">Upload your resume</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0;">
                              <span style="display:inline-block; background:#2563eb; color:white; border-radius:50%; width:22px; height:22px; text-align:center; line-height:22px; font-size:12px; font-weight:700; margin-right:10px;">2</span>
                              <span style="color:#374151; font-size:14px;">Choose your target role</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0;">
                              <span style="display:inline-block; background:#2563eb; color:white; border-radius:50%; width:22px; height:22px; text-align:center; line-height:22px; font-size:12px; font-weight:700; margin-right:10px;">3</span>
                              <span style="color:#374151; font-size:14px;">Start your AI interview session</span>
                            </td>
                          </tr>
                        </table>
                      </td></tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:28px;">
                          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/home" 
                             style="display:inline-block; background:linear-gradient(135deg,#2563eb,#7c3aed); color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:8px; font-weight:700; font-size:15px; letter-spacing:0.3px;">
                            Start Practicing →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb; padding:24px 40px; border-top:1px solid #e5e7eb; text-align:center;">
                    <p style="color:#9ca3af; font-size:13px; margin:0;">
                      © 2025 TrainMeAI · You're receiving this because you signed up at TrainMeAI
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return info;
  } catch (err) {
    // Never let email failure crash registration
    console.error('Failed to send welcome email:', err.message);
    return null;
  }
}

export default { sendWelcomeEmail };