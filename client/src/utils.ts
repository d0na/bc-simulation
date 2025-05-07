import {GraphRequestDTO} from "./components/types/types.ts";

export const formatUsingExpression = (expr: string) => {
    if (/^\d+:\d+$/.test(expr)) return expr;
    return expr.split(':').map((part, index) => {
        if (index === 0) return part;
        return part.replace(/(\d+)/g, (match) => {
            if (part.includes('(') && part.includes(')')) {
                return `$${match}`;
            }
            return match;
        });
    }).join(':');
};

