"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkin_controller_1 = require("../controllers/checkin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
/**
 * @route GET /api/checkin/search
 * @desc Search for guests by name or email
 * @access Protected
 */
router.get('/search', auth_middleware_1.authenticateJWT, checkin_controller_1.searchGuests);
/**
 * @route POST /api/checkin/scan
 * @desc Check in a guest by ticket ID or invoice number
 * @access Protected
 */
router.post('/scan', auth_middleware_1.authenticateJWT, checkin_controller_1.checkIn);
exports.default = router;
//# sourceMappingURL=checkin.routes.js.map