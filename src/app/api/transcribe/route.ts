import {
  OpenAIApiConfiguration,
  generateTranscription,
  openai,
  setGlobalFunctionLogging,
} from "modelfusion";

export const runtime = "edge";

setGlobalFunctionLogging("detailed-object");

const whisper = openai.Transcriber({
  api: new OpenAIApiConfiguration({ apiKey: process.env.OPENAI_API_KEY }),
  model: "whisper-1",
  language: "en",
  temperature: 0,
});

export async function POST(req: Request) {
  const { data }: { data: string } = await req.json();

  const transcription = await generateTranscription(whisper, {
    type: "wav",
    data: Buffer.from(data, "base64"),
  });

  return Response.json({ transcription });
}
