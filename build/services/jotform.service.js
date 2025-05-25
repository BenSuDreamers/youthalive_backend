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
        } // Extract and transform form data to our event format
        // Note: You might need to extract actual event dates from form questions
        const events = response.data.content
            .filter((form) => form.status === 'ENABLED')
            .map((form) => {
            // Safe date parsing with robust validation
            let startTime;
            let endTime;
            try {
                // Try to parse the created_at timestamp
                if (form.created_at && typeof form.created_at === 'string' && !isNaN(Number(form.created_at))) {
                    // Unix timestamp (string)
                    startTime = new Date(parseInt(form.created_at) * 1000);
                }
                else if (form.created_at && typeof form.created_at === 'number' && !isNaN(form.created_at)) {
                    // Unix timestamp (number)
                    startTime = new Date(form.created_at * 1000);
                }
                else if (form.created_at && typeof form.created_at === 'string') {
                    // Try direct string parsing
                    startTime = new Date(form.created_at);
                }
                else {
                    // No created_at, use current time
                    startTime = new Date();
                }
                // Validate the parsed date is actually valid
                if (!startTime || isNaN(startTime.getTime()) || startTime.getTime() <= 0) {
                    logger_1.default.warn(`Invalid startTime for form ${form.id}, using current date`, {
                        created_at: form.created_at,
                        parsed: startTime
                    });
                    startTime = new Date();
                }
                // Set end time to 7 days after start time
                endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
                // Validate end time as well
                if (!endTime || isNaN(endTime.getTime())) {
                    endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                }
            }
            catch (error) {
                // Fallback dates in case of any parsing error
                logger_1.default.warn(`Exception parsing dates for form ${form.id}, using defaults`, {
                    error: error instanceof Error ? error.message : String(error),
                    created_at: form.created_at
                });
                startTime = new Date();
                endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            }
            return {
                formId: form.id,
                title: form.title,
                startTime,
                endTime,
            };
        });
        logger_1.default.info(`Retrieved ${events.length} live events from Jotform`);
        return events;
    }
    catch (error) {
        logger_1.default.error('Error fetching events from Jotform', { error: error instanceof Error ? error.message : String(error) });
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
        const formId = payload.formID || payload.form_id || '';
        // Handle different webhook payload formats
        let submissionData = {};
        // If rawRequest is a string, parse it
        if (typeof payload.rawRequest === 'string') {
            try {
                const parsed = JSON.parse(payload.rawRequest);
                // Check if pretty field exists (Jotform format)
                if (parsed.pretty && typeof parsed.pretty === 'string') {
                    submissionData = JSON.parse(parsed.pretty);
                }
                else {
                    submissionData = parsed;
                }
            }
            catch (e) {
                logger_1.default.warn('Failed to parse rawRequest JSON', { rawRequest: payload.rawRequest });
                submissionData = payload;
            }
        }
        else if (payload.rawRequest && typeof payload.rawRequest === 'object') {
            submissionData = payload.rawRequest;
        }
        else {
            // Use the payload directly
            submissionData = payload;
        }
        logger_1.default.info('Parsing webhook with submission data', { submissionData, formId });
        // Map fields based on form ID (different forms have different field structures)
        let fieldMappings = {};
        if (formId === '251442125173852') {
            // WebApp test form mappings
            fieldMappings = {
                name: '3',
                email: '4',
                invoiceId: '11',
                church: '12',
                phone: '16'
            };
        }
        else if (formId === '241078261192858') {
            // Stadium 24 form mappings
            fieldMappings = {
                name: '4',
                email: '5',
                phone: '7',
                church: '10',
                invoiceId: '38'
            };
        }
        else {
            // Default/Stadium Registration Form mappings
            fieldMappings = {
                name: '3',
                email: '4',
                phone: '16',
                church: '12',
                invoiceId: '11'
            };
        }
        // Extract values using the appropriate field mappings
        const name = submissionData[fieldMappings.name] || '';
        const email = submissionData[fieldMappings.email] || '';
        let invoiceNo = submissionData[fieldMappings.invoiceId] || `INV-${Date.now()}`;
        const phone = submissionData[fieldMappings.phone] || '';
        const church = submissionData[fieldMappings.church] || '';
        // Clean invoice number (remove "# INV-" prefix if present)
        if (typeof invoiceNo === 'string' && invoiceNo.startsWith('# INV-')) {
            invoiceNo = invoiceNo.substring(6);
        }
        // Handle name field if it's an object (some forms return {first, last})
        let finalName = name;
        if (typeof name === 'object' && name !== null) {
            if (name.first || name.last) {
                finalName = `${name.first || ''} ${name.last || ''}`.trim();
            }
            else {
                finalName = String(name);
            }
        }
        // Create parsed submission object
        const parsedSubmission = {
            formId,
            name: finalName,
            email,
            invoiceNo,
            phone,
            church,
            eventName: 'Youth Alive Event',
            eventDate: new Date().toLocaleDateString(),
        };
        logger_1.default.info('Webhook data parsed successfully', {
            formId,
            email,
            invoiceNo,
            name: finalName,
            extractedFrom: Object.keys(submissionData)
        });
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
    if (!submission)
        return undefined;
    // Stadium Registration Form field mappings based on your form analysis
    const fieldMappings = {
        'name': ['3', 'q3', 'q3_fullName', 'fullName', 'name'],
        'email': ['4', 'q4', 'q4_email', 'email'],
        'phone': ['16', 'q16', 'q16_phone', 'phone'],
        'church': ['12', 'q12', 'q12_textbox', 'youthGroup', 'church'],
        'invoiceId': ['11', 'q11', 'q11_autoincrement', 'invoiceId', 'invoice'],
        'youthMinistry': ['12', 'q12', 'q12_textbox', 'youthGroup'],
    };
    const possibleKeys = fieldMappings[field] || [field];
    // Try all possible field keys
    for (const key of possibleKeys) {
        // Direct access
        if (submission[key]) {
            return submission[key].toString();
        }
        // Try answers object format (common in Jotform webhooks)
        if (submission.answers && submission.answers[key]) {
            const answer = submission.answers[key];
            return (answer.answer || answer).toString();
        }
        // Try rawRequest format
        if (submission.rawRequest && submission.rawRequest[key]) {
            return submission.rawRequest[key].toString();
        }
    }
    // Fallback: search for field in all submission keys
    for (const [submissionKey, value] of Object.entries(submission)) {
        if (submissionKey.toLowerCase().includes(field.toLowerCase())) {
            return value === null || value === void 0 ? void 0 : value.toString();
        }
    }
    return undefined;
};
//# sourceMappingURL=jotform.service.js.map