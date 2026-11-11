const { HttpsError } = require("firebase-functions/v2/https");

function getAiConfig(apiKeyValue, runtimeConfig = {}) {
  const apiKey = typeof apiKeyValue === "function" ? apiKeyValue() : apiKeyValue;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "AI provider API key is not configured. Save it from the Admin Panel.");
  }

  return {
    apiKey,
    provider: runtimeConfig.provider || process.env.AI_PROVIDER || "gemini",
    model: runtimeConfig.model || process.env.AI_MODEL || "gemini-3.1-flash-lite",
    baseUrl: runtimeConfig.baseUrl || process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  };
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpsError("internal", "The AI provider returned malformed JSON.");
  }
}

async function callOpenAiCompatible({ apiKey, model, baseUrl, system, user }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 100000);

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      throw new HttpsError("unavailable", `AI provider error (${response.status}).`);
    }

    const body = await response.json();
    const content = body.choices?.[0]?.message?.content || body.data || body.content || "{}";
    const parsed = typeof content === "string" ? parseJsonSafely(content) : content;
    return parsed;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new HttpsError("deadline-exceeded", "The AI request timed out. Please retry.");
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("unavailable", "The AI provider request failed. Please retry.");
  } finally {
    clearTimeout(timer);
  }
}

function geminiGenerateUrl(baseUrl, model) {
  const normalizedBaseUrl = String(baseUrl || "").replace(/\/+$/, "");
  const encodedModel = encodeURIComponent(String(model || "").trim());
  if (!normalizedBaseUrl || !encodedModel) {
    throw new HttpsError("failed-precondition", "Gemini configuration is incomplete.");
  }
  return `${normalizedBaseUrl}/models/${encodedModel}:generateContent`;
}

async function callGemini({ apiKey, model, baseUrl, system, user }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 100000);

  try {
    const response = await fetch(geminiGenerateUrl(baseUrl, model), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new HttpsError("unavailable", `AI provider error (${response.status}).`);
    }

    const body = await response.json();
    const content = body.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();
    if (!content) {
      throw new HttpsError("internal", "The AI provider returned no JSON content.");
    }
    return parseJsonSafely(content);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new HttpsError("deadline-exceeded", "The AI request timed out. Please retry.");
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("unavailable", "The AI provider request failed. Please retry.");
  } finally {
    clearTimeout(timer);
  }
}

async function callCustomProvider({ apiKey, model, baseUrl, system, user, jobType }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 100000);

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        jobType,
        system,
        user,
        json: true,
      }),
    });

    if (!response.ok) {
      throw new HttpsError("unavailable", `AI provider error (${response.status}).`);
    }

    const body = await response.json();
    return body.data || body.analysis || body;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new HttpsError("deadline-exceeded", "The AI request timed out. Please retry.");
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("unavailable", "The AI provider request failed. Please retry.");
  } finally {
    clearTimeout(timer);
  }
}

async function callAi({ apiKeyValue, system, user, jobType, runtimeConfig }) {
  const config = getAiConfig(apiKeyValue, runtimeConfig);
  const provider = String(config.provider).toLowerCase();

  let data;
  if (provider === "gemini" || provider === "google") {
    data = await callGemini({ ...config, system, user });
  } else if (["custom", "rankvault", "own", "internal"].includes(provider)) {
    data = await callCustomProvider({ ...config, system, user, jobType });
  } else {
    data = await callOpenAiCompatible({ ...config, system, user });
  }

  return {
    provider: config.provider,
    model: config.model,
    data,
  };
}

module.exports = { callAi, getAiConfig, geminiGenerateUrl };
