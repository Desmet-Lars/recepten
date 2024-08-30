'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Use useParams for dynamic routes
import { firestore } from '@/lib/FirebaseConfig';
import { doc, getDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { Container, Typography, Button, TextField, Box, Card, CardContent, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Document, Page } from 'react-pdf';

// Define a custom theme (you can customize this as needed)
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#black',
        },
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
    },
});

export default function PdfViewer() {
    const { id } = useParams(); // Use useParams to get route parameters
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
                        const commentsList = commentsSnapshot.docs.map(doc => doc.data());
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
                await addDoc(collection(firestore, 'pdfs', id, 'comments'), { text: newComment, timestamp: new Date() });
                setComments([...comments, { text: newComment, timestamp: new Date() }]);
                setNewComment('');
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="md" sx={{ py: 6 }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {pdf ? (
                            <>
                                <a href="/">                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleAddComment}
                                        sx={{ mt: 2 }}
                                    >
                                        terug
                                    </Button></a>
                                <Typography variant="h4" gutterBottom color="primary">
                                    {pdf.title}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Document
                                        file={pdf}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        options={{ cMapUrl: 'cmaps/', cMapPacked: true }}
                                    >
                                        <Page pageNumber={pageNumber} />
                                    </Document>
                                    <Box sx={{ mt: 2 }}>
                                        {numPages && (
                                            <Typography variant="body1">
                                                Page {pageNumber} of {numPages}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>


                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="h6" color="secondary">Voeg commentaar</Typography>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label="Je commentaar"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        multiline
                                        rows={4}
                                        sx={{ mt: 2 }}
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleAddComment}
                                        sx={{ mt: 2 }}
                                    >
                                        Voeg commentaar toe
                                    </Button>
                                </Box>
                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="h6" color="secondary">Commentaar</Typography>
                                    {comments.length > 0 ? (
                                        comments.map((comment, index) => (
                                            <Card key={index} sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <Typography variant="body1">{comment.text}</Typography>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <Typography variant="body1">Geen commentaar.</Typography>
                                    )}
                                </Box>
                            </>
                        ) : (
                            <Typography variant="body1">PDF niet gevonden.</Typography>
                        )}
                    </>
                )}
            </Container>
        </ThemeProvider>
    );
}
