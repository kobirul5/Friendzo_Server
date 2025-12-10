

export const registrationOtpTemplate = (otp: number) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 30px; background: linear-gradient(135deg, #2196f3, #21cbf3); border-radius: 8px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #2196f3; font-size: 28px; text-align: center; margin-bottom: 20px;">
              Welcome to <span style="color: #ff5722;">Our Service</span> 🎉
          </h2>
          <p style="font-size: 16px; color: #333; line-height: 1.5; text-align: center;">
              Thank you for registering! Please use the following OTP code to verify your account.
          </p>
          <p style="font-size: 32px; font-weight: bold; color: #4caf50; text-align: center; margin: 20px 0;">
              ${otp}
          </p>
          <div style="text-align: center; margin-bottom: 20px;">
              <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
                  This OTP will expire in <strong>5 minutes</strong>. Please enter it on the verification page.
              </p>
              <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
                  If you did not sign up, please ignore this email.
              </p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
              <p style="font-size: 12px; color: #999; text-align: center;">
                  Best Regards,<br/>
                  <span style="font-weight: bold; color: #2196f3;">Team Support</span><br/>
                  <a href="mailto:noreply.together.io@gmail.com" style="color: #2196f3; text-decoration: none; font-weight: bold;">Contact Support</a>
              </p>
          </div>
      </div>
  </div>
`;
