import { ModelFusionTextStream } from "@modelfusion/vercel-ai";
import { StreamingTextResponse } from "ai";
import {
  OpenAIApiConfiguration,
  openai,
  setGlobalFunctionLogging,
  streamText,
} from "modelfusion";

export const runtime = "edge";

setGlobalFunctionLogging("detailed-object");

const gpt4 = openai
  .ChatTextGenerator({
    api: new OpenAIApiConfiguration({ apiKey: process.env.OPENAI_API_KEY }),
    model: "gpt-4-1106-preview",
    temperature: 0,
  })
  .withTextPrompt();

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const answer = await streamText(gpt4, prompt);

  return new StreamingTextResponse(ModelFusionTextStream(answer));
}
