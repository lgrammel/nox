"use client";

import { Button } from "@/components/ui/button";
import { IconMicrophone } from "@/components/ui/icon-microphone";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { useState } from "react";

export default function App() {
  const [transcriptionList, setTranscriptionList] = useState<string[]>([]);
  const [transcribing, setTranscribing] = useState(false);

  const vad = useMicVAD({
    userSpeakingThreshold: 0.7,
    onSpeechEnd: async (audio) => {
      try {
        const wavBuffer = utils.encodeWAV(audio);
        const base64 = utils.arrayBufferToBase64(wavBuffer);

        setTranscribing(true);
        const transcriptionResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: JSON.stringify({ data: base64 }),
        });
        const { transcription } = await transcriptionResponse.json();

        setTranscriptionList((old) => [transcription, ...old]);
      } catch (e) {
        console.error(e);
      } finally {
        setTranscribing(false);
      }
    },
  });

  return (
    <div className="bg-white p-4 shadow rounded-lg max-w-md mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <IconMicrophone className="text-blue-600 h-6 w-6" />
          <span className="text-gray-700">
            {vad.loading
              ? "Loading..."
              : vad.errored
              ? (vad.errored && vad.errored?.message) ?? "Error"
              : vad.userSpeaking
              ? "Recording speech..."
              : transcribing
              ? "Transcribing..."
              : vad.listening
              ? "Listening..."
              : ""}
          </span>
        </div>
        <Button
          variant={vad.listening ? "destructive" : "outline"}
          onClick={vad.toggle}
        >
          {vad.listening ? "Stop" : "Start"}
        </Button>
      </div>
      <div className="space-y-2">
        {transcriptionList.map((transcription, index) => (
          <div key={index} className="bg-gray-100 p-2 rounded">
            <p className="text-gray-700">{transcription}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
