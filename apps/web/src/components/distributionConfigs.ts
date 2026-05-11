import {DistributionParams, DistributionType} from "../types.ts";

export const defaultParamsByDistribution: Partial<Record<DistributionType, DistributionParams>> = {
    FIXED: {type: 'FIXED', fixedTime: 100},
    UNIFORM: {type: 'UNIFORM', value: 0.0001},
    NORMAL: {
        type: "NORMAL",
        mean: 5,            // centro della curva
        std: 1,              // larghezza ampia
        scalingFactor: 0.1         // nessuna riscalatura
    },
    NORMAL_SCALED: {
        type: "NORMAL_SCALED",
        mean: 2000,
        std: 570,
        scalingFactorX: 0.01,
        scalingFactorY: 307
    },
    LOGNORMAL: {
        type: "LOGNORMAL",
        mean: 0.6,               // stesso log-picco
        std: 1.2,
        scalingFactor: 0.00001
    },
    LOGNORMAL_SCALED: {
        type: "LOGNORMAL_SCALED",
        mean: 1,              // leggermente spostato
        std: 1,
        scalingFactorX: 0.003,
        scalingFactorY: 1
    },
    EXPONENTIAL: {type: 'EXPONENTIAL', rate: 0.1, scalingFactor: 0.0001},
    EXPONENTIAL_SCALED: {type: 'EXPONENTIAL_SCALED', rate: 1, scalingFactorX: 0.001, scalingFactorY: 0.4},
    BASS: {
        type: 'BASS',
        // p: 0.01, // p = 0.01 → percentuale di innovatori (adozione spontanea iniziale)
        // q: 0.3,  // q = 0.3 → percentuale di imitatori (adozione influenzata dagli altri)
        // scalingFactor: 0.001  // scalingFactor = 0.001 → scala temporale ridotta (es. 604800s × 0.001 = 604.8 "unità tempo")

        // curva più lenta, picco più lontano
        p: 0.01, // p = 0.01 → percentuale di innovatori (adozione spontanea iniziale)
        q: 0.15,  // q = 0.3 → percentuale di imitatori (adozione influenzata dagli altri)
        scalingFactor: 0.0001  // scalingFactor = 0.001 → scala temporale ridotta (es. 604800s × 0.001 = 604.8 "unità tempo")

    },
    //  frazione di popolazione che ha adottato entro il tempo t

    BASS_CUMULATIVE: {
        type: 'BASS_CUMULATIVE',
        // p: 0.01,  //curva subito,  q/p= 30, ripida cioè imitazione > innovazione → diffusione esplosiva)
        // q: 0.3,
        // scalingFactor: 0.001 // tempo effettivo in secondi (es. 604800s × 0.001 = 604.8 "unità tempo")

        p: 0.001,  //più distesa
        q: 0.3,
        scalingFactor: 0.0001 // tempo effettivo in secondi (es. 604800s × 0.001 = 604.8 "unità tempo")
    },
    GARTNER_SASAKI: {
        type: 'GARTNER_SASAKI',  // Sasaki-Hype Model
        A: 0.8,
        B: 4,
        C: 0.0001,
        D: 0.9,
        E: 0.00001,
        F: 167000,
        G: 0.22,
        H: 0.0001,
        I: 242000,
        scalingFactor: 1
    }
};
