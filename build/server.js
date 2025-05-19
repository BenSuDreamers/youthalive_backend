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
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("./config"));
const app_1 = __importDefault(require("./app"));
// MongoDB connection options
const mongooseOptions = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
};
console.log(`Server starting in ${config_1.default.nodeEnv} mode...`);
// Connect to MongoDB
mongoose_1.default
    .connect(config_1.default.mongodb.uri, mongooseOptions)
    .then(() => {
    // Start Express server on successful connection
    app_1.default.listen(config_1.default.port, () => {
        console.log(`✅ Connected to MongoDB successfully!`);
        console.log(`🚀 Server running on port ${config_1.default.port}`);
        console.log(`📝 API Documentation: http://localhost:${config_1.default.port}/api-docs`);
    });
})
    .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit with failure code
});
// Handle MongoDB connection events
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
});
// Handle application termination
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
}));
//# sourceMappingURL=server.js.map