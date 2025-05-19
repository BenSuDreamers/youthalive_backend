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
exports.generateQrCodeBuffer = exports.generateQrCode = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Generate a QR code as a data URL
 * @param data The string to encode in the QR code
 * @returns Promise resolving to a data URL string
 */
const generateQrCode = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try { // Generate QR code with specific options
        const qrOptions = {
            errorCorrectionLevel: 'H', // Highest error correction capability
            margin: 1,
            width: 500,
            color: {
                dark: '#000000', // Black dots
                light: '#FFFFFF' // White background
            }
        };
        // Generate and return the QR code as a data URL
        const dataUrl = yield qrcode_1.default.toDataURL(data, qrOptions);
        return dataUrl;
    }
    catch (error) {
        logger_1.default.error('Error generating QR code', { error, data });
        throw new Error('QR code generation failed');
    }
});
exports.generateQrCode = generateQrCode;
/**
 * Generate a QR code as a buffer
 * @param data The string to encode
 * @returns Promise resolving to a Buffer
 */
const generateQrCodeBuffer = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const buffer = yield qrcode_1.default.toBuffer(data, {
            errorCorrectionLevel: 'H',
            width: 500,
            margin: 1,
        });
        return buffer;
    }
    catch (error) {
        logger_1.default.error('Error generating QR code buffer', { error, data });
        throw new Error('QR code buffer generation failed');
    }
});
exports.generateQrCodeBuffer = generateQrCodeBuffer;
//# sourceMappingURL=qr.service.js.map