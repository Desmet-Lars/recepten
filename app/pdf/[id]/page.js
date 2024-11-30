'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { firestore } from '@/lib/FirebaseConfig';
import { doc, getDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { Container, Typography, Button, TextField, Box, Card, CardContent, CircularProgress, Paper, IconButton } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2196f3',
        },
        secondary: {
            main: '#424242',
        },
        background: {
            default: '#f5f5f5',
        }
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
        h4: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 500,
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }
            }
        }
    }
});

export default function PdfViewer() {
    const { id } = useParams();
    const [pdf, setPdf] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchPdfData = async () => {
                setLoading(true);
                try {
                    const pdfDoc = await getDoc(doc(firestore, 'pdfs', id));
                    if (pdfDoc.exists()) {
                        const pdfData = pdfDoc.data();
                        setPdf(pdfData);

                        const commentsSnapshot = await getDocs(collection(firestore, 'pdfs', id, 'comments'));
                        const commentsList = commentsSnapshot.docs.map(doc => ({
                            ...doc.data(),
                            id: doc.id
                        })).sort((a, b) => b.timestamp - a.timestamp);
                        setComments(commentsList);
                    } else {
                        console.error('PDF not found');
                    }
                } catch (error) {
                    console.error('Error fetching PDF or comments:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchPdfData();
        }
    }, [id]);

    const handleAddComment = async () => {
        if (newComment.trim()) {
            try {
                const timestamp = new Date();
                await addDoc(collection(firestore, 'pdfs', id, 'comments'), {
                    text: newComment,
                    timestamp
                });
                setComments([{ text: newComment, timestamp }, ...comments]);
                setNewComment('');
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
                <Container maxWidth="lg">
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                            <CircularProgress size={40} />
                        </Box>
                    ) : (
                        <>
                            {pdf ? (
                                <>
                                    <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <IconButton
                                            href="/"
                                            color="primary"
                                            sx={{
                                                bgcolor: 'white',
                                                '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' }
                                            }}
                                        >
                                            <ArrowBackIcon />
                                        </IconButton>
                                        <Typography variant="h4" color="primary">
                                            {pdf.title}
                                        </Typography>
                                    </Box>

                                    <Paper
                                        elevation={2}
                                        sx={{
                                            mb: 4,
                                            overflow: 'hidden',
                                            borderRadius: 2
                                        }}
                                    >
                                        <iframe
                                            src={pdf.url}
                                            title="PDF Viewer"
                                            style={{
                                                width: '100%',
                                                height: '80vh',
                                                border: 'none',
                                                display: 'block'
                                            }}
                                        />
                                    </Paper>

                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="h6" color="secondary" gutterBottom>
                                            Voeg commentaar toe
                                        </Typography>
                                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                label="Je commentaar"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                multiline
                                                rows={3}
                                                sx={{ mb: 2 }}
                                            />
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                                sx={{ px: 4 }}
                                            >
                                                Plaats commentaar
                                            </Button>
                                        </Paper>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" color="secondary" gutterBottom>
                                            Commentaar ({comments.length})
                                        </Typography>
                                        {comments.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {comments.map((comment, index) => (
                                                    <Card key={index}>
                                                        <CardContent>
                                                            <Typography variant="body1" sx={{ mb: 1 }}>
                                                                {comment.text}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {comment.timestamp.toDate().toLocaleString()}
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="body1" color="text.secondary">
                                                Nog geen commentaar geplaatst.
                                            </Typography>
                                        )}
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <Typography variant="h6" color="text.secondary">
                                        PDF niet gevonden.
                                    </Typography>
                                    <Button
                                        href="/"
                                        variant="contained"
                                        sx={{ mt: 2 }}
                                    >
                                        Terug naar home
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Container>
            </Box>
        </ThemeProvider>
    );
}
