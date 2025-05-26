"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const export_controller_1 = require("../controllers/export.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
/**
 * @route GET /api/export/tickets/:eventId
 * @desc Export tickets for an event as CSV
 * @access Protected
 */
router.get('/tickets/:eventId', auth_middleware_1.authenticateJWT, export_controller_1.exportTickets);
exports.default = router;
//# sourceMappingURL=export.routes.js.map