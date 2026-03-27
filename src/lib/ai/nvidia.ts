import axios from "axios";

const NVIDIA_API_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";

// ─── Model Constants ─────────────────────────────────────
export const MODELS = {
  FAST: "nvidia/llama-3.1-nemotron-70b-instruct",
  SMART: "nvidia/llama-3.3-70b-instruct",
  REASONING: "nvidia/deepseek-r1",
  EMBED: "nvidia/nv-embed-qa-4",
} as const;

export type ModelName = (typeof MODELS)[keyof typeof MODELS];

// ─── Chat Completion ─────────────────────────────────────
export async function chat(
  prompt: string,
  model: ModelName = MODELS.FAST,
  systemMessage?: string
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not set");
  }

  const messages: Array<{ role: string; content: string }> = [];
  
  if (systemMessage) {
    messages.push({ role: "system", content: systemMessage });
  }
  
  messages.push({ role: "user", content: prompt });

  try {
    const response = await axios.post(
      `${NVIDIA_API_URL}/chat/completions`,
      {
        model,
        messages,
        temperature: 0.6,
        max_tokens: 4096,
        top_p: 0.95,
        stream: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    }

    throw new Error("No response from NVIDIA API");
  } catch (error: unknown) {
    console.error("NVIDIA chat error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

// ─── Embedding Functions ────────────────────────────────

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.NVIDIA_API_KEY;
  
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not set");
  }

  try {
    const response = await axios.post<EmbeddingResponse>(
      `${NVIDIA_API_URL}/embeddings`,
      {
        model: MODELS.EMBED,
        input: text,
        encoding_format: "float",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0].embedding;
    }

    throw new Error("No embedding returned from NVIDIA API");
  } catch (error) {
    console.error("NVIDIA API error:", error);
    throw error;
  }
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.NVIDIA_API_KEY;
  
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not set");
  }

  try {
    const response = await axios.post<EmbeddingResponse>(
      `${NVIDIA_API_URL}/embeddings`,
      {
        model: MODELS.EMBED,
        input: texts,
        encoding_format: "float",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (error) {
    console.error("NVIDIA API error:", error);
    throw error;
  }
}