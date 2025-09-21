"use server";
import { DeepARInput } from "@/types/types";
import { InvokeEndpointCommand, SageMakerRuntimeClient } from "@aws-sdk/client-sagemaker-runtime";

// SageMaker client
const client = new SageMakerRuntimeClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
    },
});

const endpointName = "forecasting-deepar-2025-09-21-08-50-50-702";



/**
 * Call SageMaker DeepAR endpoint with user-provided input
 * @param input - User-provided input dictionary (matches DeepARInput)
 * @returns The mean prediction value
 */
export async function getRosterAction(input: DeepARInput): Promise<number | null> {
    const command = new InvokeEndpointCommand({
        EndpointName: endpointName,
        ContentType: "application/json",
        Body: JSON.stringify(input),
    });

    try {
        const response = await client.send(command);

        // Decode the response body
        const bodyString = new TextDecoder("utf-8").decode(response.Body);
        const result = JSON.parse(bodyString);

        // Extract mean (first prediction)
        const meanValues = result.predictions.map((pred: { mean: number[] }) => pred.mean);
        return meanValues[0][0]; // First prediction's mean
    } catch (err) {
        console.error("Error calling endpoint:", err);
        return null;
    }
}

