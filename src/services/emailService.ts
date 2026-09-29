import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // 1. Sanidi Usafirishaji (Transporter) kupitia SMTP ya Seva
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 2525,
      secure: process.env.SMTP_PORT === '465', // True kama inatumia SSL (Port 465)
      auth: {
        user: process.env.SMTP_EMAIL || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });

    // 2. Tengeneza muundo wa HTML wenye mvuto endapo haukuletwa moja kwa moja
    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; background-color: #f4f4f7; border-radius: 8px; max-width: 600px; margin: auto;">
        <h2 style="color: #4F46E5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Taarifa kutoka Mfumo</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #374151;">${options.message}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Ujumbe huu umentumwa kiotomatiki na Mfumo wetu. Tafadhali usijibu barua pepe hii.</p>
      </div>
    `;

    // 3. Andaa taarifa za ujumbe wa barua pepe
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Backend API Support'}" <${process.env.FROM_EMAIL || 'noreply@backendapi.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || defaultHtml,
    };

    // 4. Tuma barua pepe rasmi na uhakikishe
    const info = await transporter.sendMail(mailOptions);
    console.log('Barua pepe imetumwa kwa mafanikio: %s', info.messageId);
    
  } catch (error: any) {
    console.error('Kosa limetokea wakati wa kutuma barua pepe:', error.message);
    throw new Error(`Imeshindwa kutuma barua pepe: ${error.message}`);
  }
};
