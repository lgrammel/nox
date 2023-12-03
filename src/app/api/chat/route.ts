import { ModelFusionTextStream } from "@modelfusion/vercel-ai";
import { Message, StreamingTextResponse } from "ai";
import { TextChatMessage, openai, streamText } from "modelfusion";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const textStream = await streamText(
    openai
      .ChatTextGenerator({ model: "gpt-4-1106-preview", temperature: 0 })
      .withChatPrompt(),

    {
      system:
        "You are an AI chat bot. Follow the user's instructions carefully.",

      messages: messages.filter(
        (message) => message.role === "user" || message.role === "assistant"
      ) as TextChatMessage[],
    }
  );

  return new StreamingTextResponse(ModelFusionTextStream(textStream));
}
