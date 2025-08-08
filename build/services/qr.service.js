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
exports.generateQrCode = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const logger_1 = __importDefault(require("../utils/logger"));
// Cache for QR codes to reduce generation load
const qrCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache
/**
 * Generate QR code as data URL with caching for performance
 */
const generateQrCode = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check cache first
        const cached = qrCache.get(data);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            logger_1.default.info('QR code served from cache', { dataLength: data.length });
            return cached.dataUrl;
        }
        const qrOptions = {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 200, // Optimized size for performance
            margin: 1, // Reduced margin
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            quality: 0.7 // Reduced quality for smaller file size and faster generation
        };
        const dataUrl = yield qrcode_1.default.toDataURL(data, qrOptions);
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
        logger_1.default.info('QR code generated successfully', { dataLength: data.length, cacheSize: qrCache.size });
        return dataUrl;
    }
    catch (error) {
        logger_1.default.error('Error generating QR code', { error, data });
        throw new Error('QR code generation failed');
    }
});
exports.generateQrCode = generateQrCode;
//# sourceMappingURL=qr.service.js.map