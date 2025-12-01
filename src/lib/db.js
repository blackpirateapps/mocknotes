import Dexie from 'dexie';

export const db = new Dexie('MockMasterDB');

db.version(1).stores({
  mocks: '++id, createdAt' // Primary key and index
});

export async function addMock(imageData, aiData) {
  return await db.mocks.add({
    image: imageData, // Base64 string
    question: aiData.question,
    options: aiData.options,
    correctIndex: aiData.correctIndex, // 0-based index
    explanation: aiData.explanation,
    createdAt: new Date(),
    userNotes: []
  });
}