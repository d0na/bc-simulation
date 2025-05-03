import React, {useEffect, useState} from "react";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface CsvFileDTO {
    id: number;
    name: string;
    path: string;
    createdAt: string;
    columns: string[];
}

const CsvFileDownloadPage: React.FC = () => {
    const [csvFiles, setCsvFiles] = useState<CsvFileDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        axios
            .get("http://localhost:8099/results/csv/files")
            .then((response) => {
                setCsvFiles(response.data);
                setLoading(false);
            })
            .catch(() => {
                setError("Errore nel recuperare i file CSV.");
                setLoading(false);
            });
    }, []);

    const handleDownload = (fileId: number, fileName: string) => {
        setDownloadingId(fileId);
        axios
            .get(`http://localhost:8099/results/csv/${fileId}/download`, {
                responseType: "text", // Ricevi come testo per elaborazione
            })
            .then((response) => {
                // Converti CSV in TSV (sostituisci virgole con tab)
                const tsvData = response.data.replace(/,/g, "\t");
                const blob = new Blob([tsvData], {type: "text/tab-separated-values"});
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", fileName.replace('.csv', '.tsv'));
                document.body.appendChild(link);
                link.click();
                link.remove();
                setDownloadingId(null);
            })
            .catch(() => {
                alert("Errore durante il download.");
                setDownloadingId(null);
            });
    };

    return (
        <Container sx={{mt: 4}}>
            <Typography variant="h4" sx={{mb: 4}}>
                Simulations TSV files list
            </Typography>

            {loading && (
                <Box sx={{display: "flex", justifyContent: "center", mt: 4}}>
                    <CircularProgress/>
                </Box>
            )}

            {error && (
                <Typography color="error" sx={{mt: 2}}>
                    {error}
                </Typography>
            )}

            {!loading && !error && csvFiles.length === 0 && (
                <Typography variant="body1" color="textSecondary">
                    Nessun file CSV disponibile.
                </Typography>
            )}

            <div>
                {!loading && csvFiles.length > 0 && (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Filename</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {csvFiles.map((file) => (
                                    <TableRow key={file.id}>
                                        <TableCell>{file.name}</TableCell>
                                        <TableCell>
                                            {new Date(file.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<DownloadIcon/>}
                                                disabled={downloadingId === file.id}
                                                onClick={() => handleDownload(file.id, file.name)}
                                            >
                                                {downloadingId === file.id ? (
                                                    <CircularProgress size={16} color="inherit"/>
                                                ) : (
                                                    "Scarica"
                                                )}
                                            </Button>

                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                )}<Button
                variant="contained"
                color="primary"
                startIcon={<ArrowBackIcon/>}
                onClick={() => navigate('/')}
                sx={{marginTop: 3}}
            >
                Home
            </Button></div>
        </Container>
    );
};

export default CsvFileDownloadPage;
