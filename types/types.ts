// Define the input type for clarity
export interface DeepARInput {
    instances: {
        start: string;
        target: number[];
    }[];
    configuration: {
        num_samples: number;
        output_types: string[];
        quantiles: string[];
    };
}