const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER, // Your email
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS  // Your app password
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || ' http://31.97.60.2:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Inventory Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #0d559e, #1e40af); width: 60px; height: 60px; border-radius: 15px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h1 style="color: #0d559e; margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Hello,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                We received a request to reset your password for your Inventory Management System account.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #0d559e, #1e40af); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(13, 85, 158, 0.3);">
                Reset Password
              </a>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">
                <strong>Important:</strong>
              </p>
              <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>For security, never share this link with anyone</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #0d559e; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (email) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Successful - Inventory Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); width: 60px; height: 60px; border-radius: 15px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 style="color: #10b981; margin: 0; font-size: 28px;">Password Reset Successful</h1>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Hello,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                Your password has been successfully reset for your Inventory Management System account.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="color: #065f46; font-size: 14px; margin: 0;">
                <strong>✓ Password Reset Complete</strong><br>
                You can now log in to your account using your new password.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                If you didn't make this change, please contact support immediately.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    throw new Error('Failed to send password reset confirmation email');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};
