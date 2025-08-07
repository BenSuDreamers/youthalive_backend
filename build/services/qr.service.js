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
/**
 * Generate QR code as data URL
 */
const generateQrCode = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const qrOptions = {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 200, // Reduced from 300 for better email compatibility
            margin: 1, // Reduced margin
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            quality: 0.8 // Add quality setting for smaller file size
        };
        const dataUrl = yield qrcode_1.default.toDataURL(data, qrOptions);
        logger_1.default.info('QR code generated successfully', { dataLength: data.length });
        return dataUrl;
    }
    catch (error) {
        logger_1.default.error('Error generating QR code', { error, data });
        throw new Error('QR code generation failed');
    }
});
exports.generateQrCode = generateQrCode;
//# sourceMappingURL=qr.service.js.map