import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from './db';

// Helper: Convert Base64 Data URL to Blob
const dataURLtoBlob = (dataurl) => {
    if (!dataurl) return null;
    try {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error("Error converting image to blob:", e);
        return null;
    }
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
        // Handle Schema differences (Single 'image' vs Array 'images')
        let imageList = [];
        if (Array.isArray(mock.images)) {
            imageList = mock.images;
        } else if (mock.image) {
            imageList = [mock.image];
        }

        const imageFileNames = [];

        // Process all images for this mock
        if (imageList.length > 0) {
            imageList.forEach((imgData, idx) => {
                const blob = dataURLtoBlob(imgData);
                if (blob) {
                    // Create unique filename: img_ID_INDEX_TIMESTAMP.jpg
                    const filename = `img_${mock.id}_${idx}_${Date.now()}.jpg`;
                    imgFolder.file(filename, blob);
                    imageFileNames.push(filename);
                }
            });
        }

        // Clean data: Remove heavy base64 strings, keep metadata
        // We strip 'image' and 'images' and replace with 'imageFileNames'
        const { image, images, ...mockData } = mock;
        cleanMocks.push({ 
            ...mockData, 
            imageFileNames // This links the JSON to the files in the zip
        });
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
        const restoredImages = [];

        // 1. Handle New Format (Array of filenames)
        if (Array.isArray(mock.imageFileNames)) {
            for (const fileName of mock.imageFileNames) {
                const imageFile = loadedZip.file(`images/${fileName}`);
                if (imageFile) {
                    const blob = await imageFile.async("blob");
                    const base64Data = await blobToDataURL(blob);
                    restoredImages.push(base64Data);
                }
            }
        } 
        // 2. Handle Legacy Format (Single filename from old backups)
        else if (mock.imageFileName) {
            const imageFile = loadedZip.file(`images/${mock.imageFileName}`);
            if (imageFile) {
                const blob = await imageFile.async("blob");
                const base64Data = await blobToDataURL(blob);
                restoredImages.push(base64Data);
            }
        }

        // Only add if we successfully recovered data
        if (restoredImages.length > 0 || mock.question) {
            // Sanitize: remove ID to let Dexie auto-increment
            // Remove temporary file linking keys
            const { id, imageFileName, imageFileNames, ...mockData } = mock;
            
            await db.mocks.add({
                ...mockData,
                images: restoredImages, // Standardize to array
                importedAt: new Date(),
                // Ensure legacy fields don't sneak in
                image: undefined 
            });
            count++;
        }
    }
    return count;
}