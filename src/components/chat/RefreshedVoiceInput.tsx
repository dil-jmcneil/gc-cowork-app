import { AIChatBoxVoiceButton, useAIChatContext } from "@diligentcorp/atlas-react-bundle";
import { Box, Tooltip } from "@mui/material";
import { useEffect, useRef, useState } from "react";

type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

/** Dictation only starts after the user activates the microphone button. */
export function RefreshedVoiceInput() {
  const { setPrompt, isGenerating } = useAIChatContext();
  const recognition = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const host = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const RecognitionClass = host.SpeechRecognition ?? host.webkitSpeechRecognition;
  useEffect(() => () => {
    if (recognition.current) {
      recognition.current.onresult = null;
      recognition.current.onerror = null;
      recognition.current.onend = null;
      recognition.current.abort();
    }
  }, []);

  useEffect(() => {
    if (isGenerating) recognition.current?.abort();
  }, [isGenerating]);

  const toggle = () => {
    if (listening) { recognition.current?.abort(); return; }
    if (!RecognitionClass) return;
    const session = new RecognitionClass();
    recognition.current = session;
    session.lang = navigator.language;
    session.interimResults = false;
    session.onresult = (event) => {
      const text = Array.from(event.results, (result) => result[0]?.transcript ?? "").join(" ").trim();
      if (text) setPrompt((current) => [current.trim(), text].filter(Boolean).join(" "));
    };
    session.onerror = () => { setNotice("Voice input is unavailable. You can type your message instead."); setListening(false); };
    session.onend = () => setListening(false);
    try { session.start(); setListening(true); setNotice("Listening…"); }
    catch { setNotice("Could not start voice input."); }
  };

  return (
    <Tooltip title={RecognitionClass ? listening ? "Stop dictation" : "Dictate a message" : "Voice input is not supported in this browser"}>
      <Box component="span" sx={{ display: "inline-flex" }}>
        <AIChatBoxVoiceButton size="small" ariaLabel={listening ? "Stop dictation" : "Dictate a message"}
          aria-pressed={listening} disabled={!RecognitionClass || isGenerating} onClick={toggle} />
        <Box component="span" role="status" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
          {listening ? "Listening…" : notice === "Listening…" ? "Dictation stopped" : notice}
        </Box>
      </Box>
    </Tooltip>
  );
}
