"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const event_controller_1 = require("../controllers/event.controller");
const router = express_1.default.Router();
/**
 * @route POST /api/webhooks
 * @desc Process webhooks from Jotform
 * @access Public
 */
router.post('/', event_controller_1.webhookHandler);
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map