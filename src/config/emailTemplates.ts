export const forgotPasswordTemplate = (otp: string) => {
  return `
    
    <p>You requested to reset your password. Here is your OTP: <strong>${otp}</strong></p>
    <p>This OTP will expire in 15 minutes. If you did not request this, please ignore this email.</p>
    <p>Thank you!</p>
  `;
};

export const verifyAccountTemplate = (verificationToken: string) => {
  return `
    <h1>Verify Your Account</h1>
    <p>Click the link below to verify your account:</p>
    <a href="${process.env.FRONTEND_URL}/verify-account?token=${verificationToken}">Verify Account</a>
  `;
};
