import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Line } from 'react-chartjs-2';

interface Props {
    open: boolean;
    onClose: () => void;
    data: number[];
    labels: number[];
    title?: string;
}

export const ChartPreviewDialog = ({ open, onClose, data, labels, title = "Hype Curve Preview" }: Props) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
                <Line
                    data={{
                        labels,
                        datasets: [
                            {
                                label: 'Hype Value',
                                data,
                                fill: false,
                                tension: 0.3,
                            },
                        ],
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">Close</Button>
            </DialogActions>
        </Dialog>
    );
};