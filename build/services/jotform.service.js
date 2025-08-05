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
                // Add the formId to the form fields
                formFields.formID = formId;
                formFields.formId = formId;
                // Process each field
                for (const [key, value] of Object.entries(rawFields)) {
                    if (key.startsWith('q') && key.includes('_')) {
                        // This is a form field
                        formFields[key] = value;
                    }
                    else {
                        // Copy all other fields too (including direct quantity, productDetails, etc.)
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
 * Parse product details from JotForm's "My Products" field
 */
const parseProductDetails = (productField) => {
    let quantity = 1;
    let productDetails = '';
    let totalAmount = 0;
    try {
        console.log('parseProductDetails: Received field:', JSON.stringify(productField, null, 2));
        if (productField && typeof productField === 'object') {
            // Check if it has paymentArray (typical format for Stadium forms)
            if (productField.paymentArray) {
                console.log('parseProductDetails: Found paymentArray:', productField.paymentArray);
                try {
                    const paymentData = JSON.parse(productField.paymentArray);
                    console.log('parseProductDetails: Parsed paymentArray:', JSON.stringify(paymentData, null, 2));
                    if (paymentData.product && Array.isArray(paymentData.product)) {
                        // Extract quantity from product string like "General Admission (Amount: 5.00 AUD, Quantity: 15)"
                        const productString = paymentData.product[0] || '';
                        console.log('parseProductDetails: Product string:', productString);
                        // Try multiple regex patterns to be more flexible
                        const quantityPatterns = [
                            /Quantity:\s*(\d+)/i,
                            /Qty:\s*(\d+)/i,
                            /quantity\s*=\s*(\d+)/i,
                            /qty\s*=\s*(\d+)/i
                        ];
                        let quantityFound = false;
                        for (const pattern of quantityPatterns) {
                            const quantityMatch = productString.match(pattern);
                            if (quantityMatch) {
                                quantity = parseInt(quantityMatch[1], 10) || 1;
                                console.log(`parseProductDetails: ✅ Extracted quantity ${quantity} using pattern ${pattern}`);
                                quantityFound = true;
                                break;
                            }
                        }
                        if (!quantityFound) {
                            console.log(`parseProductDetails: ❌ No quantity found in product string: "${productString}"`);
                        }
                        productDetails = productString;
                    }
                    if (paymentData.total) {
                        totalAmount = parseFloat(paymentData.total) || 0;
                        console.log('parseProductDetails: Extracted total amount:', totalAmount);
                    }
                }
                catch (parseError) {
                    console.error('parseProductDetails: Error parsing paymentArray:', parseError);
                }
            }
            // Check for direct product data format (alternative structure)
            if (productField['1'] || productField['0']) {
                console.log('parseProductDetails: Found numbered product data format');
                try {
                    const productData = JSON.parse(productField['1'] || productField['0']);
                    console.log('parseProductDetails: Parsed product data:', JSON.stringify(productData, null, 2));
                    if (productData.quantity) {
                        quantity = parseInt(productData.quantity, 10) || 1;
                        console.log('parseProductDetails: ✅ Extracted quantity from direct field:', quantity);
                    }
                    if (productData.name) {
                        productDetails = `${productData.name} (Quantity: ${quantity})`;
                    }
                    if (productData.price) {
                        totalAmount = productData.price * quantity;
                    }
                }
                catch (parseError) {
                    console.error('parseProductDetails: Error parsing numbered product data:', parseError);
                }
            }
            // Check for answer field structure (JotForm submission format)
            if (productField.answer) {
                console.log('parseProductDetails: Found answer field structure');
                // Check for paymentArray in answer
                if (productField.answer.paymentArray) {
                    console.log('parseProductDetails: Found paymentArray in answer field');
                    try {
                        const paymentData = JSON.parse(productField.answer.paymentArray);
                        console.log('parseProductDetails: Parsed answer paymentArray:', JSON.stringify(paymentData, null, 2));
                        if (paymentData.product && Array.isArray(paymentData.product)) {
                            const productString = paymentData.product[0] || '';
                            console.log('parseProductDetails: Product string from answer:', productString);
                            const quantityMatch = productString.match(/Quantity:\s*(\d+)/i);
                            if (quantityMatch) {
                                quantity = parseInt(quantityMatch[1], 10) || 1;
                                console.log('parseProductDetails: ✅ Extracted quantity from answer field:', quantity);
                            }
                            productDetails = productString;
                        }
                        if (paymentData.total) {
                            totalAmount = parseFloat(paymentData.total) || 0;
                        }
                    }
                    catch (parseError) {
                        console.error('parseProductDetails: Error parsing answer paymentArray:', parseError);
                    }
                }
            }
        }
        else if (typeof productField === 'string') {
            console.log('parseProductDetails: Processing string format:', productField);
            // Handle string format like "General Admission (Amount: 5.00 AUD, Quantity: 15)"
            const quantityMatch = productField.match(/Quantity:\s*(\d+)/i);
            if (quantityMatch) {
                quantity = parseInt(quantityMatch[1], 10) || 1;
                console.log('parseProductDetails: ✅ Extracted quantity from string:', quantity);
            }
            const amountMatch = productField.match(/Amount:\s*([\d.]+)/);
            if (amountMatch) {
                const unitPrice = parseFloat(amountMatch[1]) || 0;
                totalAmount = unitPrice * quantity;
            }
            productDetails = productField;
        }
    }
    catch (error) {
        logger_1.default.warn('parseProductDetails: Error parsing product details', { error, productField });
        console.error('parseProductDetails: Exception:', error);
    }
    console.log(`parseProductDetails: Final result - quantity: ${quantity}, productDetails: "${productDetails}", totalAmount: ${totalAmount}`);
    return { quantity, productDetails, totalAmount };
};
/**
 * Helper function to parse form fields and extract ticket data
 */
const parseFormFields = (fields) => {
    logger_1.default.info('Parsing form fields', { fields });
    const formId = fields.formID || fields.form_id || fields.formId || '';
    // Initialize default values
    let email = '';
    let name = '';
    let invoiceNo = `INV-${Date.now()}`;
    let phone = '';
    let church = '';
    let quantity = 1;
    let productDetails = '';
    let totalAmount = 0;
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
    // Handle different form types for name
    // Stadium 25 form uses Q3 for name
    if (fields.q3_name) {
        // Stadium 25 form format - field 3 is name
        if (typeof fields.q3_name === 'object' && fields.q3_name !== null) {
            const nameObj = fields.q3_name;
            name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
        }
        else {
            name = String(fields.q3_name);
        }
    }
    else if (fields.q3_ltstronggtnameltstronggt) {
        // Alternative Stadium 25 format
        if (typeof fields.q3_ltstronggtnameltstronggt === 'object' && fields.q3_ltstronggtnameltstronggt !== null) {
            const nameObj = fields.q3_ltstronggtnameltstronggt;
            name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
        }
        else {
            name = String(fields.q3_ltstronggtnameltstronggt);
        }
    }
    else if (fields.q4_fullName || fields.q4_name) {
        // Stadium 24 form format - field 4 is name
        const nameValue = fields.q4_fullName || fields.q4_name;
        if (typeof nameValue === 'object' && nameValue !== null) {
            const nameObj = nameValue;
            name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
        }
        else {
            name = String(nameValue);
        }
    }
    else if (fields.q3_name) {
        if (typeof fields.q3_name === 'object' && fields.q3_name !== null) {
            const nameObj = fields.q3_name;
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
    else if (fields.name) {
        name = String(fields.name);
    }
    // Handle Stadium 25 form email (field 4)
    if (fields.q4_email || fields.q4_email4) {
        email = fields.q4_email || fields.q4_email4;
    }
    else if (fields.q5_email) {
        email = fields.q5_email;
    }
    else if (fields.email) {
        email = fields.email;
    }
    // Handle product details - Stadium 25 uses Q9, other forms use Q3
    if (fields.q9_myProducts || fields.q9_products || fields.q3_products || fields.q3_myProducts || fields['9'] || fields['3']) {
        const productField = fields.q9_myProducts || fields.q9_products || fields.q3_products || fields.q3_myProducts || fields['9'] || fields['3'];
        logger_1.default.info('Found product field', { productField });
        const parsed = parseProductDetails(productField);
        quantity = parsed.quantity;
        productDetails = parsed.productDetails;
        totalAmount = parsed.totalAmount;
        logger_1.default.info('Parsed product details', { quantity, productDetails, totalAmount });
    }
    else {
        logger_1.default.info('No product field found in submission', {
            availableFields: Object.keys(fields),
            searchedFields: ['q9_myProducts', 'q9_products', 'q3_products', 'q3_myProducts', '9', '3']
        });
    }
    // Handle phone numbers from different forms
    // Stadium 25 uses Q16, other forms use Q7, Q11, etc.
    if (fields.q16_phone || fields.q16_ltstronggtphoneNumberltstronggt) {
        // Stadium 25 form format
        phone = fields.q16_phone || fields.q16_ltstronggtphoneNumberltstronggt;
    }
    else if (fields.q7_phone || fields.q7_phoneNumber) {
        // Stadium 24 form format
        phone = fields.q7_phone || fields.q7_phoneNumber;
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
    // Handle church/youth group from different forms
    // Stadium 25 uses Q23, other forms use Q10, Q12, Q9
    if (fields.q23_church || fields.q23_ltstronggtwhichYouth23) {
        // Stadium 25 form format  
        church = fields.q23_church || fields.q23_ltstronggtwhichYouth23;
    }
    else if (fields.q10_church || fields.q10_youthGroup) {
        // Stadium 24 form format  
        church = fields.q10_church || fields.q10_youthGroup;
    }
    else if (fields.q12_ltstronggtwhichYouth) {
        // WebApp test form format
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
    // Handle invoice ID from different forms
    // Stadium 25 uses Q11, Stadium 24 uses Q38
    if (fields.q11_invoiceId) {
        // Stadium 25 form format
        invoiceNo = fields.q11_invoiceId;
    }
    else if (fields.q38_invoiceId || fields['38']) {
        // Stadium 24 form format
        invoiceNo = fields.q38_invoiceId || fields['38'];
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
    // Handle Stadium 25 specific field - "Choose your night" (Friday/Saturday)
    let chooseYour = '';
    if (fields.q19_eventDate) {
        // Stadium 25 form format - field 19 contains the event date/night selection
        const eventDate = fields.q19_eventDate;
        if (typeof eventDate === 'string') {
            if (eventDate.toLowerCase().includes('friday')) {
                chooseYour = 'Friday';
            }
            else if (eventDate.toLowerCase().includes('saturday')) {
                chooseYour = 'Saturday';
            }
        }
    }
    else if (fields.q4_chooseYour) {
        // Alternative format (test forms)
        chooseYour = fields.q4_chooseYour;
    }
    else if (fields['19'] && typeof fields['19'] === 'string') {
        // Numbered field format
        const eventDate = fields['19'];
        if (eventDate.toLowerCase().includes('friday')) {
            chooseYour = 'Friday';
        }
        else if (eventDate.toLowerCase().includes('saturday')) {
            chooseYour = 'Saturday';
        }
    }
    else if (fields['4'] && fields['4'].answer) {
        // Alternative format using numbered fields
        chooseYour = fields['4'].answer;
    }
    logger_1.default.info('Parsed chooseYour field', {
        q19_eventDate: fields.q19_eventDate,
        field19: fields['19'],
        q4_chooseYour: fields.q4_chooseYour,
        chooseYour
    });
    logger_1.default.info('Final parsed submission data', {
        formId, email, name, invoiceNo, phone, church, quantity, productDetails, totalAmount, chooseYour
    });
    return {
        formId,
        email,
        name,
        invoiceNo,
        phone,
        church,
        quantity,
        productDetails,
        totalAmount,
        chooseYour,
    };
};
//# sourceMappingURL=jotform.service.js.map