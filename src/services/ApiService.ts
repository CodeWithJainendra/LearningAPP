const API_BASE_URL = 'https://cdis.iitk.ac.in/inf_api';

export interface QuestionRequest {
  question: string;
  mode: string;
  subject: string;
  class: number;
  chapter: string;
  human_answer?: string;
}

export interface ApiResponse {
  answer?: string;
  error?: string;
  [key: string]: any;
}

// Helper function to detect subject from question
const detectSubjectFromQuestion = (question: string): string | null => {
  const questionLower = question.toLowerCase();

  // Physics keywords
  if (questionLower.includes('force') || questionLower.includes('motion') ||
      questionLower.includes('gravity') || questionLower.includes('magnetic') ||
      questionLower.includes('electric') || questionLower.includes('energy') ||
      questionLower.includes('wave') || questionLower.includes('light')) {
    return 'physics';
  }

  // Chemistry keywords
  if (questionLower.includes('atom') || questionLower.includes('molecule') ||
      questionLower.includes('element') || questionLower.includes('compound') ||
      questionLower.includes('reaction') || questionLower.includes('acid') ||
      questionLower.includes('base') || questionLower.includes('chemical')) {
    return 'chemistry';
  }

  // Biology keywords
  if (questionLower.includes('cell') || questionLower.includes('life') ||
      questionLower.includes('organism') || questionLower.includes('plant') ||
      questionLower.includes('animal') || questionLower.includes('tissue') ||
      questionLower.includes('organ') || questionLower.includes('living')) {
    return 'biology';
  }

  // Math keywords
  if (questionLower.includes('equation') || questionLower.includes('number') ||
      questionLower.includes('calculate') || questionLower.includes('solve') ||
      questionLower.includes('formula') || questionLower.includes('graph')) {
    return 'mathematics';
  }

  return null;
};

// Helper function to get appropriate chapter for cross-subject questions
const getGeneralChapter = (subject: string): string => {
  const generalChapters: { [key: string]: string } = {
    'physics': 'Force and law of motion',
    'chemistry': 'Atoms and Molecules',
    'biology': 'The Fundamentals Unit Of Life',
    'mathematics': 'Number Systems'
  };
  return generalChapters[subject] || 'General';
};

export const sendQuestion = async (params: {
  question: string;
  subject: string;
  class: number;
  chapter: string;
}): Promise<ApiResponse> => {
  try {
    console.log('=== sendQuestion called ===');
    console.log('Params received:', params);
    
    // Validate required parameters
    if (!params.class || params.class === undefined) {
      console.error('Class parameter is missing or undefined:', params);
      throw new Error('Class parameter is required');
    }

    // Detect if question might be from a different subject
    const detectedSubject = detectSubjectFromQuestion(params.question);
    let requestSubject = params.subject.toLowerCase();
    let requestChapter = params.chapter;

    // If question seems to be from a different subject, try that subject
    if (detectedSubject && detectedSubject !== params.subject.toLowerCase()) {
      console.log(`Question seems to be about ${detectedSubject}, but current context is ${params.subject}`);
      requestSubject = detectedSubject;
      requestChapter = getGeneralChapter(detectedSubject);
    }

    const requestBody = {
      question: params.question,
      mode: 'query', // Use query mode for asking questions as per your specification
      subject: requestSubject,
      class: params.class,
      chapter: requestChapter,
    };

    console.log('Sending request to API:', requestBody);
    console.log('API URL:', `${API_BASE_URL}/evaluate`);

    const response = await fetch(`${API_BASE_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);

      // If the detected subject failed, try with original subject and general chapter
      if (detectedSubject && detectedSubject !== params.subject.toLowerCase()) {
        console.log('Retrying with original subject and general chapter');
        const fallbackRequestBody = {
          question: params.question,
          mode: 'query',
          subject: params.subject.toLowerCase(),
          class: params.class,
          chapter: getGeneralChapter(params.subject.toLowerCase()),
        };

        try {
          const fallbackResponse = await fetch(`${API_BASE_URL}/evaluate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(fallbackRequestBody),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log('Fallback API Response received successfully');
            return fallbackData;
          }
        } catch (fallbackError) {
          console.log('Fallback request also failed');
        }
      }

      // Parse error response to provide better user feedback
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message && errorData.message.includes('Chapter') && errorData.message.includes('not found')) {
          return {
            answer: `I understand your question about "${params.question}". While I don't have specific content for this topic in the current chapter, I can provide a general answer:\n\nThis question seems to be related to a different subject area. I'll do my best to help based on general knowledge, but for more detailed information, you might want to scan a QR code related to the specific subject of your question.\n\nWould you like me to try answering based on general knowledge, or would you prefer to scan a QR code for the relevant subject?`,
            error: 'Chapter not found'
          };
        }
      } catch (parseError) {
        // If we can't parse the error, continue with generic error
      }

      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response received successfully');
    console.log('Response data keys:', Object.keys(data));
    console.log('Full response data:', data);

    // Extract the actual response text from the API response
    if (data && data.response) {
      return {
        answer: data.response,
        sources: data.sources,
        documents_found: data.documents_found,
        highlighted_pdf_url: data.highlighted_pdf_url,
        status: data.status,
        context: data.context
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return a helpful fallback response
    return {
      answer: `I'm having trouble accessing the learning content right now. Here's what I can tell you about ${params.subject}:\n\n${params.subject.charAt(0).toUpperCase() + params.subject.slice(1)} is a fascinating subject that helps us understand the world around us. While I work on reconnecting to get you detailed explanations, try asking me basic questions about the topic.\n\n💡 Tip: Make sure you're connected to the internet and try again in a moment.`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// For testing purposes - you can remove this later
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const testResponse = await sendQuestion({
      question: 'What is the difference between an atom and a molecule? Explain with examples.',
      subject: 'chemistry',
      class: 9,
      chapter: 'Atoms and Molecules',
    });

    return !!testResponse;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};
