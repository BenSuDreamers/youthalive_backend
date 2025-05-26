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
        }); // Check if request was successful
        if (response.data.responseCode !== 200) {
            throw new Error(`Jotform API error: ${response.data.message}`);
        }
        // Extract and transform form data to our event format
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
const parseWebhook = (payload) => {
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));
    try {
        // Log the entire payload to understand its structure
        logger_1.default.info('Parsing webhook payload', {
            payload,
            keys: Object.keys(payload),
            formID: payload.formID || payload.formId
        });
        // Extract formID from the payload
        const formId = payload.formID || payload.form_id || payload.formId || '';
        // If payload has rawRequest field, try to parse it
        if (payload.rawRequest) {
            console.log('Found rawRequest field, attempting to parse...');
            try {
                const rawData = JSON.parse(payload.rawRequest);
                console.log('Parsed rawRequest:', JSON.stringify(rawData, null, 2));
                // Extract form fields from rawData
                const rawFields = rawData;
                const formFields = {};
                // Process each field
                for (const [key, value] of Object.entries(rawFields)) {
                    if (key.startsWith('q') && key.includes('_')) {
                        // This is a form field
                        formFields[key] = value;
                    }
                }
                console.log('Extracted form fields:', JSON.stringify(formFields, null, 2));
                // Parse the extracted fields
                const ticketData = parseFormFields(formFields);
                console.log('Successfully parsed ticket data from rawRequest:', ticketData);
                return ticketData;
            }
            catch (parseError) {
                console.error('Failed to parse rawRequest:', parseError);
                // Fall through to try legacy parsing
            }
        }
        // Try legacy parsing if rawRequest parsing failed or doesn't exist
        console.log('Attempting legacy parsing...');
        const ticketData = parseFormFields(payload);
        console.log('Successfully parsed ticket data from legacy method:', ticketData);
        return ticketData;
    }
    catch (error) {
        console.error('Error in parseWebhook:', error);
        throw error;
    }
};
exports.parseWebhook = parseWebhook;
/**
 * Helper function to parse form fields and extract ticket data
 */
const parseFormFields = (fields) => {
    const formId = fields.formID || fields.form_id || fields.formId || '';
    // Initialize default values
    let email = '';
    let name = '';
    let invoiceNo = `INV-${Date.now()}`;
    let phone = '';
    let church = '';
    // FIRST: Try to extract from WebApp test form field names (the correct ones from logs)
    if (fields.q4_email4) {
        email = fields.q4_email4;
    }
    else if (fields.q5_email) {
        email = fields.q5_email;
    }
    else if (fields.q4_email) {
        email = fields.q4_email;
    }
    else if (fields.email) {
        email = fields.email;
    }
    // Handle name from WebApp test form format
    if (fields.q3_ltstronggtnameltstronggt) {
        if (typeof fields.q3_ltstronggtnameltstronggt === 'object' && fields.q3_ltstronggtnameltstronggt !== null) {
            const nameObj = fields.q3_ltstronggtnameltstronggt;
            name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
        }
        else {
            name = String(fields.q3_ltstronggtnameltstronggt);
        }
    }
    else if (fields.q3_name) {
        if (typeof fields.q3_name === 'object' && fields.q3_name !== null) {
            const nameObj = fields.q3_name;
            name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
        }
        else {
            name = String(fields.q3_name);
        }
    }
    else if (fields['q3_name[first]'] && fields['q3_name[last]']) {
        name = `${fields['q3_name[first]']} ${fields['q3_name[last]']}`.trim();
    }
    else if (fields.q4_fullName) {
        name = fields.q4_fullName;
    }
    else if (fields.name) {
        name = String(fields.name);
    }
    // Handle invoice ID from WebApp test form format
    if (fields.q11_invoiceId) {
        invoiceNo = fields.q11_invoiceId;
    }
    else if (fields.q7_invoiceId) {
        invoiceNo = fields.q7_invoiceId;
    }
    else if (fields.q11_autoincrement) {
        invoiceNo = fields.q11_autoincrement;
    }
    else if (fields.invoiceId) {
        invoiceNo = fields.invoiceId;
    }
    // Handle phone from WebApp test form format
    if (fields.q16_ltstronggtphoneNumberltstronggt) {
        phone = fields.q16_ltstronggtphoneNumberltstronggt;
    }
    else if (fields.q11_phoneNumber) {
        if (typeof fields.q11_phoneNumber === 'object' && fields.q11_phoneNumber !== null) {
            const phoneObj = fields.q11_phoneNumber;
            phone = phoneObj.full || String(fields.q11_phoneNumber);
        }
        else {
            phone = String(fields.q11_phoneNumber);
        }
    }
    else if (fields['q11_phoneNumber[full]']) {
        phone = fields['q11_phoneNumber[full]'];
    }
    else if (fields.phone) {
        phone = fields.phone;
    }
    // Handle church/youth group from WebApp test form format
    if (fields.q12_ltstronggtwhichYouth) {
        church = fields.q12_ltstronggtwhichYouth;
    }
    else if (fields.q9_youthGroup) {
        church = fields.q9_youthGroup;
    }
    else if (fields.q12_textbox) {
        church = fields.q12_textbox;
    }
    else if (fields.church || fields.youthGroup) {
        church = fields.church || fields.youthGroup;
    }
    // Clean invoice number (remove "# INV-" prefix if present)
    if (typeof invoiceNo === 'string' && invoiceNo.startsWith('# INV-')) {
        invoiceNo = invoiceNo.substring(6);
    }
    // Also handle "# " prefix without INV
    if (typeof invoiceNo === 'string' && invoiceNo.startsWith('# ')) {
        invoiceNo = invoiceNo.substring(2);
    }
    // Also handle just "INV-" prefix
    if (typeof invoiceNo === 'string' && invoiceNo.startsWith('INV-')) {
        invoiceNo = invoiceNo.substring(4);
    }
    logger_1.default.info('Final parsed submission data', {
        formId, email, name, invoiceNo, phone, church
    });
    return {
        formId,
        email,
        name,
        invoiceNo,
        phone,
        church,
    };
};
//# sourceMappingURL=jotform.service.js.map