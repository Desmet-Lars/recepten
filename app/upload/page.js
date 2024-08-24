// pages/upload.js
'use client'
import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';

export default function Upload() {
    const { register, handleSubmit } = useForm();
    const [file, setFile] = useState(null);
    const [pdfUrl, setPdfUrl] = useState('');

    const onSubmit = async (data) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', data.title);
        formData.append('ingredient', data.ingredient);

        try {
            const response = await axios.post('/api/upload-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setPdfUrl(response.data.url);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input type="text" placeholder="PDF Title" {...register('title')} required />
            <input type="text" placeholder="Main Ingredient" {...register('ingredient')} required />
            <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf" required />
            <button type="submit">Upload PDF</button>
            {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer">View Uploaded PDF</a>}
        </form>
    );
}
