"use server";

import { DeepARInput } from "@/types/types";
import { InvokeEndpointCommand, SageMakerRuntimeClient } from "@aws-sdk/client-sagemaker-runtime";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { db } from "@/lib/db";

// SageMaker client
const sageMakerClient = new SageMakerRuntimeClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
    },
});

// Lambda client
const lambdaClient = new LambdaClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
    },
});

const sageMakerEndpointName = "forecasting-deepar-2025-09-21-08-50-50-702";
const lambdaFunctionName = "rostering_final";

/**
 * Call SageMaker DeepAR endpoint and then rostering_final Lambda
 * @param input - DeepAR input
 * @returns The mean prediction value
 */
export async function getRosterAction(input: DeepARInput): Promise<number | null> {
    try {
        // --- Step 1: Call SageMaker DeepAR ---
        const smCommand = new InvokeEndpointCommand({
            EndpointName: sageMakerEndpointName,
            ContentType: "application/json",
            Body: JSON.stringify(input),
        });

        const smResponse = await sageMakerClient.send(smCommand);
        const smBody = new TextDecoder("utf-8").decode(smResponse.Body);
        const smResult = JSON.parse(smBody);

        const meanValues = smResult.predictions.map((pred: { mean: number[] }) => pred.mean);

        // --- Step 3: Call rostering_final Lambda ---
        // Using your provided input as test payload
        const lambdaPayload = {
            nurse_profiles: [
                { nurse_id: "n001", preferred_days_off: [0, 6], preferred_shift_type: 0 },
                { nurse_id: "n002", preferred_days_off: [2, 4], preferred_shift_type: 1 },
                { nurse_id: "n003", preferred_days_off: [1, 5], preferred_shift_type: 0 },
                { nurse_id: "n004", preferred_days_off: [3, 6], preferred_shift_type: 1 },
                { nurse_id: "n005", preferred_days_off: [0, 2], preferred_shift_type: 0 },
            ],
            N: 4,
            max_seconds: 20,
        };

        const lambdaCommand = new InvokeCommand({
            FunctionName: lambdaFunctionName,
            Payload: Buffer.from(JSON.stringify(lambdaPayload)),
        });


        const lambdaResponse = await lambdaClient.send(lambdaCommand);
        const lambdaBody = new TextDecoder("utf-8").decode(lambdaResponse.Payload as Uint8Array);
        const lambdaResult = JSON.parse(lambdaBody);

        console.log("Rostering response:", lambdaResult.roster);

        return lambdaResult.roster

    } catch (err) {
        console.error("Error calling endpoint or Lambda:", err);
        return null;
    }
}
