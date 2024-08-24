// pages/api/upload-pdf.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, firestore } from '../../lib/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const form = new formidable.IncomingForm();
        form.uploadDir = path.join(process.cwd(), '/tmp');
        form.keepExtensions = true;

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).json({ error: 'Error parsing form' });
            }

            const file = files.file[0];
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const filePath = file.filepath;
            const fileName = path.basename(filePath);
            const storageRef = ref(storage, `pdfs/${fileName}`);

            try {
                const fileData = fs.readFileSync(filePath);
                await uploadBytes(storageRef, fileData);
                const url = await getDownloadURL(storageRef);

                // Save metadata to Firestore
                await addDoc(collection(firestore, 'pdfs'), {
                    title: fields.title[0],
                    ingredient: fields.ingredient[0],
                    url
                });

                fs.unlinkSync(filePath);
                res.status(200).json({ success: true, url });
            } catch (error) {
                console.error('Error uploading PDF:', error);
                res.status(500).json({ error: error.message });
            }
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
