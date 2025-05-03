import React, { useEffect, useState } from "react";
import { Checkbox, FormControlLabel, Button, Typography } from "@mui/material";
import axios from "axios";

interface FileItem {
    id: string;
    name: string;
}

interface Props {
    onNext: (selected: string[]) => void;
}

const SimulationSelector: React.FC<Props> = ({ onNext }) => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        axios.get("http://localhost:8099/results/csv/files").then((res) => setFiles(res.data));
    }, []);

    const handleNext = () => {
        onNext(selected);
    };

    return (
        <div>
            <Typography variant="h6">Seleziona Simulazioni</Typography>
            {files.map((f) => (
                <FormControlLabel
                    key={f.id}
                    control={
                        <Checkbox
                            checked={selected.includes(f.id)}
                            onChange={() =>
                                setSelected((prev) =>
                                    prev.includes(f.id)
                                        ? prev.filter((id) => id !== f.id)
                                        : [...prev, f.id]
                                )
                            }
                        />
                    }
                    label={f.name}
                />
            ))}
            <Button onClick={handleNext} variant="contained" sx={{ mt: 2 }}>
                Avanti
            </Button>
        </div>
    );
};

export default SimulationSelector;
