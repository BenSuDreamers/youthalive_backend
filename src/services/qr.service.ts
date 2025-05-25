import QRCode from 'qrcode';
import logger from '../utils/logger';

/**
 * Generate QR code as data URL
 */
export const generateQrCode = async (data: string): Promise<string> => {
  try {
    const qrOptions = {
      errorCorrectionLevel: 'M' as const,
      type: 'image/png' as const,
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    const dataUrl = await QRCode.toDataURL(data, qrOptions);
    logger.info('QR code generated successfully', { dataLength: data.length });
    return dataUrl;
  } catch (error) {
    logger.error('Error generating QR code', { error, data });
    throw new Error('QR code generation failed');
  }
};