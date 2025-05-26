"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const event_controller_1 = require("../controllers/event.controller");
const router = express_1.default.Router();
const upload = (0, multer_1.default)();
// Jotform webhook endpoint (no auth required, handles multipart/form-data)
router.post('/jotform', upload.none(), event_controller_1.webhookHandler);
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map