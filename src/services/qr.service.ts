import qrcode from 'qrcode';
import logger from '../utils/logger';

/**
 * Generate a QR code as a data URL
 * @param data The string to encode in the QR code
 * @returns Promise resolving to a data URL string
 */
export const generateQrCode = async (data: string): Promise<string> => {
  try {    // Generate QR code with specific options
    const qrOptions = {
      errorCorrectionLevel: 'H' as const,  // Highest error correction capability
      margin: 1,
      width: 500,
      color: {
        dark: '#000000',  // Black dots
        light: '#FFFFFF'  // White background
      }
    };

    // Generate and return the QR code as a data URL
    const dataUrl = await qrcode.toDataURL(data, qrOptions);
    return dataUrl;
  } catch (error) {
    logger.error('Error generating QR code', { error, data });
    throw new Error('QR code generation failed');
  }
};

/**
 * Generate a QR code as a buffer
 * @param data The string to encode
 * @returns Promise resolving to a Buffer
 */
export const generateQrCodeBuffer = async (data: string): Promise<Buffer> => {
  try {
    const buffer = await qrcode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      width: 500,
      margin: 1,
    });
    return buffer;
  } catch (error) {
    logger.error('Error generating QR code buffer', { error, data });
    throw new Error('QR code buffer generation failed');
  }
};