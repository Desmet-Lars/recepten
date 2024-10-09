'use client'
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { firestore, storage } from '@/lib/FirebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, TextField, Button, Typography, CircularProgress, Card, CardContent, CardMedia, Grid, Box, Paper, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, MenuItem, Select, InputLabel, FormControl as FormControlMUI } from '@mui/material';

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

// Function to get color based on rating
const getRatingColor = (rating) => {
    if (rating >= 3) {
        return 'green';  // High rating (3 or above)
    } else if (rating >= 2) {
        return 'yellow'; // Medium rating (2.5 - 3.9)
    } else {
        return 'red';    // Low rating (below 2.5)
    }
};

export default function Home() {
    const { register, handleSubmit, reset, setValue } = useForm();
    const [file, setFile] = useState(null);
    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfs, setPdfs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [rating, setRating] = useState('3'); // Default rating
    const [sortBy, setSortBy] = useState('title'); // Default sort by 'title'

    const onSubmit = async (data) => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        setUploading(true);

        try {
            const url = await uploadFile(file);
            await savePdfData({ ...data, rating }, url);  // Add rating to data
            alert('File uploaded successfully');
            resetForm();
            fetchPdfs();
        } catch (error) {
            alert('An error occurred. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const uploadFile = (file) => {
        return new Promise((resolve, reject) => {
            const storageReference = storageRef(storage, `pdfs/${file.name}`);
            const uploadTask = uploadBytesResumable(storageReference, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => reject(error),
                async () => {
                    try {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(url);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    };

    const savePdfData = async (data, url) => {
        await addDoc(collection(firestore, 'pdfs'), {
            title: data.title,
            ingredient: data.ingredient,
            url,
            comments: [],
            rating: data.rating, // Capture rating correctly
        });
    };

    const resetForm = () => {
        reset();
        setFile(null);
        setPreviewUrl('');
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

    // Filter the PDFs based on the search query
    const filteredPdfs = pdfs.filter((pdf) =>
        pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pdf.ingredient.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort the PDFs based on the selected sort criterion
    const sortedPdfs = [...filteredPdfs].sort((a, b) => {
        if (sortBy === 'title') {
            return a.title.localeCompare(b.title);
        } else if (sortBy === 'rating') {
            return b.rating - a.rating; // Descending order for ratings (higher first)
        }
        return 0;
    });

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 6 }}>
                <Container maxWidth="md">

                    {/* Upload Form */}
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <Typography variant="h4" gutterBottom color="primary">
                            Upload Recipe
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
                            {/* Radio Group for Rating */}
                            <FormControl component="fieldset" sx={{ mt: 0 }}>
                                <FormLabel component="legend">Rating</FormLabel>
                                <RadioGroup
                                    row
                                    value={rating}
                                    onChange={(e) => setRating(e.target.value)} // Update the rating
                                >
                                    <FormControlLabel value="1" control={<Radio sx={{ color: getRatingColor(1) }} />} label="1" />
                                    <FormControlLabel value="2" control={<Radio sx={{ color: getRatingColor(2) }} />} label="2" />
                                    <FormControlLabel value="3" control={<Radio sx={{ color: getRatingColor(3) }} />} label="3" />
                                </RadioGroup>
                            </FormControl>

                            <Button
                                variant="contained"
                                component="label"
                                sx={{ mt: 2 }}
                            >
                                Choose PDF
                                <input
                                    type="file"
                                    accept=".pdf"
                                    hidden
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                            </Button>
                            {file && (
                                <Typography variant="body1" marginTop={2}>
                                    Selected PDF: {file.name}
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
                                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">View PDF</a>
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

                    {/* Sort By Dropdown */}
                    <Box sx={{ mt: 4 }}>
                        <FormControlMUI fullWidth>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                label="Sort By"
                            >
                                <MenuItem value="title">Title</MenuItem>
                                <MenuItem value="rating">Rating</MenuItem>
                            </Select>
                        </FormControlMUI>
                    </Box>

                    {/* Display PDFs */}
                    <Typography variant="h5" gutterBottom sx={{ mt: 6 }} color="primary">
                        Recipe Dashboard
                    </Typography>
                    {loading ? (
                        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {sortedPdfs.map((pdf) => (
                                <Grid item xs={12} sm={6} md={4} key={pdf.id}>
                                    <Card sx={{ boxShadow: 2, '&:hover': { boxShadow: 6 } }}>
                                        <CardContent>
                                            <Typography variant="h6" noWrap>
                                                <a href={`/pdf/${pdf.id}`} style={{ textDecoration: 'none', color: theme.palette.primary.main }}>
                                                    {pdf.title}
                                                </a>
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Main Ingredient: {pdf.ingredient}
                                            </Typography>

                                            {/* Display colored rating */}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#fff',
                                                    backgroundColor: getRatingColor(pdf.rating),
                                                    borderRadius: '4px',
                                                    display: 'inline-block',
                                                    padding: '4px 8px',
                                                    marginTop: '8px',
                                                }}
                                            >
                                                { " " }
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
