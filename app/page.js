'use client'
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { firestore, storage } from '@/lib/FirebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, TextField, Button, Typography, CircularProgress, Card, CardContent, CardMedia, Grid, Box, Paper, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, MenuItem, Select, InputLabel, FormControl as FormControlMUI } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

// Define a custom theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2'
        },
        secondary: {
            main: '#f50057',
            light: '#ff4081',
            dark: '#c51162'
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff'
        }
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
            marginBottom: '1rem'
        },
        h5: {
            fontWeight: 500,
            marginBottom: '0.75rem'
        },
        h6: {
            fontWeight: 500
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '8px 24px'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    transition: 'all 0.3s ease-in-out'
                }
            }
        }
    }
});

// Function to get color based on rating
const getRatingColor = (rating) => {
    if (rating >= 3) {
        return '#4caf50';  // Success green
    } else if (rating >= 2) {
        return '#ff9800'; // Warning orange
    } else {
        return '#f44336';  // Error red
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
    const [rating, setRating] = useState('3');
    const [sortBy, setSortBy] = useState('title');

    const onSubmit = async (data) => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        setUploading(true);

        try {
            const url = await uploadFile(file);
            await savePdfData({ ...data, rating }, url);
            alert('Recipe uploaded successfully!');
            resetForm();
            fetchPdfs();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload recipe. Please try again.');
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
                    console.log(`Upload progress: ${Math.round(progress)}%`);
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
            title: data.title.trim(),
            ingredient: data.ingredient.trim(),
            url,
            comments: [],
            rating: Number(data.rating),
            createdAt: new Date().toISOString()
        });
    };

    const resetForm = () => {
        reset();
        setFile(null);
        setPreviewUrl('');
        setRating('3');
    };

    const fetchPdfs = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(firestore, 'pdfs'));
            const pdfsList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                rating: Number(doc.data().rating) // Ensure rating is a number
            }));
            setPdfs(pdfsList);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            alert('Failed to load recipes. Please try again.');
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
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [file]);

    // Filter PDFs based on search query
    const filteredPdfs = pdfs.filter((pdf) =>
        pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pdf.ingredient.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort PDFs based on selected criterion
    const sortedPdfs = [...filteredPdfs].sort((a, b) => {
        if (sortBy === 'title') {
            return a.title.localeCompare(b.title);
        } else if (sortBy === 'rating') {
            return b.rating - a.rating;
        }
        return 0;
    });

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
                <Container maxWidth="lg">
                    {/* Upload Form */}
                    <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: '16px' }}>
                        <Typography variant="h4" color="primary" align="center">
                            Upload New Recipe
                        </Typography>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Recipe Title"
                                variant="outlined"
                                {...register('title')}
                                required
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                margin="normal"
                                label="Main Ingredient"
                                variant="outlined"
                                {...register('ingredient')}
                                required
                                sx={{ mb: 2 }}
                            />

                            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                                <FormLabel component="legend">Recipe Rating</FormLabel>
                                <RadioGroup
                                    row
                                    value={rating}
                                    onChange={(e) => setRating(e.target.value)}
                                    sx={{ justifyContent: 'center' }}
                                >
                                    {[1, 2, 3].map((value) => (
                                        <FormControlLabel
                                            key={value}
                                            value={value.toString()}
                                            control={
                                                <Radio
                                                    sx={{
                                                        color: getRatingColor(value),
                                                        '&.Mui-checked': {
                                                            color: getRatingColor(value)
                                                        }
                                                    }}
                                                />
                                            }
                                            label={value}
                                        />
                                    ))}
                                </RadioGroup>
                            </FormControl>

                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                >
                                    Choose PDF
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        hidden
                                        onChange={(e) => setFile(e.target.files[0])}
                                    />
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={uploading}
                                    fullWidth
                                >
                                    {uploading ? <CircularProgress size={24} /> : 'Upload Recipe'}
                                </Button>
                            </Box>

                            {file && (
                                <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
                                    Selected: {file.name}
                                </Typography>
                            )}
                        </form>

                        {previewUrl && (
                            <Card sx={{ mt: 4, overflow: 'hidden' }}>
                                <CardContent>
                                    <Typography variant="h6" color="secondary" gutterBottom>
                                        Preview
                                    </Typography>
                                    <CardMedia
                                        component="iframe"
                                        src={previewUrl}
                                        title="PDF Preview"
                                        sx={{ height: 500, width: '100%', border: 'none' }}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </Paper>

                    {/* Search and Sort Controls */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search recipes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                        />
                        <FormControlMUI sx={{ minWidth: 200 }}>
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

                    {/* Recipe Dashboard */}
                    <Typography variant="h5" color="primary" sx={{ mb: 3 }}>
                        Recipe Collection
                    </Typography>

                    {loading ? (
                        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {sortedPdfs.map((pdf) => (
                                <Grid item xs={12} sm={6} md={4} key={pdf.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 6
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" gutterBottom noWrap>
                                                <a
                                                    href={`/pdf/${pdf.id}`}
                                                    style={{
                                                        textDecoration: 'none',
                                                        color: theme.palette.primary.main,
                                                        '&:hover': {
                                                            color: theme.palette.primary.dark
                                                        }
                                                    }}
                                                >
                                                    {pdf.title}
                                                </a>
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 2 }}
                                            >
                                                Main Ingredient: {pdf.ingredient}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: 'inline-block',
                                                    bgcolor: getRatingColor(pdf.rating),
                                                    color: '#fff',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: '16px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                Rating: {pdf.rating}
                                            </Box>
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
