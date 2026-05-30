import { useState, useCallback, useRef } from 'react';

const API_KEY_STORAGE_KEY = 'private-desktop-kimi-api-key';
const API_BASE_URL = 'https://api.moonshot.cn/v1';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Load API key from localStorage */
export function loadAPIKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/** Save API key to localStorage */
export function saveAPIKey(key: string) {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

/** Check if API key is configured */
export function hasAPIKey(): boolean {
  return !!loadAPIKey();
}

/** Stream chat completion from Kimi API */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  model: string = 'moonshot-v1-8k',
): AsyncGenerator<string, void, unknown> {
  if (!apiKey) throw new Error('API Key 未设置');

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '未知错误');
    throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore parse errors for malformed chunks
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

/** Simple non-streaming chat completion */
export async function chatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  model: string = 'moonshot-v1-8k',
): Promise<string> {
  if (!apiKey) throw new Error('API Key 未设置');

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '未知错误');
    throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/** React hook for managing Kimi API */
export function useKimiAPI() {
  const [apiKey, setApiKeyState] = useState(() => loadAPIKey());
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  const setApiKey = useCallback((key: string) => {
    saveAPIKey(key);
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    saveAPIKey('');
    setApiKeyState('');
  }, []);

  /** Send a message and stream the response */
  const sendMessage = useCallback(async (
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    model?: string,
  ) => {
    if (!apiKey) throw new Error('API Key 未设置');
    setIsStreaming(true);

    let aborted = false;
    abortRef.current = () => { aborted = true; };

    try {
      for await (const chunk of streamChatCompletion(messages, apiKey, model)) {
        if (aborted) break;
        onChunk(chunk);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [apiKey]);

  const abort = useCallback(() => {
    abortRef.current?.();
    setIsStreaming(false);
  }, []);

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasKey: !!apiKey,
    isStreaming,
    sendMessage,
    abort,
  };
}
