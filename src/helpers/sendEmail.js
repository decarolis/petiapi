const nodemailer = require('nodemailer');
const { google } = require('googleapis');

module.exports = async (email, subject, text) => {
  try {
    // OAuth2 Authentication
    const { OAuth2 } = google.auth;
    const oAuth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.SECRET_KEY,
      process.env.REDIRECT_URI,
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken = oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: Number(process.env.EMAIL_PORT),
      secure: Boolean(process.env.SECURE),
      logger: false,
      debug: false,
      auth: {
        type: 'OAuth2',
        user: process.env.USER_EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.SECRET_KEY,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject,
      text,
    });
    return console.log('email sent successfully');
  } catch (error) {
    console.log('email not sent!');
    console.log(error);
    return error;
  }
};
