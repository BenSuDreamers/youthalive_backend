import { MailerSend, EmailParams, Sender, Recipient, Attachment } from 'mailersend';
import config from '../config';
import logger from '../utils/logger';

// Initialize MailerSend
const mailerSend = new MailerSend({
  apiKey: config.email.apiKey,
});

export interface TicketEmailData {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  invoiceNo: string;
  qrDataUrl: string;
}

export class EmailService {
  private fromEmail: string;
  private fromName: string;
  
  constructor() {
    this.fromEmail = config.email.fromEmail;
    this.fromName = config.email.fromName;
  }
  
  /**
   * Send ticket confirmation email with QR code
   */
  async sendTicketEmail(ticketData: TicketEmailData): Promise<void> {
    try {
      // Convert QR code data URL to base64
      const qrBase64 = ticketData.qrDataUrl.split(',')[1];
      
      const emailParams = new EmailParams()
        .setFrom(new Sender(this.fromEmail, this.fromName))
        .setTo([new Recipient(ticketData.to, ticketData.name)])
        .setSubject(`Event Registration Confirmation: ${ticketData.eventTitle}`)
        .setHtml(this.generateTicketEmailHtml(ticketData))
        .setText(`Your registration for ${ticketData.eventTitle} is confirmed. Invoice: ${ticketData.invoiceNo}`)
        .setAttachments([
          new Attachment(qrBase64, 'qrcode.png', 'attachment', 'qrcode')
        ]);

      await mailerSend.email.send(emailParams);
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
      const emailParams = new EmailParams()
        .setFrom(new Sender(this.fromEmail, this.fromName))
        .setTo([new Recipient(to)])
        .setSubject('Password Reset Request - Youth Alive')
        .setHtml(this.generatePasswordResetHtml(resetUrl))
        .setText(`Reset your password by visiting: ${resetUrl}`);

      await mailerSend.email.send(emailParams);
      logger.info('Password reset email sent successfully', { to });
    } catch (error) {
      logger.error('Failed to send password reset email', { error, to });
      throw new Error('Failed to send password reset email');
    }
  }
  /**
   * Generate HTML template for ticket email
   */
  private generateTicketEmailHtml(ticketData: TicketEmailData): string {
    return `
      <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        By choosing to follow Jesus, you really have made the best decision ever!
      </div>
      <div style="background-color: #555555;">
        <div style="margin: 0px auto; max-width: 600px;">
          <table style="width: 100%;" border="0" cellspacing="0" cellpadding="0" align="center">
            <tbody>
              <tr>
                <td style="direction: ltr; font-size: 0px; padding: 20px 0; text-align: center;">
                  <div style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                    ${ticketData.name}${ticketData.eventTitle}${ticketData.invoiceNo}&nbsp;
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
                <td style="direction: ltr; font-size: 0px; padding: 0px; padding-top: 10px; text-align: center;">
                  <div style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                    <table style="vertical-align: top;" border="0" width="100%" cellspacing="0" cellpadding="0">
                      <tbody>
                        <tr>
                          <td style="font-size: 0px; padding: 10px 25px; word-break: break-word;" align="center">
                            <img src="https://www.jotform.com/uploads/Benjamin_benjamin_SuBenjamin/form_files/youth%20alive%20logo%20purple.666a68a759d4c6.26289966.png" alt="" width="102" height="23" />
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
                <td style="direction: ltr; font-size: 0px; padding: 0px 0; text-align: center;">
                  <div style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                    <table style="vertical-align: top;" border="0" width="100%" cellspacing="0" cellpadding="0">
                      <tbody>
                        <tr>
                          <td style="background: #ffffff; font-size: 0px; padding: 10px 0 0; word-break: break-word;" align="center">
                            <img src="https://www.jotform.com/uploads/Benjamin_benjamin_SuBenjamin/form_files/Stadium%2024%20Guest%20Speaker%20Announcement%20(Logo).66207f2f8fdde4.16960870.png" alt="" />
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
                  <div style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                    <table style="vertical-align: top;" border="0" width="100%" cellspacing="0" cellpadding="0">
                      <tbody>
                        <tr>
                          <td style="font-size: 0px; padding: 10px 25px; word-break: break-word;" align="left">
                            <div style="font-family: Inter, sans-serif; font-size: 14px; line-height: 1.5; text-align: left; color: #333333;">
                              <p>Hi <strong>${ticketData.name.split(' ')[0]},</strong></p>
                              <p>Thank you for registering for ${ticketData.eventTitle}!</p>
                              <p>This is your confirmation email to acknowledge that your registration has been confirmed.</p>
                              <p><strong>Date:</strong> ${ticketData.eventDate}</p>
                              <p><strong>Time:</strong> 5:30pm - Sign-In <strong>//</strong> 6:30pm - Doors Open</p>
                              <p><strong>Location:</strong> Adelaide Convention Centre</p>
                              <p><strong>Parking is limited</strong> so we encourage you to either travel with your youth ministry, take public transport or organise which carpark you will park at to ensure you are not surprised by any parking rates.</p>
                              <p><strong>Check-in:&nbsp;</strong>Alternatively to a ticket system, this year at check in, be ready with your invoice number attached below.</p>
                              <p><strong>Please present this QR code when checking in:</strong></p>
                              <p><img src="${ticketData.qrDataUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd;"></p>
                              <p>Please find attached to this email a receipt for your order.</p>
                              <p>If you have any questions, you can contact us at <a href="mailto:hello@youthalivesa.org">hello@youthalivesa.org</a></p>
                              <p>We look forward to seeing you at ${ticketData.eventTitle}!</p>
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
              <tr>
                <td style="direction: ltr; font-size: 0px; padding: 0px; text-align: center;">
                  <div style="font-size: 0px; text-align: left; direction: ltr; display: inline-block; vertical-align: top; width: 100%;">
                    <table style="vertical-align: top;" border="0" width="100%" cellspacing="0" cellpadding="0">
                      <tbody>
                        <tr>
                          <td style="font-size: 0px; padding: 0px; word-break: break-word;" align="center">
                            <img src="https://www.jotform.com/uploads/Benjamin_benjamin_SuBenjamin/form_files/gmal%20signature.66207f8799a219.95879816.png" alt="" width="71" height="71" />
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