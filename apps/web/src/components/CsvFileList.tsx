import React from 'react';
import { List, ListItem, ListItemButton, ListItemText, Checkbox } from '@mui/material';
import {CsvFile} from "./types/CsvFile.ts";

interface Props {
    csvFiles: CsvFile[];
    selectedFiles: CsvFile[];
    setSelectedFiles: (files: CsvFile[]) => void;
}

const CsvFileList: React.FC<Props> = ({ csvFiles, selectedFiles, setSelectedFiles }) => {
    const handleToggle = (file: CsvFile) => {
        const index = selectedFiles.findIndex((f) => f.id === file.id);
        const updated = [...selectedFiles];
        if (index === -1) updated.push(file);
        else updated.splice(index, 1);
        setSelectedFiles(updated);
    };

    return (
        <List>
            {csvFiles.map((file) => (
                <ListItem key={file.id} disablePadding>
                    <ListItemButton onClick={() => handleToggle(file)} selected={selectedFiles.some((f) => f.id === file.id)}>
                        <Checkbox checked={selectedFiles.some((f) => f.id === file.id)} />
                        <ListItemText primary={file.name} secondary={file.path} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    );
};

export default CsvFileList;
