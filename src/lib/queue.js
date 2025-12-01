import { analyzeImage } from './gemini';
import { addPlaceholderMock, updateMockWithAI, failMock } from './db';

/**
 * Starts the analysis process in the "background".
 * It creates a DB entry immediately, then runs the heavy async task.
 * Since this is client-side JS, "background" means it runs as long as the tab is open.
 */
export async function processImagesInBackground(images) {
  let mockId;
  
  try {
    // 1. Create a placeholder immediately so user sees it in Dashboard
    mockId = await addPlaceholderMock(images);

    // 2. Start the heavy lifting (Fire and forget from UI perspective)
    analyzeMock(mockId, images);
    
    return mockId;
  } catch (err) {
    console.error("Queue Start Error:", err);
    throw err;
  }
}

async function analyzeMock(id, images) {
  try {
    // Perform the actual API call
    const aiData = await analyzeImage(images);
    
    // Update the DB entry
    await updateMockWithAI(id, aiData);
    
  } catch (error) {
    console.error(`Processing failed for mock ${id}:`, error);
    await failMock(id, error.message);
  }
}