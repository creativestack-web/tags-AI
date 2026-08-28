# TagsAI — AI YouTube Tags Generator

A professional, modern AI-powered YouTube video tag generator website.  
Enter your video title, topic, or description and instantly get 20 optimized YouTube tags.

---

## What This Website Does

- You type your YouTube video title, topic, keywords, or description.
- Click the **Generate Tags** button.
- AI generates exactly 20 relevant, optimized YouTube tags for your video.
- You can **Copy All Tags** in comma-separated format (ready to paste into YouTube).
- You can click any individual tag to copy just that tag.

---

## Files In This Project

```
youtube-tags-generator/
│
├── index.html    ← The main webpage
├── style.css     ← All the visual styling
├── script.js     ← All the JavaScript and AI logic
└── README.md     ← This file (instructions)
```

---

## Step 1: Get Your Anthropic API Key

1. Go to **https://console.anthropic.com/**
2. Create a free account or log in.
3. Click **"API Keys"** in the left sidebar.
4. Click **"Create Key"**.
5. Copy your API key — it starts with `sk-ant-...`

---

## Step 2: Add Your API Key

1. Open the file called **`script.js`** in any text editor  
   (Notepad, VS Code, TextEdit, etc.)

2. Find this line near the top of the file:

   ```javascript
   API_KEY: "PASTE_YOUR_API_KEY_HERE",
   ```

3. Replace `PASTE_YOUR_API_KEY_HERE` with your actual API key:

   ```javascript
   API_KEY: "sk-ant-api03-your-actual-key-here",
   ```

4. Save the file.

---

## Step 3: Open the Website

Simply open the **`index.html`** file in your web browser:

- **Windows:** Double-click `index.html`, or right-click → Open With → Chrome/Edge/Firefox
- **Mac:** Double-click `index.html`, or right-click → Open With → Safari/Chrome
- **Linux:** Double-click `index.html` or run `xdg-open index.html`

No web server is required to view the website locally.

---

## ⚠️ Important: CORS Issue When Calling the API From a Browser

**This is the most important technical note in this README.**

The Anthropic Claude API **does not allow direct calls from a web browser** due to a security restriction called **CORS (Cross-Origin Resource Sharing)**.

This means:

- If you open `index.html` directly in your browser and click Generate, you will likely see an error saying **"Could not connect to the AI service"** or a **Network Error**.
- This is **not** a bug in the code — it is a browser security policy.

### How to Fix This (Choose One Option)

---

### Option A: Use a Local Development Server (Recommended for Testing)

Install **Node.js** from https://nodejs.org/ then run:

```bash
npm install -g http-server
cd your-project-folder
http-server
```

Open `http://localhost:8080` in your browser.

> Note: Even with a local server, the API may still block browser calls.  
> You may still need Option B or C for the API to work.

---

### Option B: Use a Serverless Backend (Recommended for Production)

Move the API call to a serverless function so your API key stays secret and CORS is handled properly.

**With Netlify Functions (free):**

1. Create a file: `netlify/functions/generate-tags.js`

```javascript
const Anthropic = require("@anthropic-ai/sdk");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { userInput } = JSON.parse(event.body);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Generate exactly 20 YouTube tags for: "${userInput}". Return only JSON: {"tags":["tag1","tag2",...]}`,
        },
      ],
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: message.content[0].text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

2. Set your API key as an **environment variable** in Netlify:
   - Go to your Netlify site settings → Environment Variables
   - Add: `ANTHROPIC_API_KEY` = your key

3. In `script.js`, change the API endpoint to your function URL:

```javascript
API_ENDPOINT: "/.netlify/functions/generate-tags",
```

---

### Option C: Use a CORS Proxy (Quick Testing Only — Not for Production)

For a very quick local test only, you can enable the CORS proxy in `script.js`:

```javascript
const USE_CORS_PROXY = true;
```

> ⚠️ **Warning:** Do not use this for a real website. The proxy can see your API key and requests.

---

## How to Test the Generator

1. Open the website in your browser.
2. Type a YouTube video title, such as:  
   `How to Make a Website With AI`
3. Click the **Generate Tags** button.
4. Wait a few seconds for the AI to respond.
5. 20 tags will appear as clickable chips.

---

## How the Copy All Tags Feature Works

1. After tags are generated, click the **"Copy All Tags"** button.
2. All 20 tags are copied to your clipboard in this format:

```
ai website, make website with ai, web development, html tutorial, ...
```

3. Go to YouTube Studio when uploading your video.
4. Click the **Tags** field.
5. Paste (Ctrl+V or Cmd+V).
6. YouTube will automatically separate them.

---

## How to Click Individual Tags

- Click any individual tag chip to copy just that one tag.
- The chip will turn green and show "Copied!" briefly.
- A small notification will confirm the copy at the bottom.

---

## How to Deploy the Website

### Option 1: Netlify (Free & Easy)

1. Go to **https://netlify.com** and create a free account.
2. Drag and drop your project folder onto the Netlify dashboard.
3. Your website is live instantly.
4. Set your API key as an environment variable (recommended).

### Option 2: GitHub Pages (Free)

1. Create a GitHub account at **https://github.com**
2. Create a new repository.
3. Upload your files (`index.html`, `style.css`, `script.js`).
4. Go to Settings → Pages → Set source to `main` branch.
5. Your site will be live at `https://yourusername.github.io/your-repo/`

### Option 3: Vercel (Free)

1. Go to **https://vercel.com** and sign up.
2. Import your GitHub repository or drag and drop your project.
3. Deploy with one click.

### Option 4: Traditional Web Hosting

Upload `index.html`, `style.css`, and `script.js` to your web hosting using FTP.

---

## 🔐 API Key Security Warning

**Please read this carefully.**

Your API key is currently inside `script.js`, which is a public JavaScript file.  
This means:

- ✅ Fine for personal testing on your computer.
- ✅ Fine if you are the only person who will access the site.
- ❌ **Not safe** if you deploy to a public website.
- ❌ Anyone who views your website's source code can find your API key.
- ❌ If someone finds your key, they can use it and charge API costs to your account.

**For a public website, always move the API call to a backend server.**  
See Option B in the CORS section above for a free Netlify Functions example.

You can also protect yourself by:
- Setting **spending limits** on your Anthropic account.
- Setting **IP allowlists** if your hosting provider supports it.
- Rotating your API key regularly.

---

## Customizing the Website

### Change the AI Model

In `script.js`, find:

```javascript
MODEL: "claude-3-haiku-20240307",
```

Available options:
- `claude-3-haiku-20240307` — Fastest and cheapest (recommended)
- `claude-3-5-sonnet-20241022` — Smarter but slower and costs more
- `claude-3-opus-20240229` — Most intelligent, most expensive

### Change the Number of Tags

The prompt inside `script.js` in the `buildPrompt()` function asks for 20 tags.  
You can change the number by editing the prompt text.

### Change Colors

Open `style.css` and look for the `:root` section at the top.  
Change the color values to match your preferred color scheme.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Network error" or "Could not connect" | CORS issue — use a backend proxy. See Option B above. |
| "Invalid API key" | Check your API key in `script.js`. Make sure it starts with `sk-ant-`. |
| "Rate limit reached" | Wait 30–60 seconds and try again. |
| Tags don't appear | Open browser DevTools (F12) → Console tab and check for error messages. |
| Website looks broken | Make sure all 3 files are in the same folder. |

---

## Browser Support

This website works on all modern browsers:

- ✅ Google Chrome (recommended)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Android Chrome)

---

## License

This project is free to use for personal and commercial purposes.  
Built with ❤️ for YouTube creators.