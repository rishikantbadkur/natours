const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email,
    this.firstName = user.name.split(' ')[0],
    this.from = `Rishikant Badkur <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      console.log('prod mode');
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        }
      })
    }
console.log('dev mode');
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // Render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
      }
    );

    // Define mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // create a transport and send the actual mail
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family');
  }

  async sendPawwordReset() {
    await this.send(
      'passwordReset',
      'Your password reset link. (valid only for 10 minutes)'
    );
  }
};

/* const sendEmail = async (options) => {
  //1 Create a transporter
  // Transporter in gmail
  /*const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // Activate less secure app in gmail.

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // 2 Define the email options
  const mailOptions = {
    from: 'Rishikant Badkur <rishi01badkur.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3 Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;*/
