import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from './db';

// Helper: Convert Base64 Data URL to Blob
const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
};

// Helper: Convert Blob to Base64 Data URL
const blobToDataURL = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export async function exportData() {
    const zip = new JSZip();
    const mocks = await db.mocks.toArray();
    const cleanMocks = [];

    // Create a folder for images inside the zip
    const imgFolder = zip.folder("images");

    for (const mock of mocks) {
        // Generate a unique filename
        const filename = `img_${mock.id}_${Date.now()}.jpg`;
        
        // Convert the stored Base64 to a Blob and add to zip
        const blob = dataURLtoBlob(mock.image);
        imgFolder.file(filename, blob);

        // Create a copy of the mock data referencing the filename instead of the base64 string
        const { image, ...mockData } = mock;
        cleanMocks.push({ ...mockData, imageFileName: filename });
    }

    // Add the data JSON
    zip.file("data.json", JSON.stringify(cleanMocks, null, 2));

    // Generate zip
    const content = await zip.generateAsync({ type: "blob" });
    const timestamp = new Date().toISOString().split('T')[0];
    saveAs(content, `MockMaster_Backup_${timestamp}.zip`);
}

export async function importData(file) {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    // Read data.json
    const dataFile = loadedZip.file("data.json");
    if (!dataFile) throw new Error("Invalid backup file: data.json missing");
    
    const jsonStr = await dataFile.async("string");
    const mocks = JSON.parse(jsonStr);

    let count = 0;

    for (const mock of mocks) {
        // Read the image file from the zip
        const imageFile = loadedZip.file(`images/${mock.imageFileName}`);
        if (imageFile) {
            const blob = await imageFile.async("blob");
            const base64Data = await blobToDataURL(blob);

            // Sanitize: remove ID to let Dexie auto-increment (prevents collisions)
            const { id, imageFileName, ...mockData } = mock;
            
            await db.mocks.add({
                ...mockData,
                image: base64Data,
                importedAt: new Date() // Optional: track import date
            });
            count++;
        }
    }
    return count;
}