import { createAzure } from "@ai-sdk/azure";
import { generateText } from "ai";

const AZURE_OPENAI_ENDPOINT =
  "https://a-jdu-m4b0qa5r-swedencentral.cognitiveservices.azure.com";
const AZURE_OPENAI_API_KEY = "";
const AZURE_OPENAI_API_VERSION = "2025-01-01-preview";
export const AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4.1";

const openai = createAzure({
  baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments`,
  apiKey: AZURE_OPENAI_API_KEY,
  headers: {
    "api-key": AZURE_OPENAI_API_KEY,
    "api-version": AZURE_OPENAI_API_VERSION,
  },
});

async function main() {
  const { text } = await generateText({
    model: openai(AZURE_OPENAI_DEPLOYMENT_NAME),
    prompt: "Write a vegetarian lasagna recipe for 4 people.",
  });
  console.log(text);
}

export default openai;
