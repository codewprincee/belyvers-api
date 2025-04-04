import transporter from '../config/nodemailerConfig';
import { forgotPasswordTemplate, verifyAccountTemplate } from '../config/emailTemplates';

export const sendForgotPasswordEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to,
    subject: 'Reset Your Password',
    html: forgotPasswordTemplate(otp),
  };

  await transporter.sendMail(mailOptions);
};

export const sendVerifyAccountEmail = async (to: string, verificationToken: string) => {
  const mailOptions = {
    from: 'hello@voizo.app',
    to,
    subject: 'Verify Your Account',
    html: verifyAccountTemplate(verificationToken),
  };

  await transporter.sendMail(mailOptions);
};
