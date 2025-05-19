"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const event_controller_1 = require("../controllers/event.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
/**
 * @route GET /api/events
 * @desc Get all live events
 * @access Protected
 */
router.get('/', auth_middleware_1.authenticateJWT, event_controller_1.listEvents);
/**
 * @route POST /api/events/webhook
 * @desc Handle webhook from Jotform
 * @access Public
 */
router.post('/webhook', event_controller_1.webhookHandler);
exports.default = router;
//# sourceMappingURL=event.routes.js.map