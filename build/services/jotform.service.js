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
exports.parseWebhook = exports.getLiveEvents = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
// Base URL for Jotform API
const JOTFORM_API_BASE_URL = 'https://api.jotform.com';
/**
 * Get live events from Jotform API
 * @returns Promise resolving to array of event objects
 */
const getLiveEvents = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Make API request to get all forms
        const response = yield axios_1.default.get(`${JOTFORM_API_BASE_URL}/user/forms`, {
            params: {
                apiKey: config_1.default.jotform.apiKey,
                limit: 100, // Adjust as needed
                filter: {
                    status: 'ENABLED' // Only get active forms
                }
            }
        });
        // Check if request was successful
        if (response.data.responseCode !== 200) {
            throw new Error(`Jotform API error: ${response.data.message}`);
        }
        // Extract and transform form data to our event format
        // Note: You might need to adjust this based on how you identify "events" in your forms
        const events = response.data.content
            .filter((form) => form.status === 'ENABLED')
            .map((form) => ({
            formId: form.id,
            title: form.title,
            // Note: You may need to extract actual event dates from form questions
            // This is a placeholder assuming dates are stored in form properties
            startTime: new Date(form.created_at * 1000), // Convert Unix timestamp
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Example: 7 days from now
        }));
        logger_1.default.info(`Retrieved ${events.length} live events from Jotform`);
        return events;
    }
    catch (error) {
        logger_1.default.error('Error fetching events from Jotform', { error });
        throw new Error('Failed to fetch events from Jotform');
    }
});
exports.getLiveEvents = getLiveEvents;
/**
 * Parse webhook data from Jotform submission
 * @param payload The raw webhook payload from Jotform
 * @returns Parsed submission data
 */
const parseWebhook = (payload) => {
    try {
        // Extract formID from the payload
        const formId = payload.formID || '';
        // Extract submission data from raw payload
        // Note: Field IDs will vary based on your specific form structure
        // You'll need to adjust these based on your actual form fields
        const rawSubmission = payload.rawRequest || payload;
        // These field mappings need to be adjusted based on your form structure
        const name = getSubmissionValue(rawSubmission, 'name') || '';
        const email = getSubmissionValue(rawSubmission, 'email') || '';
        const invoiceNo = getSubmissionValue(rawSubmission, 'invoiceId') || `INV-${Date.now()}`;
        const phone = getSubmissionValue(rawSubmission, 'phone');
        const church = getSubmissionValue(rawSubmission, 'church');
        const youthMinistry = getSubmissionValue(rawSubmission, 'youthMinistry');
        const eventName = getSubmissionValue(rawSubmission, 'eventName') || 'Youth Alive Event';
        const eventDate = getSubmissionValue(rawSubmission, 'eventDate') || new Date().toLocaleDateString();
        // Create parsed submission object
        const parsedSubmission = {
            formId,
            name,
            email,
            invoiceNo,
            phone,
            church,
            youthMinistry,
            eventName,
            eventDate,
        };
        logger_1.default.info('Webhook data parsed successfully', { formId, email, invoiceNo });
        return parsedSubmission;
    }
    catch (error) {
        logger_1.default.error('Error parsing webhook data', { error, payload });
        throw new Error('Failed to parse webhook data');
    }
};
exports.parseWebhook = parseWebhook;
/**
 * Helper function to extract values from Jotform submission
 * Handles different formats of submission data
 */
const getSubmissionValue = (submission, field) => {
    // Try multiple common patterns for accessing form fields
    // Adjust based on the actual structure of your webhook data
    if (!submission)
        return undefined;
    // Try direct access (field might be the exact key)
    if (submission[field]) {
        return submission[field].toString();
    }
    // Try q{number}_{field} pattern (common in Jotform)
    for (const key in submission) {
        if (key.match(/q\d+_.*/) && key.endsWith(`_${field}`)) {
            return submission[key].toString();
        }
    }
    // Try nested format with q{number} and then field name
    for (const key in submission) {
        if (key.match(/q\d+/) && submission[key][field]) {
            return submission[key][field].toString();
        }
    }
    return undefined;
};
//# sourceMappingURL=jotform.service.js.map