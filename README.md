# Storyteller AI Proxy

A Cloudflare Worker that proxies requests to AI APIs (OpenAI, Anthropic), keeping your API keys secret while enabling AI features in [Storyteller](https://github.com/markm208/storyteller) code playbacks hosted on static sites (GitHub Pages, GitLab Pages, Netlify, Vercel, or any static hosting service).

## Why Do I Need This?

When you host playbacks on a static site, there's no server to securely store your AI API key. This Worker acts as a middleman:

1. Your playback page sends a request to this Worker
2. The Worker adds your secret API key
3. The Worker forwards the request to OpenAI/Anthropic
4. The response comes back to your page

Your API key never touches the browser.

## Setup Instructions

### Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- An API key from [OpenAI](https://platform.openai.com/api-keys) and/or [Anthropic](https://console.anthropic.com/)
- [Node.js](https://nodejs.org/) installed on your machine

### Step 1: Create Your Own Copy

Click the green **"Use this template"** button at the top of this repo to create your own copy.

### Step 2: Clone Your Repo Locally

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

### Step 3: Configure Your Domain

Edit `worker.js` and change the `ALLOWED_ORIGIN` to your hosting domain:

```javascript
// Examples (choose one that matches where your playback will be hosted):
const ALLOWED_ORIGIN = "https://yourusername.github.io";      // GitHub Pages
const ALLOWED_ORIGIN = "https://yourusername.gitlab.io";      // GitLab Pages
const ALLOWED_ORIGIN = "https://yoursite.netlify.app";        // Netlify
const ALLOWED_ORIGIN = "https://yourdomain.com";              // Custom domain
```

This ensures only your site can use your Worker (and your API quota).

### Step 4: Install Wrangler

Wrangler is Cloudflare's CLI tool. This can be run from any directory:

```bash
npm install -g wrangler
```

### Step 5: Login to Cloudflare

This can be run from any directory:

```bash
wrangler login
```

This opens a browser window to authenticate.

### Step 6: Deploy

***Important:* Run this command from a terminal opened in your cloned repo directory**

If you haven't already, navigate to your cloned repo directory:
```bash
cd path/to/your/cloned/repo
```

This is how Wrangler knows where to find your Worker code to deploy. Now, deploy your Worker:

```bash
wrangler deploy
```

> **First time only:** Cloudflare will ask you to register a `workers.dev` subdomain. Say yes and choose a subdomain name (e.g., `markm208`). This is a one-time setup for your Cloudflare account.

Cloudflare will output your Worker's URL, something like:

```
https://storyteller-ai-proxy.yourusername.workers.dev
```

### Step 7: Add Your API Key(s)

**Run the following commands from your cloned repo directory.**

Store your API key(s) as Cloudflare secrets. You need at least one:

**For OpenAI:**
```bash
wrangler secret put OPENAI_API_KEY
```

**For Anthropic:**
```bash
wrangler secret put ANTHROPIC_API_KEY
```

When prompted, paste your API key. It will be stored securely and never appear in your code.

### Step 8: Add URL to Your Playbacks

> **Note:** This step assumes you've already created a book or standalone playback using the [Storyteller VS Code extension](https://github.com/markm208/storyteller). See that repo for instructions on creating and publishing playbacks.

In your Storyteller book's `book.json`, add the `aiApiUrl` field:

```json
{
  "title": "My Book",
  "authors": [{ "name": "Your Name" }],
  "aiApiUrl": "https://storyteller-ai-proxy.yourusername.workers.dev",
  "chapters": []
}
```

You can also use the VS Code command **"Storyteller: Set AI API URL"**, or specify the URL when exporting a standalone playback.

## How It Works

The Worker accepts POST requests with this structure:

```javascript
{
  "provider": "openai",  // or "anthropic"
  "payload": {
    // The actual API request body in the provider's format
  }
}
```

If `provider` is omitted, it defaults to `"openai"`.

## Costs

- **Cloudflare Workers:** Free tier includes 100,000 requests per day
- **AI API usage:** You pay for your own usage based on your provider's pricing

## Security

- Your API key is stored as a Cloudflare secret, never in code
- CORS restricts requests to only your configured domain
- Other websites cannot use your Worker

## Troubleshooting

**"Forbidden" error:** Check that `ALLOWED_ORIGIN` in `worker.js` exactly matches your site's origin (including `https://`).

**"API key not configured" error:** Make sure you ran `wrangler secret put` for the provider you're trying to use. You can verify your secrets are set with:
```bash
wrangler secret list
```

**CORS errors in browser console:** The Worker's `ALLOWED_ORIGIN` doesn't match the domain where your playback is hosted.

**AI features not working on published playback:** Make sure `aiApiUrl` is set in your `book.json` and that you regenerated the playback files after adding it. The URL must be embedded in `playback.js` at export time.

## Updating

If you need to update the Worker code:

1. Make your changes to `worker.js`
2. Run `wrangler deploy` again

## Deleting and Starting Over

If you want to completely remove your Worker and start fresh:

**Using the command line:**
```bash
wrangler delete storyteller-ai-proxy
```

**Using the Cloudflare dashboard:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click on your Worker
4. Go to **Settings** → **Delete**

After deleting, you can re-deploy by running `wrangler deploy` again. Note that you'll need to re-add your API key secrets after deleting.

## License

MIT License - See [LICENSE](LICENSE) file.
