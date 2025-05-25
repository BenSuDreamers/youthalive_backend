import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';

// Base URL for Jotform API
const JOTFORM_API_BASE_URL = 'https://api.jotform.com';

// Interface for Event data from Jotform
export interface JotformEvent {
  formId: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

// Interface for parsed webhook data
export interface ParsedSubmission {
  email: string;
  name: string;
  invoiceNo: string;
  formId: string;
  phone?: string;
  church?: string;
  youthMinistry?: string;
  eventName?: string;
  eventDate?: string;
}

/**
 * Get live events from Jotform API
 * @returns Promise resolving to array of event objects
 */
export const getLiveEvents = async (): Promise<JotformEvent[]> => {
  try {
    // Make API request to get all forms
    const response = await axios.get(`${JOTFORM_API_BASE_URL}/user/forms`, {
      params: {
        apiKey: config.jotform.apiKey,
        limit: 100, // Adjust as needed
        filter: {
          status: 'ENABLED' // Only get active forms
        }
      }
    });

    // Check if request was successful
    if (response.data.responseCode !== 200) {
      throw new Error(`Jotform API error: ${response.data.message}`);
    }    // Extract and transform form data to our event format
    // Note: You might need to extract actual event dates from form questions
    const events: JotformEvent[] = response.data.content
      .filter((form: any) => form.status === 'ENABLED')
      .map((form: any) => {
        // Safe date parsing with robust validation
        let startTime: Date;
        let endTime: Date;
        
        try {
          // Try to parse the created_at timestamp
          if (form.created_at && typeof form.created_at === 'string' && !isNaN(Number(form.created_at))) {
            // Unix timestamp (string)
            startTime = new Date(parseInt(form.created_at) * 1000);
          } else if (form.created_at && typeof form.created_at === 'number' && !isNaN(form.created_at)) {
            // Unix timestamp (number)
            startTime = new Date(form.created_at * 1000);
          } else if (form.created_at && typeof form.created_at === 'string') {
            // Try direct string parsing
            startTime = new Date(form.created_at);
          } else {
            // No created_at, use current time
            startTime = new Date();
          }
          
          // Validate the parsed date is actually valid
          if (!startTime || isNaN(startTime.getTime()) || startTime.getTime() <= 0) {
            logger.warn(`Invalid startTime for form ${form.id}, using current date`, { 
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
            } catch (error) {
          // Fallback dates in case of any parsing error
          logger.warn(`Exception parsing dates for form ${form.id}, using defaults`, { 
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

    logger.info(`Retrieved ${events.length} live events from Jotform`);
    return events;  } catch (error) {
    logger.error('Error fetching events from Jotform', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Failed to fetch events from Jotform');
  }
};

/**
 * Parse webhook data from Jotform submission
 * @param payload The raw webhook payload from Jotform
 * @returns Parsed submission data
 */
export const parseWebhook = (payload: any): ParsedSubmission => {
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
    const parsedSubmission: ParsedSubmission = {
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

    logger.info('Webhook data parsed successfully', { formId, email, invoiceNo });
    return parsedSubmission;
  } catch (error) {
    logger.error('Error parsing webhook data', { error, payload });
    throw new Error('Failed to parse webhook data');
  }
};

/**
 * Helper function to extract values from Jotform submission
 * Handles different formats of submission data
 */
const getSubmissionValue = (submission: any, field: string): string | undefined => {
  if (!submission) return undefined;
  
  // Stadium Registration Form field mappings based on your form analysis
  const fieldMappings: { [key: string]: string[] } = {
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
      return value?.toString();
    }
  }
  
  return undefined;
};