import {
    BedrockRuntimeClient
} from "@aws-sdk/client-bedrock-runtime";

export const client = new BedrockRuntimeClient({ region: "us-east-1" });
export const modelId = "arn:aws:bedrock:us-east-1:945816504291:inference-profile/us.deepseek.r1-v1:0";