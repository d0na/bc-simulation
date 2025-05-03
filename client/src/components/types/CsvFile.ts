export interface CsvFile {
    id: string;
    name: string;
    path: string;
    columns: string[];
    createdAt: string;
}

export interface DatasetRequest {
    fileId: number;
    columns: string[];
}

export interface ChartRequest {
    datasets: DatasetRequest[];
}

export interface ChartResponse {
    labels: string[];
    series: {
        label: string;
        data: number[];
    }[];
}