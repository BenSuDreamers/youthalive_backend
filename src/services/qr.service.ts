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
      width: 200, // Reduced from 300 for better email compatibility
      margin: 1,  // Reduced margin
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      quality: 0.8 // Add quality setting for smaller file size
    };
    
    const dataUrl = await QRCode.toDataURL(data, qrOptions);
    logger.info('QR code generated successfully', { dataLength: data.length });
    return dataUrl;
  } catch (error) {
    logger.error('Error generating QR code', { error, data });
    throw new Error('QR code generation failed');
  }
};