// pages/recipe/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebaseConfig';

export default function RecipeDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [recipe, setRecipe] = useState(null);

    useEffect(() => {
        if (id) {
            const fetchRecipe = async () => {
                try {
                    const docRef = doc(firestore, 'recipes', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setRecipe(docSnap.data());
                    } else {
                        console.error('No such document!');
                    }
                } catch (error) {
                    console.error('Error fetching recipe:', error);
                }
            };

            fetchRecipe();
        }
    }, [id]);

    if (!recipe) return <p>Loading...</p>;

    return (
        <div>
            <h1>{recipe.title}</h1>
            <img src={recipe.imageUrls[0]} alt={recipe.title} width="300" />
            <p>Main Ingredient: {recipe.ingredient}</p>
            {/* Voeg hier meer details toe */}
        </div>
    );
}
