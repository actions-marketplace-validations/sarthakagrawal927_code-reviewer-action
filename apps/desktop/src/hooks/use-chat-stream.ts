import { useState, useEffect, useRef } from "react";
import { onChatStream, isTauriAvailable } from "@/lib/tauri-ipc";
import type { ChatStreamEvent } from "@/lib/tauri-ipc";

export interface RateLimitEventInfo {
  status: string;
  resetsAt: number;
  rateLimitType: string;
  overageStatus: string;
}

interface UseChatStreamOptions {
  onAssistantDone: (text: string, sessionId?: string) => void;
  onSystemMessage: (text: string) => void;
  onTextUpdate?: () => void;
  onRateLimitUpdate?: (info: RateLimitEventInfo) => void;
}

interface StreamStats {
  startedAt: number | null;
  elapsedMs: number;
  inputTokens: number;
  outputTokens: number;
}

/** Describes what Claude is currently doing */
export interface ActivityStep {
  label: string;
  detail?: string;
  timestamp: number;
}

function toolToActivityStep(toolName: string, input: Record<string, unknown>): ActivityStep {
  const ts = Date.now();
  switch (toolName) {
    case "Read":
      return { label: "Reading", detail: String(input.file_path ?? input.filePath ?? "").split("/").pop(), timestamp: ts };
    case "Write":
      return { label: "Writing", detail: String(input.file_path ?? input.filePath ?? "").split("/").pop(), timestamp: ts };
    case "Edit":
      return { label: "Editing", detail: String(input.file_path ?? input.filePath ?? "").split("/").pop(), timestamp: ts };
    case "Bash":
      return { label: "Running command", detail: String(input.command ?? "").slice(0, 40), timestamp: ts };
    case "Grep":
      return { label: "Searching", detail: String(input.pattern ?? "").slice(0, 30), timestamp: ts };
    case "Glob":
      return { label: "Finding files", detail: String(input.pattern ?? ""), timestamp: ts };
    case "WebSearch":
      return { label: "Searching web", detail: String(input.query ?? "").slice(0, 30), timestamp: ts };
    case "WebFetch":
      return { label: "Fetching", detail: String(input.url ?? "").slice(0, 40), timestamp: ts };
    case "Agent":
    case "Task":
      return { label: "Spawning agent", detail: String(input.description ?? "").slice(0, 40), timestamp: ts };
    default:
      return { label: toolName, timestamp: ts };
  }
}

/**
 * Hook that subscribes to `chat-stream` Tauri events and manages
 * streaming state. Returns `{ sending, streamingText, stats }`.
 */
export function useChatStream(opts: UseChatStreamOptions) {
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [activityStep, setActivityStep] = useState<ActivityStep | null>(null);
  const [stats, setStats] = useState<StreamStats>({
    startedAt: null,
    elapsedMs: 0,
    inputTokens: 0,
    outputTokens: 0,
  });
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref to read streaming text synchronously (avoids side-effect in state updater)
  const textRef = useRef("");

  useEffect(() => {
    if (!isTauriAvailable()) return;

    let cancelled = false;
    let unlisten: (() => void) | undefined;

    onChatStream((event: ChatStreamEvent) => {
      const content = event.content as Record<string, unknown>;

      switch (event.event_type) {
        case "assistant": {
          const msg = content.message as Record<string, unknown> | undefined;
          if (msg?.content) {
            const blocks = msg.content as Array<{ type: string; text?: string }>;
            const text = blocks
              .filter((b) => b.type === "text")
              .map((b) => b.text ?? "")
              .join("");
            if (text) {
              setSending(true);
              textRef.current = text;
              setStreamingText(text);
              optsRef.current.onTextUpdate?.();
            }
          }
          const usage = (content.usage ?? (content.message as Record<string, unknown>)?.usage) as Record<string, number> | undefined;
          if (usage) {
            setStats((prev) => ({
              ...prev,
              inputTokens: prev.inputTokens + (usage.input_tokens ?? 0),
              outputTokens: prev.outputTokens + (usage.output_tokens ?? 0),
            }));
          }
          break;
        }
        case "content_block_start":
        case "message_start": {
          const now = Date.now();
          setSending(true);
          setStats({ startedAt: now, elapsedMs: 0, inputTokens: 0, outputTokens: 0 });
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setStats((prev) => ({
              ...prev,
              elapsedMs: prev.startedAt ? Date.now() - prev.startedAt : 0,
            }));
          }, 500);
          break;
        }
        case "text_delta": {
          const text =
            (content.text as string | undefined) ??
            ((content.delta as Record<string, unknown>)?.text as string | undefined);
          if (text) {
            setSending(true);
            textRef.current += text;
            setStreamingText(textRef.current);
            optsRef.current.onTextUpdate?.();
          }
          break;
        }
        case "tool_use": {
          // Claude is calling a tool — show what it's doing
          const toolName = (content.name as string) ?? (content.tool_name as string) ?? "";
          const toolInput = (content.input as Record<string, unknown>) ?? {};
          if (toolName) {
            setActivityStep(toolToActivityStep(toolName, toolInput));
          }
          break;
        }
        case "tool_result": {
          // Tool finished — clear the step (next tool_use or text will replace it)
          break;
        }
        case "result": {
          const result = content.result as Record<string, unknown> | undefined;
          const usage = result?.usage as Record<string, number> | undefined;
          if (usage) {
            setStats((prev) => ({
              ...prev,
              inputTokens: prev.inputTokens + (usage.input_tokens ?? 0),
              outputTokens: prev.outputTokens + (usage.output_tokens ?? 0),
            }));
          }
          break;
        }
        case "done": {
          const sid = content.session_id as string | undefined;
          setActivityStep(null);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setStats((prev) => ({
            ...prev,
            elapsedMs: prev.startedAt ? Date.now() - prev.startedAt : prev.elapsedMs,
          }));
          // Read text from ref (avoids side-effect inside state updater)
          const finalText = textRef.current;
          textRef.current = "";
          setStreamingText("");
          setSending(false);
          optsRef.current.onAssistantDone(finalText, sid ?? undefined);
          break;
        }
        case "system": {
          const text = (content.message as string) ?? JSON.stringify(content);
          optsRef.current.onSystemMessage(text);
          break;
        }
        case "rate_limit_event": {
          const info = content.rate_limit_info as {
            status: string;
            resetsAt: number;
            rateLimitType: string;
            overageStatus: string;
          } | undefined;
          if (info) {
            optsRef.current.onRateLimitUpdate?.(info);
          }
          break;
        }
      }
    }).then((fn) => {
      if (cancelled) { fn(); return; }
      unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { sending, streamingText, stats, activityStep };
}
