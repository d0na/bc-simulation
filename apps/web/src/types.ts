export interface TimeDependingDistribution{
    time?: number
}
export interface UniformDistributionParams extends  TimeDependingDistribution{
    value: number
}

export interface FixedDistributionParams extends  TimeDependingDistribution{
    fixedTime: number
}


export interface UniformContinuousDistributionParams extends  TimeDependingDistribution{
    min: number
    max: number
    scalingFactor: number
}


export interface NormalDistributionParams extends  TimeDependingDistribution{
    mean: number
    std: number
    scalingFactor: number
}

export interface NormalScaledDistributionParams extends  TimeDependingDistribution{
    mean: number
    std: number
    scalingFactorX: number
    scalingFactorY: number
}

export interface LognormalDistributionParams extends  TimeDependingDistribution{
    mean: number
    std: number
    scalingFactor: number
}

export interface LognormalScaledDistributionParams extends  TimeDependingDistribution{
    mean: number
    std: number
    scalingFactorX: number
    scalingFactorY: number
}

export interface ExponentialDistributionParams extends  TimeDependingDistribution{
    rate: number
    scalingFactor: number
}

export interface ExponentialScaledDistributionParams extends  TimeDependingDistribution{
    rate: number
    scalingFactorX: number
    scalingFactorY: number
}

// 1. Fonte di verità: array literal
export const rawDistributionTypes = [
    'FIXED',
    'UNIFORM',
    'NORMAL_SCALED',
    'NORMAL',
    'LOGNORMAL_SCALED',
    'LOGNORMAL',
    'EXPONENTIAL',
    'EXPONENTIAL_SCALED',
    'BASS',
    'BASS_CUMULATIVE',
    // 'GARTNER',
    'GARTNER_SASAKI'
] as const;

// 2. Tipo derivato
export type DistributionType = typeof rawDistributionTypes[number] | "";

// 3. Mappa per le label leggibili
const labelMap: Partial<Record<DistributionType, string>> = {
    FIXED: 'Fixed',
    UNIFORM: 'Uniform',
    NORMAL: 'Normal',
    NORMAL_SCALED: 'Normal Scaled',
    LOGNORMAL: 'LogNormal',
    LOGNORMAL_SCALED: 'LogNormal Scaled',
    EXPONENTIAL: 'Exponential',
    EXPONENTIAL_SCALED: 'Exponential Scaled',
    BASS: 'Bass (Diffusion Model)',
    BASS_CUMULATIVE: 'Bass (Cumulative Adoption)',
    // GARTNER: 'Gartner-Carr Model',
    GARTNER_SASAKI: 'Sasaki-Hype Model'
};

// 4. Array con { value, label }
export const distributionTypes = rawDistributionTypes.map((type) => ({
    value: type,
    label: labelMap[type]
}));


export interface DistributionParams {
    type: DistributionType;
    fixedTime?: number;
    value?: number;
    mean?: number;
    std?: number;
    scalingFactorX?: number;
    scalingFactorY?: number;
    scalingFactor?: number;
    rate?: number;
    time?: number;
    A?: number;
    B?: number;
    C?: number;
    D?: number;
    E?: number;
    F?: number;
    G?: number,
    H?: number;
    I?: number;
    p?: number;
    q?: number;
}

export type ProbabilityDistribution = {
    type: DistributionType;
    [key: string]: any;
};

export interface SimulationConfig {
    name: string;
    description?: string;
    maxTime: number;
    numAggr: number;
    numRuns: number;
    entities: string[];
    events: Event[];
}

export type EventDependency = {
    dependOn: string | null;
    maxProbabilityMatches: string | null;
    probabilityDistribution: ProbabilityDistribution;
};

export type Event = {
    eventName: string;
    description: string;
    instanceOf: string | null;
    dependencies: EventDependency[] | null;
    gasCost: number;
    relatedEvents: string[] | null;
};
