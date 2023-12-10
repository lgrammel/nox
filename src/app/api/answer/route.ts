import { ModelFusionTextStream } from "@modelfusion/vercel-ai";
import { StreamingTextResponse } from "ai";
import { NeuralChatPrompt, ollama, streamText } from "modelfusion";

export const runtime = "edge";

const neuralChat = ollama
  .TextGenerator({
    model: "neural-chat",
    temperature: 0,
  })
  .withPromptTemplate(NeuralChatPrompt.text());

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const answer = await streamText(neuralChat, prompt, {
    logging: "detailed-object",
  });

  return new StreamingTextResponse(ModelFusionTextStream(answer));
}
