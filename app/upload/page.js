// pages/upload.js
'use client'
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/FirebaseConfig';
import { useForm } from 'react-hook-form';

export default function Upload() {
  const { register, handleSubmit } = useForm();
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState("");

  const onSubmit = async (data) => {
    if (image) {
      const storageRef = ref(storage, `recipes/${image.name}`);
      await uploadBytes(storageRef, image);
      const url = await getDownloadURL(storageRef);

      // Verwerk hier je gegevens (bijvoorbeeld verzenden naar een server of opslaan in Firestore)
      console.log('Image URL:', url);
      console.log('Recipe Title:', data.title);
      console.log('Main Ingredient:', data.ingredient);
    }
  };

  return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="text" placeholder="Recipe Title" {...register('title')} required />
        <input type="text" placeholder="Main Ingredient" {...register('ingredient')} required />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} required />
        <button type="submit">Upload Recipe</button>
      </form>
  );
}
