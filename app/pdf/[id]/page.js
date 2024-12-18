'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { firestore } from '@/lib/FirebaseConfig';
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Container, Typography, Button, TextField, Box, Card, CardContent, CircularProgress, Paper, IconButton } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#424242',
        },
        background: {
            default: '#f0f2f5',
        }
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
        h4: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 500,
        },
        body1: {
            fontSize: '1rem',
        },
        caption: {
            fontSize: '0.875rem',
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                    padding: '10px 20px',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    padding: '20px',
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
                    let pdfDoc = await getDoc(doc(firestore, 'pdfs', id));
                    if (!pdfDoc.exists()) {
                        pdfDoc = await getDoc(doc(firestore, 'thermomix', id));
                    }
                    if (pdfDoc.exists()) {
                        const pdfData = pdfDoc.data();
                        setPdf({ ...pdfData, ref: pdfDoc.ref });

                        const commentsSnapshot = await getDocs(collection(firestore, pdfDoc.ref.parent.path, id, 'comments'));
                        const commentsList = commentsSnapshot.docs.map(doc => ({
                            ...doc.data(),
                            id: doc.id,
                            timestamp: doc.data().timestamp.toDate() // Convert Firestore Timestamp to JavaScript Date
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
                const docRef = await addDoc(collection(firestore, pdf.ref.parent.path, id, 'comments'), {
                    text: newComment,
                    timestamp
                });
                setComments([{ text: newComment, timestamp, id: docRef.id }, ...comments]);
                setNewComment('');
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await deleteDoc(doc(firestore, pdf.ref.parent.path, id, 'comments', commentId));
            setComments(comments.filter(comment => comment.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const isImage = (url) => {
        return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
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
                                                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
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
                                        {isImage(pdf.url) ? (
                                            <img
                                                src={pdf.url}
                                                alt={pdf.title}
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    display: 'block'
                                                }}
                                            />
                                        ) : (
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
                                        )}
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
                                                    <Card key={index} sx={{ position: 'relative' }}>
                                                        <CardContent>
                                                            <Typography variant="body1" sx={{ mb: 1 }}>
                                                                {comment.text}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {comment.timestamp.toLocaleString()}
                                                            </Typography>
                                                            <IconButton
                                                                color="secondary"
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                sx={{ position: 'absolute', top: 8, right: 8 }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
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
