import {DistributionType} from "../types.ts";

interface SliderSetting {
    label?: string;
    min: number;
    max: number;
    step: number;
}

export const sliderSettingsByDistribution: Partial<Record<DistributionType, Record<string, SliderSetting>>> = {
    NORMAL: {
        mean: { label: 'Mean', min: 1, max: 604800, step: 100 },
        std: { label: 'Std Dev', min: 10, max: 100000, step: 10 },
        scalingFactor: { label: 'Scaling Factor', min: 0.0001, max: 10, step: 0.0001 }
    },
    LOGNORMAL: {
        mean: { label: 'Mean', min: 0.1, max: 10, step: 0.1 },
        std: { label: 'Std Dev', min: 0.01, max: 2, step: 0.01 },
        scalingFactor: { label: 'Scaling Factor', min: 0.0001, max: 1, step: 0.0001 }
    },
    FIXED: {
        fixedTime: { label: 'Fixed Time (s)', min: 1, max: 604800, step: 1 }
    },
    UNIFORM: {
        value: { label: 'Value', min: 0.00001, max: 1, step: 0.0001 }
    },
    EXPONENTIAL: {
        rate: { label: 'Rate', min: 0.0001, max: 2, step: 0.0001 },
        scalingFactor: { label: 'Scaling Factor', min: 0.0001, max: 1, step: 0.0001 }
    },
    EXPONENTIAL_SCALED: {
        rate: { label: 'Rate', min: 0.0001, max: 2, step: 0.0001 },
        scalingFactorX: { label: 'Scaling Factor X', min: 0.0001, max: 10, step: 0.0001 },
        scalingFactorY: { label: 'Scaling Factor Y', min: 0.0001, max: 10, step: 0.0001 }
    },
    NORMAL_SCALED: {
        mean: { label: 'Mean', min: 1, max: 604800, step: 100 },
        std: { label: 'Std Dev', min: 10, max: 100000, step: 10 },
        scalingFactorX: { label: 'Scaling Factor X', min: 0.0001, max: 10, step: 0.0001 },
        scalingFactorY: { label: 'Scaling Factor Y', min: 0.0001, max: 10, step: 0.0001 }
    },
    LOGNORMAL_SCALED: {
        mean: { label: 'Mean',  min: 1, max: 6, step: 1},
        std: { label: 'Std Dev', min: 0.1, max: 5, step: 0.1 },
        scalingFactorX: { label: 'Scaling Factor X', min: 0.0001, max: 0.2, step: 0.0001 },
        scalingFactorY: { label: 'Scaling Factor Y', min: 0.01, max: 2, step: 0.01 }
    },
    BASS: {
        p: { label: 'p', min: 0.0001, max: 0.1, step: 0.0001 },
        q: { label: 'q', min: 0.01, max: 1, step: 0.01 },
        scalingFactor: { label: 'Scaling Factor', min: 0.0001, max: 1, step: 0.0001 }
    },
    BASS_CUMULATIVE: {
        p: { label: 'p', min: 0.0001, max: 0.1, step: 0.0001 },
        q: { label: 'q', min: 0.01, max: 1, step: 0.01 },
        scalingFactor: { label: 'Scaling Factor', min: 0.0001, max: 1, step: 0.0001 }
    },
    GARTNER_SASAKI: {
        A: { label: 'Initial Peak Height (A)', min: 0.001, max: 2, step: 0.001 },
        B: { label: 'How fast the curve flattens (B)', min: 0.01, max: 1, step: 0.01 },
        C: { label: 'How fast it rises early on (C)', min: 0.00001, max: 0.001, step: 0.00001 },
        D: { label: 'Disillusion Depth (D)', min: 0.1, max: 2, step: 0.1 },
        E: { label: 'Steepness of the drop (E)', min: 0.000001, max: 0.001, step: 0.000001},
        F: { label: 'When the drop begins (delay) (F)', min: 0, max: 604800, step: 1000 },
        G: { label: 'Max recovery height (G)', min: 0.01, max: 2, step: 0.01 },
        H: { label: 'Steepness of recovery (H)',  min: 0.00001, max: 0.001, step: 0.00001},
        I: { label: 'When recovery begins (I)', min: 0, max: 604800, step: 1000},
        scalingFactor: { label: 'Scaling Factor', min: 0.001, max: 3, step: 0.001 }
    }
};
