"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTicketEmail = void 0;
const mailersend_1 = require("mailersend");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
// Initialize MailerSend client
const mailerSend = new mailersend_1.MailerSend({
    apiKey: config_1.default.email.apiKey,
});
/**
 * Send a ticket confirmation email with QR code
 */
const sendTicketEmail = (to, name, invoiceNo, eventTitle, eventDate, qrDataUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract base64 content from data URL (remove the prefix)
        const qrBase64 = qrDataUrl.split(',')[1];
        // Create email with embedded QR code
        const emailParams = new mailersend_1.EmailParams()
            .setFrom(new mailersend_1.Sender(config_1.default.email.fromEmail, config_1.default.email.fromName))
            .setTo([new mailersend_1.Recipient(to, name)])
            .setSubject(`Your Ticket for ${eventTitle}`).setAttachments([{
                content: qrBase64, // Base64 encoded content
                filename: 'qrcode.png', // Filename
                disposition: 'attachment', // Disposition
                id: 'qrcode' // Content ID for HTML embedding
            }]);
        // Create HTML email template with embedded QR code
        const htmlContent = `
      <table class="email-container body-bg" style="width: 720px; text-align: center;" border="0" width="720" cellspacing="0" cellpadding="0" bgcolor="#F3F3FE">
        <tbody>
          <tr><td height="36">&nbsp;</td></tr>
          <tr>
            <td class="mobile-padding-fix" style="padding: 0 40px;" align="center">
              <table style="width: 100%;" border="0" width="100%" cellspacing="0" cellpadding="0" bgcolor="#F3F3FE">
                <tbody>
                  <tr>
                    <td align="center" height="40"><img style="display: block; height: 40px;" src="https://youthalivesa.org/wp-content/uploads/2023/01/Youth-Alive-social-avatars-2-1-1.png" alt="Youth Alive Logo" height="40" /></td>
                  </tr>
                  <tr><td height="28">&nbsp;</td></tr>
                  <tr>
                    <td style="line-height: 0; font-size: 0; border-radius: 4px 4px 0 0;" bgcolor="#FF6100" height="8">&nbsp;</td>
                  </tr>
                  <tr>
                    <td>
                      <table style="width: 100%;" border="0" width="100%" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF">
                        <tbody>
                          <tr><td style="line-height: 0; font-size: 0;" colspan="3" height="16">&nbsp;</td></tr>
                          <tr>
                            <td width="36">&nbsp;</td>
                            <td align="left" valign="middle">
                              <h3 style="display: inline-block; vertical-align: middle; margin: 0; font-size: 18px; font-weight: bold; color: #0a1551; font-family: Helvetica, sans-serif;">${eventTitle} - Registration Confirmation</h3>
                            </td>
                            <td width="36">&nbsp;</td>
                          </tr>
                          <tr>
                            <td width="36">&nbsp;</td>
                            <td style="border-bottom: 1px solid #ECEDF2; line-height: 0; font-size: 0;" height="16">&nbsp;</td>
                            <td width="36">&nbsp;</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table style="width: 100%; border-radius: 0 0 4px 4px;" border="0" width="100%" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF">
                <tbody>
                  <tr><td colspan="3" height="24">&nbsp;</td></tr>
                  <tr>
                    <td width="36">&nbsp;</td>
                    <td align="center">
                      <table id="emailFieldsTable" style="font-size: 14px; font-family: Helvetica, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="5">
                        <tbody id="emailFieldsTableBody">
                          <tr>
                            <td style="padding: 12px 4px 12px 0; color: #6f76a7;" valign="top" width="30%">Name</td>
                            <td style="padding: 12px 0; color: #0a1551; font-weight: 500;" width="70%">${name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 4px 12px 0; color: #6f76a7;" valign="top" width="30%">Email</td>
                            <td style="padding: 12px 0; color: #0a1551; font-weight: 500;" width="70%">${to}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 4px 12px 0; color: #6f76a7;" valign="top" width="30%">Invoice ID</td>
                            <td style="padding: 12px 0; color: #0a1551; font-weight: 500;" width="70%">${invoiceNo}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 4px 12px 0; color: #6f76a7;" valign="top" width="30%">Event Date</td>
                            <td style="padding: 12px 0; color: #0a1551; font-weight: 500;" width="70%">${eventDate}</td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding: 20px 0; text-align: center;">
                              <p style="margin-bottom: 15px; font-weight: bold;">Please present this QR code when checking in:</p>
                              <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px;">
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td width="36">&nbsp;</td>
                  </tr>
                  <tr><td colspan="3" height="24">&nbsp;</td></tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr><td height="30">&nbsp;</td></tr>
        </tbody>
      </table>
    `;
        emailParams.setHtml(htmlContent);
        // Send the email
        yield mailerSend.email.send(emailParams);
        logger_1.default.info(`Ticket email sent successfully to ${to}`, { event: eventTitle, invoiceNo });
        return true;
    }
    catch (error) {
        logger_1.default.error('Error sending ticket email', { error, to, eventTitle, invoiceNo });
        return false;
    }
});
exports.sendTicketEmail = sendTicketEmail;
//# sourceMappingURL=email.service.js.map