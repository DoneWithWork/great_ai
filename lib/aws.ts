import {
    BedrockRuntimeClient
} from "@aws-sdk/client-bedrock-runtime";

export const client = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
    },
});
export const modelId = "amazon.nova-pro-v1:0";  