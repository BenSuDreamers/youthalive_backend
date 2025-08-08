import QRCode from 'qrcode';
import logger from '../utils/logger';

// Cache for QR codes to reduce generation load
const qrCache = new Map<string, { dataUrl: string; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

/**
 * Generate QR code as data URL with caching for performance
 */
export const generateQrCode = async (data: string): Promise<string> => {
  try {
    // Check cache first
    const cached = qrCache.get(data);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info('QR code served from cache', { dataLength: data.length });
      return cached.dataUrl;
    }

    const qrOptions = {
      errorCorrectionLevel: 'M' as const,
      type: 'image/png' as const,
      width: 200, // Optimized size for performance
      margin: 1,  // Reduced margin
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      quality: 0.7 // Reduced quality for smaller file size and faster generation
    };
    
    const dataUrl = await QRCode.toDataURL(data, qrOptions);
    
    // Store in cache
    qrCache.set(data, { dataUrl, timestamp: Date.now() });
    
    // Clean old cache entries periodically
    if (qrCache.size > 1000) {
      const cutoff = Date.now() - CACHE_TTL;
      for (const [key, value] of qrCache.entries()) {
        if (value.timestamp < cutoff) {
          qrCache.delete(key);
        }
      }
    }
    
    logger.info('QR code generated successfully', { dataLength: data.length, cacheSize: qrCache.size });
    return dataUrl;
  } catch (error) {
    logger.error('Error generating QR code', { error, data });
    throw new Error('QR code generation failed');
  }
};