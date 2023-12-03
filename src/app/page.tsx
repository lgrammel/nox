"use client";

import { useMicVAD, utils } from "@ricky0123/vad-react";
import {
  OpenAIApiConfiguration,
  generateTranscription,
  openai,
} from "modelfusion";
import { useState } from "react";

const whisper = openai.Transcriber({
  api: new OpenAIApiConfiguration({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // INSECURE, DO NOT DEPLOY THIS APP
  }),
  model: "whisper-1",
});

export default function App() {
  const [transcriptionList, setTranscriptionList] = useState<string[]>([]);

  const vad = useMicVAD({
    onSpeechEnd: async (audio) => {
      const wavBuffer = utils.encodeWAV(audio);
      const base64 = utils.arrayBufferToBase64(wavBuffer);
      const transcription = await generateTranscription(whisper, {
        type: "wav",
        data: Buffer.from(base64, "base64"),
      });
      setTranscriptionList((old) => [transcription, ...old]);
    },
  });

  return (
    <div>
      <h6>Listening</h6>
      {!vad.listening && "Not"} listening
      <h6>Loading</h6>
      {!vad.loading && "Not"} loading
      <h6>Errored</h6>
      {!vad.errored && "Not"} errored {vad.errored && vad.errored?.message}
      <h6>User Speaking</h6>
      {!vad.userSpeaking && "Not"} speaking
      <h6>Transcriptions</h6>
      {transcriptionList.map((transcription, index) => (
        <div key={index}>{transcription}</div>
      ))}
      <h6>Start/Pause</h6>
      <button onClick={vad.pause}>Pause</button>
      <button onClick={vad.start}>Start</button>
      <button onClick={vad.toggle}>Toggle</button>
    </div>
  );
}
