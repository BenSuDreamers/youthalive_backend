"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const multer_1 = __importDefault(require("multer"));
const config_1 = __importDefault(require("./config"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const checkin_routes_1 = __importDefault(require("./routes/checkin.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
// Initialize Express app
const app = (0, express_1.default)();
// Configure multer for multipart form data (used by Jotform webhooks)
const upload = (0, multer_1.default)();
// Apply middleware
app.use((0, helmet_1.default)()); // Add security headers
app.use((0, cors_1.default)({ origin: config_1.default.frontendUrl, credentials: true })); // Allow cross-origin requests from frontend
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use((0, morgan_1.default)('combined')); // Log HTTP requests
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// Import webhook controller for direct route
const event_controller_1 = require("./controllers/event.controller");
// Direct Jotform webhook endpoint (handles multipart/form-data)
app.post('/jotform', upload.none(), event_controller_1.webhookHandler);
// Mount API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/checkin', checkin_routes_1.default);
app.use('/api/export', export_routes_1.default); // Add export routes
app.use('/api/webhooks', webhook_routes_1.default);
// Apply error handling middleware
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map