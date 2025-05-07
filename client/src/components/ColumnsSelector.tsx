import React, { useEffect, useState } from "react";
import {
    Checkbox,
    FormControlLabel,
    FormGroup,
    Typography,
    Button,
    Divider,
} from "@mui/material";
import axios from "axios";

interface Props {
    selectedFiles: string[];
    onConfirm: (datasets: { fileId: string; columns: string[] }[]) => void;
}

const ColumnsSelector: React.FC<Props> = ({ selectedFiles, onConfirm }) => {
    const [columns, setColumns] = useState<{ [fileId: string]: string[] }>({});
    const [selectedCols, setSelectedCols] = useState<{ [fileId: string]: string[] }>({});

    useEffect(() => {
        selectedFiles.forEach((fileId) => {

            axios.get(`http://localhost:8099/results/csv/${fileId}/columns`).then((res) => {
                const colArray = res.data[0].split("\t");  // 👈 accedo al primo elemento dell'array e splittiamo su \t
                setColumns((prev) => ({ ...prev, [fileId]: colArray }));
            });
        });
    }, [selectedFiles]);

    const handleConfirm = () => {
        const datasets = selectedFiles.map((fileId) => ({
            fileId,
            columns: selectedCols[fileId] || [],
        }));
        onConfirm(datasets);
    };

    return (
        <div>
            {selectedFiles.map((fileId) => (
                <div key={fileId}>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Colonne per {fileId}
                    </Typography>
                    <FormGroup>
                        {columns[fileId]?.map((col) => (
                            <FormControlLabel
                                key={col}
                                control={
                                    <Checkbox
                                        checked={selectedCols[fileId]?.includes(col) || false}
                                        onChange={() => {
                                            const current = selectedCols[fileId] || [];
                                            setSelectedCols((prev) => ({
                                                ...prev,
                                                [fileId]: current.includes(col)
                                                    ? current.filter((c) => c !== col)
                                                    : [...current, col],
                                            }));
                                        }}
                                    />
                                }
                                label={col}
                            />
                        ))}
                    </FormGroup>
                    <Divider sx={{ my: 2 }} />
                </div>
            ))}
            <Button onClick={handleConfirm} variant="contained">
                Conferma Colonne
            </Button>
        </div>
    );
};

export default ColumnsSelector;
