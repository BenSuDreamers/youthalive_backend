import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../utils/logger';

export interface TicketEmailData {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  invoiceNo: string;
  qrDataUrl: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;
  
  constructor() {
    this.fromEmail = config.email.fromEmail;
    this.fromName = config.email.fromName;
      // Create Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }
  
  /**
   * Send ticket confirmation email with QR code
   */
  async sendTicketEmail(ticketData: TicketEmailData): Promise<void> {
    try {
      // Convert QR code data URL to attachment
      const qrBuffer = Buffer.from(ticketData.qrDataUrl.split(',')[1], 'base64');
      
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: ticketData.to,
        subject: `Your Youth Alive Event Ticket - ${ticketData.eventTitle}`,
        html: this.generateTicketEmailHtml(ticketData),
        text: `Your registration for ${ticketData.eventTitle} is confirmed. Invoice: ${ticketData.invoiceNo}`,        attachments: [
          {
            filename: 'qrcode.png',
            content: qrBuffer,
            contentType: 'image/png',
            cid: 'qrcode', // Same cid value as referenced in the HTML
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Ticket email sent successfully', { to: ticketData.to, invoice: ticketData.invoiceNo });
    } catch (error) {
      logger.error('Failed to send ticket email', { error, to: ticketData.to });
      throw new Error('Failed to send ticket email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: to,
        subject: 'Password Reset Request - Youth Alive',
        html: this.generatePasswordResetHtml(resetUrl),
        text: `Reset your password by visiting: ${resetUrl}`,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', { to });
    } catch (error) {
      logger.error('Failed to send password reset email', { error, to });
      throw new Error('Failed to send password reset email');
    }
  }  /**
   * Generate HTML template for ticket email
   */
  private generateTicketEmailHtml(ticketData: TicketEmailData): string {
    return `
      <div style="background: #ffffff; background-color: #ffffff; margin: 0px auto; max-width: 600px;">
        <table style="background: #ffffff; background-color: #ffffff; width: 100%;" border="0" cellspacing="0" cellpadding="0" align="center">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 0px; padding-top: 10px; text-align: center;">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="background: #ffffff; background-color: #ffffff; margin: 0px auto; max-width: 600px;">
        <table style="background: #ffffff; background-color: #ffffff; width: 100%;" border="0" cellspacing="0" cellpadding="0" align="center">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 0px 0; text-align: center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                  <table style="vertical-align: top;" border="0" width="100%" cellspacing="0" cellpadding="0">
                    <tbody>                      <tr>
                        <td style="background: #ffffff; font-size: 0px; padding: 10px 0 0; word-break: break-word;" align="center">
                          <img src="https://www.jotform.com/uploads/Benjamin_benjamin_SuBenjamin/form_files/JotformLogo.68381655b782e3.40221171.jpg" alt="" style="max-width: 550px; width: 100%; height: auto;" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="background: #ffffff; background-color: #ffffff; margin: 0px auto; max-width: 600px;">
        <table style="background: #ffffff; background-color: #ffffff; width: 100%;" border="0" cellspacing="0" cellpadding="0" align="center">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 10px 0px 20px 0px; text-align: center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                  <table style="vertical-align: top;" border="0" width="100%" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr style="height: 426.93px;">
                        <td style="font-size: 0px; padding: 10px 25px; word-break: break-word; height: 426.93px;" align="left">
                          <div style="font-family: Inter, sans-serif; font-size: 14px; line-height: 1.5; text-align: left; color: #333333;">
                            <p style="display: block; margin: 13px 0px;">Hi&nbsp;<strong>${ticketData.name.split(' ')[0]},</strong></p>
                            <p style="display: block; margin: 13px 0px;">Thank you for registering for STADIUM 25!</p>
                            <p style="display: block; margin: 13px 0px;">This is your confirmation email to acknowledge that your registration has been confirmed.</p>
                            <p style="display: block; margin: 13px 0px;"><strong>Date:</strong> ${ticketData.eventDate}</p>
                            <p style="display: block; margin: 13px 0px;"><strong>Time:</strong>&nbsp;5:30pm - Sign-In&nbsp;<strong>//</strong>&nbsp;6:30pm - Doors Open</p>
                            <p style="display: block; margin: 13px 0px;"><strong>Location:</strong>&nbsp;Futures Church Paradise</p>
                            <p style="display: block; margin: 13px 0px;"><strong>Parking is limited</strong>&nbsp;so we encourage you to either travel with your youth ministry or take public transport.</p>
                            <p style="display: block; margin: 13px 0px;"><strong>Check-in:&nbsp;</strong>Alternatively to a ticket system, this year at check in, be ready with your QR code attached below.</p>
                            <div style="text-align: center; margin: 20px 0;">
                              <img src="cid:qrcode" alt="QR Code for ${ticketData.invoiceNo}" style="width: 200px; height: 200px; border: 1px solid #ddd; display: block; margin: 0 auto;">
                            </div>
                            <p style="display: block; margin: 13px 0px;"><strong>Order details: ${ticketData.invoiceNo}</strong></p>
                            <p style="display: block; margin: 13px 0px;">Please find attached to this email a receipt for your order.</p>
                            <p style="display: block; margin: 13px 0px;">If you have any questions, you can contact us at&nbsp;<a href="mailto:hello@youthalivesa.org">hello@youthalivesa.org</a></p>
                            <p style="display: block; margin: 13px 0px;">We look forward to seeing you at STADIUM 25!</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="background: white; background-color: white; margin: 0px auto; max-width: 600px;">
        <table style="background: white; background-color: white; width: 100%;" border="0" cellspacing="0" cellpadding="0" align="center">
          <tbody>
            <tr style="height: 114.93px;">
              <td style="direction: ltr; font-size: 0px; padding: 0px; text-align: center; height: 114.93px;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                  <table style="vertical-align: top;" border="0" width="100%" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr style="height: 97.9297px;">
                        <td style="font-size: 0px; padding: 0px; word-break: break-word; height: 97.9297px;" align="center">
                          <img style="border: 0px; height: auto; line-height: 0px; outline: none; text-decoration: none; max-width: 100%;" src="https://www.jotform.com/uploads/Benjamin_benjamin_SuBenjamin/form_files/gmal%20signature.66207f8799a219.95879816.png" alt="" width="71" height="71" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin: 0px auto; max-width: 600px;">
        <table style="width: 100%;" border="0" cellspacing="0" cellpadding="0" align="center">
          <tbody>
            <tr>
              <td style="direction: ltr; font-size: 0px; padding: 20px 0; text-align: center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">&nbsp;</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate HTML template for password reset email
   */
  private generatePasswordResetHtml(resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://youthalivesa.org/wp-content/uploads/2023/01/Youth-Alive-social-avatars-2-1-1.png" alt="Youth Alive Logo" style="height: 50px;">
        </div>
        
        <h2 style="color: #0a1551; text-align: center;">Password Reset Request</h2>
        
        <p>You have requested to reset your password for your Youth Alive account.</p>
        
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #FF6100; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
        </p>
        
        <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">
          <p>Youth Alive SA<br>
          Building a generation that loves Jesus</p>
        </div>
      </div>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();