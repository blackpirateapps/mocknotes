import Dexie from 'dexie';

export const db = new Dexie('MockMasterDB');

// Updated schema to include subject and topic for indexing
db.version(2).stores({
  mocks: '++id, createdAt, subject, topic'
}).upgrade(tx => {
    // Migration script if needed for existing data
    return tx.table("mocks").toCollection().modify(mock => {
        mock.subject = mock.subject || "Uncategorized";
        mock.topic = mock.topic || "General";
        if (typeof mock.image === 'string') {
            mock.images = [mock.image];
            delete mock.image;
        }
    });
});

export async function addMock(imagesData, aiData) {
  return await db.mocks.add({
    images: imagesData, // Array of Base64 strings
    question: aiData.question,
    options: aiData.options,
    correctIndex: aiData.correctIndex,
    explanation: aiData.explanation,
    subject: aiData.subject || "GS", // Default fallback
    topic: aiData.topic || "General",
    createdAt: new Date(),
    userNotes: []
  });
}