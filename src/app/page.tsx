"use client";

import { Button } from "@/components/ui/button";
import { IconMicrophone } from "@/components/ui/icon-microphone";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { useCompletion } from "ai/react";
import { useEffect, useState } from "react";

export default function App() {
  const [items, setItems] = useState<
    Array<
      | { type: "transcription"; text: string }
      | { type: "command"; text: string }
      | { type: "answer"; text: string }
    >
  >([]);
  const [transcribing, setTranscribing] = useState(false);
  const [paused, setPaused] = useState(false);
  const {
    completion,
    complete: getAnswer,
    setCompletion,
  } = useCompletion({
    api: "/api/answer",
    onFinish: (prompt, completion) => {
      setItems((old) => [...old, { type: "answer", text: completion }]);
      setCompletion("");
    },
  });

  const vad = useMicVAD({
    userSpeakingThreshold: 0.7,
    onSpeechEnd: async (audio) => {
      vad.pause();
      try {
        setTranscribing(true);

        // Whisper.cpp can transcribe this format without additional conversions:
        const wavBuffer = utils.encodeWAV(audio, 1, 16000, 1, 16);
        const base64 = utils.arrayBufferToBase64(wavBuffer);

        const transcriptionResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: JSON.stringify({ data: base64 }),
        });

        const {
          transcription,
        }: {
          transcription: string;
        } = await transcriptionResponse.json();

        const type = transcription.toLowerCase().startsWith("command")
          ? "command"
          : "transcription";

        if (type === "transcription" && paused) {
          return;
        }

        setItems((old) => [...old, { type, text: transcription }]);

        if (type === "command") {
          const command = transcription
            .toLowerCase()
            .replace(/command/gi, "")
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .trim();

          if (command === "clear") {
            setItems([]);
          } else if (command === "stop") {
            setPaused(true);
          } else if (command === "start") {
            setPaused(false);
          } else if (command === "send") {
            const lastAnswerIndex = items.findLastIndex(
              (item) => item.type === "answer"
            );

            const text = items
              .slice(lastAnswerIndex + 1)
              .filter((item) => item.type === "transcription")
              .map((item) => item.text)
              .join("\n\n");

            await getAnswer(text);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        vad.start();
        setTranscribing(false);
      }
    },
  });

  return (
    <div className="m-8">
      <div className="bg-gray-800 p-4 shadow rounded-lg max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <IconMicrophone className="text-blue-300 h-6 w-6" />
            <span className="text-gray-300">
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
            variant={paused ? "outline" : "destructive"}
            onClick={() => {
              setPaused((old) => !old);
            }}
          >
            {vad.listening ? "Stop" : "Start"}
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => {
            switch (item.type) {
              case "command":
                return (
                  <div key={index} className="bg-blue-200 p-2 rounded">
                    <p className="text-gray-300">{item.text}</p>
                  </div>
                );
              case "transcription":
                return (
                  <div key={index} className="bg-gray-700 p-2 rounded">
                    <p className="text-gray-300">{item.text}</p>
                  </div>
                );
              case "answer":
                return (
                  <div key={index} className="bg-green-200 p-2 rounded">
                    <p className="text-gray-300">{item.text}</p>
                  </div>
                );
            }
          })}
          {completion && (
            <div className="bg-green-200 p-2 rounded">
              <p className="text-gray-300">{completion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
