// pages/api/pdfs.js
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../lib/firebaseConfig';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const snapshot = await getDocs(collection(firestore, 'pdfs'));
            const pdfs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.status(200).json(pdfs);
        } catch (error) {
            console.error('Error fetching PDFs:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
