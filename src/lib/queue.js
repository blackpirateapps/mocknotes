import { analyzeImage } from './gemini';
import { addPlaceholderMock, updateMockWithAI, failMock } from './db';

/**
 * Starts the analysis process in the background with retry logic.
 */
export async function processImagesInBackground(images) {
  let mockId;
  try {
    mockId = await addPlaceholderMock(images);
    // Start the analysis with retry parameters
    analyzeMockWithRetry(mockId, images);
    return mockId;
  } catch (err) {
    console.error("Queue Start Error:", err);
    throw err;
  }
}

/**
 * Performs the API call with Exponential Backoff for 429 errors.
 */
async function analyzeMockWithRetry(id, images, retries = 3, delay = 5000) {
  try {
    const aiData = await analyzeImage(images);
    await updateMockWithAI(id, aiData);
  } catch (error) {
    // Check if the error is a Rate Limit (429) error
    const isRateLimit = error.message?.includes('429') || 
                        error.status === 429 ||
                        error.message?.toLowerCase().includes('too many requests');

    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit for mock ${id}. Retrying in ${delay / 1000}s...`);
      
      // Update the UI text so the user knows it's waiting
      import('./db').then(dbMod => {
        dbMod.db.mocks.update(id, { question: `Rate limit hit. Retrying in ${delay/1000}s...` });
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      // Retry with fewer remaining attempts and double the delay
      return analyzeMockWithRetry(id, images, retries - 1, delay * 2);
    }
    
    console.error(`Processing failed for mock ${id}:`, error);
    await failMock(id, error.message);
  }
}