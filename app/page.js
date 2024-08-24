'use client'
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { firestore, storage } from '@/lib/FirebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, TextField, Button, Typography, CircularProgress, Card, CardContent, CardMedia, Grid, Box, Paper } from '@mui/material';

// Define a custom theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#ff4081',
        },
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 500,
        },
    },
});

export default function Home() {
    const { register, handleSubmit, reset } = useForm();
    const [file, setFile] = useState(null);
    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfs, setPdfs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const onSubmit = async (data) => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        setUploading(true);

        const storageReference = storageRef(storage, `pdfs/${file.name}`);
        const uploadTask = uploadBytesResumable(storageReference, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                console.error('Error uploading file:', error);
                alert('Failed to upload file. Please try again.');
                setUploading(false);
            },
            async () => {
                try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    await addDoc(collection(firestore, 'pdfs'), {
                        title: data.title,
                        ingredient: data.ingredient,
                        url,
                    });

                    setPdfUrl(url);
                    alert('File uploaded successfully');
                    reset(); // Reset form fields
                    setFile(null); // Clear file state
                    setPreviewUrl(''); // Clear preview URL
                    fetchPdfs(); // Refresh list of PDFs
                } catch (error) {
                    console.error('Error saving metadata:', error);
                    alert('Failed to save file metadata. Please try again.');
                } finally {
                    setUploading(false);
                }
            }
        );
    };

    const fetchPdfs = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(firestore, 'pdfs'));
            const pdfsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setPdfs(pdfsList);
        } catch (error) {
            console.error('Error fetching PDFs:', error);
            alert('Failed to load PDFs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPdfs();
    }, []);

    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl); // Clean up
        }
    }, [file]);

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 6 }}>
                <Container maxWidth="md">
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <Typography variant="h4" gutterBottom color="primary">
                            Upload Recept
                        </Typography>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="PDF Title"
                                variant="outlined"
                                {...register('title')}
                                required
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Main Ingredient"
                                variant="outlined"
                                {...register('ingredient')}
                                required
                            />
                            <Button
                                variant="contained"
                                component="label"
                                sx={{ mt: 2 }}
                            >
                                Kies File
                                <input
                                    type="file"
                                    accept=".pdf"
                                    hidden
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                            </Button>
                            {file && (
                                <Typography variant="body1" marginTop={2}>
                                    Geselecteerde pdf: {file.name}
                                </Typography>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={uploading}
                                sx={{ mt: 2 }}
                            >
                                {uploading ? <CircularProgress size={24} /> : 'Upload PDF'}
                            </Button>
                            {pdfUrl && (
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">View Uploaded PDF</a>
                                </Typography>
                            )}
                        </form>

                        {previewUrl && (
                            <Card sx={{ mt: 4, boxShadow: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" color="secondary">PDF Preview</Typography>
                                    <CardMedia
                                        component="iframe"
                                        src={previewUrl}
                                        title="PDF Preview"
                                        sx={{ height: 500, width: '100%', border: 'none', mt: 2 }}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </Paper>

                    <Typography variant="h5" gutterBottom sx={{ mt: 6 }} color="primary">
                        Recepten Dashboard
                    </Typography>
                    {loading ? (
                        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {pdfs.map((pdf) => (
                                <Grid item xs={12} sm={6} md={4} key={pdf.id}>
                                    <Card sx={{ boxShadow: 2, '&:hover': { boxShadow: 6 } }}>
                                        <CardContent>
                                            <Typography variant="h6" noWrap>
                                                <a href={pdf.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: theme.palette.primary.main }}>{pdf.title}</a>
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Main Ingredient: {pdf.ingredient}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>
            </Box>
        </ThemeProvider>
    );
}
