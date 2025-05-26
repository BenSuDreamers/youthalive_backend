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
    });    // Check if request was successful
    if (response.data.responseCode !== 200) {
      throw new Error(`Jotform API error: ${response.data.message}`);
    }

    // Extract and transform form data to our event format
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
    return events;
  } catch (error) {
    logger.error('Error fetching events from Jotform', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Failed to fetch events from Jotform');
  }
};

export const parseWebhook = (payload: any): ParsedSubmission => {
  console.log('Received webhook payload:', JSON.stringify(payload, null, 2));
  
  try {
    // Log the entire payload to understand its structure
    logger.info('Parsing webhook payload', { 
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
        const formFields: any = {};
        
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
        
      } catch (parseError) {
        console.error('Failed to parse rawRequest:', parseError);
        // Fall through to try legacy parsing
      }
    }
    
    // Try legacy parsing if rawRequest parsing failed or doesn't exist
    console.log('Attempting legacy parsing...');
    const ticketData = parseFormFields(payload);
    console.log('Successfully parsed ticket data from legacy method:', ticketData);
    return ticketData;
    
  } catch (error) {
    console.error('Error in parseWebhook:', error);
    throw error;
  }
};

/**
 * Helper function to parse form fields and extract ticket data
 */
const parseFormFields = (fields: any): ParsedSubmission => {
  const formId = fields.formID || fields.form_id || fields.formId || '';
  
  // Initialize default values
  let email = '';
  let name = '';
  let invoiceNo = `INV-${Date.now()}`;
  let phone = '';
  let church = '';
  
  // Handle multipart form data format (direct field names)
  // Try multipart form field names first
  if (fields.q5_email) {
    email = fields.q5_email;
  } else if (fields.q4_email) {
    email = fields.q4_email;
  } else if (fields.email) {
    email = fields.email;
  }
  
  // Handle name - could be object or string
  if (fields.q3_name) {
    if (typeof fields.q3_name === 'object' && fields.q3_name !== null) {
      const nameObj = fields.q3_name as any;
      name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
    } else {
      name = String(fields.q3_name);
    }
  } else if (fields['q3_name[first]'] && fields['q3_name[last]']) {
    name = `${fields['q3_name[first]']} ${fields['q3_name[last]']}`.trim();
  } else if (fields.q4_fullName) {
    name = fields.q4_fullName;
  } else if (fields.name) {
    name = String(fields.name);
  }
  
  // Handle invoice ID
  if (fields.q7_invoiceId) {
    invoiceNo = fields.q7_invoiceId;
  } else if (fields.q11_autoincrement) {
    invoiceNo = fields.q11_autoincrement;
  } else if (fields.invoiceId) {
    invoiceNo = fields.invoiceId;
  }
  
  // Handle phone
  if (fields.q11_phoneNumber) {
    if (typeof fields.q11_phoneNumber === 'object' && fields.q11_phoneNumber !== null) {
      const phoneObj = fields.q11_phoneNumber as any;
      phone = phoneObj.full || String(fields.q11_phoneNumber);
    } else {
      phone = String(fields.q11_phoneNumber);
    }
  } else if (fields['q11_phoneNumber[full]']) {
    phone = fields['q11_phoneNumber[full]'];
  } else if (fields.phone) {
    phone = fields.phone;
  }
  
  // Handle church/youth group
  if (fields.q9_youthGroup) {
    church = fields.q9_youthGroup;
  } else if (fields.q12_textbox) {
    church = fields.q12_textbox;
  } else if (fields.church || fields.youthGroup) {
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
  
  // Legacy parsing logic for JSON payloads
  if (!email && !name) {
    // Handle different webhook payload formats
    let submissionData: any = {};
    
    // If rawRequest is a string, parse it to get the actual form field data
    if (typeof fields.rawRequest === 'string') {
      try {
        const parsed = JSON.parse(fields.rawRequest);
        submissionData = parsed;
        
        // Now try to parse the actual form fields from the rawRequest data
        // This contains the real form field names like q3_ltstronggtnameltstronggt, q4_email4, etc.
        
        // Extract email from various possible field names
        if (parsed.q4_email4) {
          email = parsed.q4_email4;
        } else if (parsed.q5_email) {
          email = parsed.q5_email;
        }
        
        // Extract name from various possible field names
        if (parsed.q3_ltstronggtnameltstronggt) {
          const nameObj = parsed.q3_ltstronggtnameltstronggt;
          if (typeof nameObj === 'object' && nameObj !== null) {
            name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
          } else {
            name = String(nameObj);
          }
        } else if (parsed.q3_name) {
          if (typeof parsed.q3_name === 'object' && parsed.q3_name !== null) {
            const nameObj = parsed.q3_name as any;
            name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
          } else {
            name = String(parsed.q3_name);
          }
        }
        
        // Extract invoice ID
        if (parsed.q11_invoiceId) {
          invoiceNo = parsed.q11_invoiceId;
        } else if (parsed.q7_invoiceId) {
          invoiceNo = parsed.q7_invoiceId;
        }
        
        // Extract phone
        if (parsed.q16_ltstronggtphoneNumberltstronggt) {
          phone = parsed.q16_ltstronggtphoneNumberltstronggt;
        } else if (parsed.q11_phoneNumber) {
          if (typeof parsed.q11_phoneNumber === 'object' && parsed.q11_phoneNumber !== null) {
            const phoneObj = parsed.q11_phoneNumber as any;
            phone = phoneObj.full || String(parsed.q11_phoneNumber);
          } else {
            phone = String(parsed.q11_phoneNumber);
          }
        }
        
        // Extract church/youth group
        if (parsed.q12_ltstronggtwhichYouth) {
          church = parsed.q12_ltstronggtwhichYouth;
        } else if (parsed.q9_youthGroup) {
          church = parsed.q9_youthGroup;
        }

        logger.info('Values extracted from rawRequest parsing', {
          name, email, invoiceNo, phone, church
        });
        
      } catch (e) {
        logger.warn('Failed to parse rawRequest JSON', { rawRequest: fields.rawRequest });
        submissionData = fields;
      }
    } else if (fields.rawRequest && typeof fields.rawRequest === 'object') {
      submissionData = fields.rawRequest;
    } else {
      // Use the fields directly
      submissionData = fields;
    }
    
    // Only use field mappings if we didn't extract values from rawRequest
    if (!email || !name || !invoiceNo) {
      logger.info('Using field mappings fallback since some values are missing', {
        hasEmail: !!email, hasName: !!name, hasInvoiceNo: !!invoiceNo
      });
      
      // Map fields based on form ID (different forms have different field structures)
      let fieldMappings: { [key: string]: string } = {};
      
      if (formId === '251442125173852') {
        // WebApp test form mappings
        fieldMappings = {
          name: '3',
          email: '4', 
          invoiceId: '11',
          church: '12',
          phone: '16'
        };
      } else if (formId === '241078261192858') {
        // Stadium 24 form mappings
        fieldMappings = {
          name: '4',
          email: '5',
          phone: '7',
          church: '10',
          invoiceId: '38'
        };
      } else {
        // Default/Stadium Registration Form mappings
        fieldMappings = {
          name: '3',
          email: '4',
          phone: '16',
          church: '12',
          invoiceId: '11'
        };
      }
      
      // Extract values using the appropriate field mappings only if not already set
      if (!name) {
        name = submissionData[fieldMappings.name] || '';
      }
      if (!email) {
        email = submissionData[fieldMappings.email] || '';
      }
      if (!invoiceNo) {
        invoiceNo = submissionData[fieldMappings.invoiceId] || `INV-${Date.now()}`;
      }
      if (!phone) {
        phone = submissionData[fieldMappings.phone] || '';
      }
      if (!church) {
        church = submissionData[fieldMappings.church] || '';
      }
      
      // Handle name field if it's an object (some forms return {first, last})
      if (typeof name === 'object' && name !== null) {
        const nameObj = name as any;
        if (nameObj.first || nameObj.last) {
          name = `${nameObj.first || ''} ${nameObj.last || ''}`.trim();
        } else {
          name = String(name);
        }
      }
    }
    
    // Clean invoice number format
    if (typeof invoiceNo === 'string' && invoiceNo.startsWith('# INV-')) {
      invoiceNo = invoiceNo.substring(6);
    }
    
    // Also handle "# " prefix without INV
    if (typeof invoiceNo === 'string' && invoiceNo.startsWith('# ')) {
      invoiceNo = invoiceNo.substring(2);
    }
    
    // Generate invoice number if still missing
    if (!invoiceNo) {
      invoiceNo = `INV-${Date.now()}`;
    }
  }

  // Create parsed submission object
  const parsedSubmission: ParsedSubmission = {
    formId,
    name,
    email,
    invoiceNo,
    phone,
    church,
    eventName: 'Youth Alive Event',
    eventDate: new Date().toLocaleDateString(),
  };

  logger.info('Webhook data parsed successfully', { 
    formId, 
    email, 
    invoiceNo, 
    name,
    phone,
    church,
    payloadKeys: Object.keys(fields)
  });
    return parsedSubmission;
};