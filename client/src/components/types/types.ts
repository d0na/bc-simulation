export interface CsvFileDTO {
    id: number;
    name: string;
    path: string;
    createdAt: string;
    columns: string[];
}

export interface FillConfigDTO {
    transparent: boolean;
    solid: number;
}

export interface PlotConfigDTO {
    dataFileAlias: string;
    using: string;
    type: string;
    title: string;
    color: string;
    smooth: string;
    lineWidth: number;
    fill?: FillConfigDTO;
}

export interface GraphRequestDTO {
    title: string;
    outputFormat: string;
    size: string;
    xlabel: string;
    ylabel: string;
    xrange: string;
    yrange: string;
    logscaleY: boolean;
    extraOptions?: string;
    dataFiles: {
        alias: string;
        path: string;
    }[];
    plots: PlotConfigDTO[];
}