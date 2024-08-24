// pages/recipe/[name].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebaseConfig';

export default function RecipeDetail() {
    const router = useRouter();
    const { name } = router.query;
    const [imageURL, setImageURL] = useState('');

    useEffect(() => {
        if (name) {
            const fetchImage = async () => {
                const imageRef = ref(storage, `recipes/${name}`);
                const url = await getDownloadURL(imageRef);
                setImageURL(url);
            };

            fetchImage();
        }
    }, [name]);

    return (
        <div>
            <h1>{name}</h1>
            <img src={imageURL} alt={name} width="300" />
            {/* Hier kun je nog meer informatie over het recept toevoegen */}
        </div>
    );
}
