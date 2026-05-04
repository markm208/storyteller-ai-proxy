// Storyteller AI Proxy
// A Cloudflare Worker that proxies requests to AI APIs (OpenAI, Anthropic)
// keeping API keys secret while enabling AI features in static playbacks.

// Configure this to your hosting domain (e.g., GitHub Pages, GitLab Pages, Netlify, etc.)
const ALLOWED_ORIGIN = "https://yourdomain.example.com";

// Provider configurations
const PROVIDERS = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }),
    getApiKey: (env) => env.OPENAI_API_KEY
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    }),
    getApiKey: (env) => env.ANTHROPIC_API_KEY
  }
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Check origin
    const origin = request.headers.get("Origin");
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    try {
      const body = await request.json();

      // Determine which provider to use (default to openai for backwards compatibility)
      const providerName = body.provider || "openai";
      const provider = PROVIDERS[providerName];

      if (!provider) {
        return new Response(JSON.stringify({
          error: true,
          response: `Unknown provider: ${providerName}`
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN
          }
        });
      }

      // Get API key for this provider
      const apiKey = provider.getApiKey(env);
      if (!apiKey) {
        return new Response(JSON.stringify({
          error: true,
          response: `API key not configured for provider: ${providerName}`
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN
          }
        });
      }

      // Forward request to the AI provider
      const aiResponse = await fetch(provider.url, {
        method: "POST",
        headers: provider.getHeaders(apiKey),
        body: JSON.stringify(body.payload)
      });

      // Return the response with CORS headers
      const responseData = await aiResponse.text();
      return new Response(responseData, {
        status: aiResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: true,
        response: "Proxy error: " + error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN
        }
      });
    }
  }
};
