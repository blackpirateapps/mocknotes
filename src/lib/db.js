import Dexie from 'dexie';

export const db = new Dexie('MockMasterDB');

// Version 3: Add 'status' field for background processing
db.version(3).stores({
  mocks: '++id, createdAt, subject, topic, status'
}).upgrade(tx => {
    return tx.table("mocks").toCollection().modify(mock => {
        // Default existing mocks to 'done'
        mock.status = mock.status || 'done';
    });
});

/**
 * Adds a placeholder mock immediately and returns its ID.
 * The queue processor will update this entry later.
 */
export async function addPlaceholderMock(imagesData) {
  return await db.mocks.add({
    images: imagesData,
    question: "Analyzing...", // Placeholder text
    options: [],
    correctIndex: -1,
    explanation: "",
    subject: "Processing",
    topic: "Pending",
    status: "processing",
    createdAt: new Date(),
    userNotes: []
  });
}

/**
 * Updates a mock with the AI results
 */
export async function updateMockWithAI(id, aiData) {
  return await db.mocks.update(id, {
    question: aiData.question,
    options: aiData.options,
    correctIndex: aiData.correctIndex,
    explanation: aiData.explanation,
    subject: aiData.subject || "Uncategorized",
    topic: aiData.topic || "General",
    status: 'done'
  });
}

/**
 * Marks a mock as failed
 */
export async function failMock(id, errorMsg) {
  return await db.mocks.update(id, {
    question: "Failed to Analyze",
    explanation: `Error: ${errorMsg}. Please try deleting and re-uploading.`,
    status: 'error'
  });
}