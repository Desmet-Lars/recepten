// pages/api/recipes.js
import { NextApiRequest, NextApiResponse } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../lib/firebaseConfig';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const querySnapshot = await getDocs(collection(firestore, 'recipes'));
            const recipes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            res.status(200).json(recipes);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            res.status(500).json({ error: 'Error fetching recipes' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
