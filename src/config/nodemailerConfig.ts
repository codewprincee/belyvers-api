import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port:2525,
 
  auth: {
    user: 'a64655d3c1a768',
    pass: 'd9447d78ab0fc8',
  },
});

export default transporter;
