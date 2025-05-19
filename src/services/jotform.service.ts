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
    }

    // Extract and transform form data to our event format
    // Note: You might need to adjust this based on how you identify "events" in your forms
    const events: JotformEvent[] = response.data.content
      .filter((form: any) => form.status === 'ENABLED')
      .map((form: any) => ({
        formId: form.id,
        title: form.title,
        // Note: You may need to extract actual event dates from form questions
        // This is a placeholder assuming dates are stored in form properties
        startTime: new Date(form.created_at * 1000), // Convert Unix timestamp
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Example: 7 days from now
      }));

    logger.info(`Retrieved ${events.length} live events from Jotform`);
    return events;
  } catch (error) {
    logger.error('Error fetching events from Jotform', { error });
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
  // Try multiple common patterns for accessing form fields
  // Adjust based on the actual structure of your webhook data
  if (!submission) return undefined;
  
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