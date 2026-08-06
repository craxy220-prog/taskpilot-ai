import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_API_BASE = "https://api.groq.com/openai/v1";

/** Shared helper: call Groq (OpenAI-compatible API) and return the response text */
async function callGroq(
  apiKey: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  options?: { temperature?: number; max_tokens?: number },
): Promise<string> {
  // Build messages array with system prompt first
  const groqMessages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...(messages || []).map((m) => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content,
    })),
  ];

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.max_tokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();

  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content || "";
  }

  return "";
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { action, documentContent, messages, documentId, userId } = await req.json();

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      throw new Error("GROQ_API_KEY not configured");
    }

    let result;

    switch (action) {
      case "summarize": {
        const content = await callGroq(
          groqKey,
          "You are an expert document analyst. Summarize the following document concisely. Include:\n1. A brief summary (2-3 paragraphs)\n2. Key points as a bullet list\n3. Any action items, deadlines, and priorities mentioned",
          [{ role: "user", content: documentContent }],
          { temperature: 0.3, max_tokens: 1500 },
        );

        // Parse key points from the response
        const keyPoints: string[] = [];
        const lines = content.split("\n");
        let inKeyPoints = false;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().includes("key point") || trimmed.toLowerCase().includes("key takeaway")) {
            inKeyPoints = true;
            continue;
          }
          if (inKeyPoints && (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•"))) {
            keyPoints.push(trimmed.replace(/^[-*•]\s*/, ""));
          }
          if (trimmed.toLowerCase().includes("action item")) {
            inKeyPoints = false;
            break;
          }
        }

        result = { summary: content, keyPoints };
        break;
      }

      case "extract-tasks": {
        const raw = await callGroq(
          groqKey,
          `Extract all action items, tasks, and deadlines from the following document. Return the result as a JSON array of objects with this exact structure:\n[{"title": "Task description", "priority": "high|medium|low", "deadline": "YYYY-MM-DD or null", "description": "Context about the task"}]\n\nOnly return the JSON array, no other text.`,
          [{ role: "user", content: documentContent }],
          { temperature: 0.1, max_tokens: 2000 },
        );

        let tasks;
        try {
          tasks = JSON.parse(raw);
        } catch {
          tasks = [{ title: raw, priority: "medium", deadline: null, description: "Raw extraction" }];
        }

        result = { tasks };
        break;
      }

      case "chat": {
        const systemPrompt = `You are an AI document assistant. You have been given the following document content. Answer the user's questions based on this document. Be concise, accurate, and helpful. If the answer isn't in the document, say so politely.\n\nDocument content:\n${documentContent.substring(0, 20000)}`;

        const reply = await callGroq(groqKey, systemPrompt, messages || []);
        result = { reply };
        break;
      }

      case "assistant-chat": {
        const systemPrompt = `You are an AI assistant inside the TaskPilot AI platform. You help users manage their workload, create and organize tasks, plan their day, and answer questions about their work.\n\nYour capabilities include:\n- Creating tasks with titles, descriptions, priorities (high/medium/low), due dates, and tags\n- Suggesting task prioritization and organization\n- Planning workdays and schedules\n- Answering general productivity and task management questions\n- Helping users organize and structure their projects\n\nWhen the user asks you to create tasks, respond with a helpful message and include a JSON code block with the \`\`\`tasks marker containing the task data, like this:\n\`\`\`tasks\n[{"title": "Task name", "description": "Details", "priority": "medium", "due_date": "2024-12-31", "tags": ["work"]}]\n\`\`\`\n\nBe concise, friendly, and practical. Keep responses focused on helping the user get things done.`;

        const reply = await callGroq(groqKey, systemPrompt, messages || []);
        result = { reply };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[document-ai] Action "${action}" completed successfully`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error(`[document-ai] Error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});