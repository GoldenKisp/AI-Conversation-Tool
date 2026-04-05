const apiKey = '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';
const fs = require('fs');
const { spawn } = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 9495;
app.use(bodyParser.json());

const cloudflaredPath = './cloudflared'; // Github won't let me add this on the repository cause the file is too big so you will have to manually download it
let cloudflaredProcess = null;
let tunnelUrl = `http://localhost:${port}`;

try {
  fs.chmodSync(cloudflaredPath, 0o755);
} catch (err) {
  console.error('Failed to chmod cloudflared:', err);
}

// The HTML for the site you can use AI if you want to fix this but if you like this I guess you can keep it
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Voice-to-Text AI</title>

<style>
body {
  font-family: 'Inter', sans-serif;
  background: #f0f2f5;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  max-width: 700px;
  width: 100%;
  padding: 30px;
  text-align: center;
}

button {
  background: #4f46e5;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  margin: 10px;
  cursor: pointer;
}

.box {
  margin-top: 10px;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #ddd;
  min-height: 80px;
  text-align: left;
  white-space: pre-wrap;
}

.summary {
  background: #eef4ff;
}

h3 {
  text-align: left;
  margin-top: 20px;
}
</style>
</head>

<body>
<div class="container">
  <h1>🎙 Voice-to-Text + AI</h1>

  <button id="toggleBtn">Start Recording</button>

  <div id="liveText" class="box"></div>

  <button id="summarizeBtn">Manual Summarize</button>

  <h3>Summary</h3>
  <div id="summary" class="box summary"></div>

  <h3>Fact Check</h3>
  <div id="factCheck" class="box">No lies detected</div>
</div>

<script>
let recording = false;
let liveText = "";
let autoInterval = null;
let lastSummarizedText = "";

const toggleBtn = document.getElementById("toggleBtn");
const liveTextDiv = document.getElementById("liveText");
const summaryDiv = document.getElementById("summary");
const factCheckDiv = document.getElementById("factCheck");
const summarizeBtn = document.getElementById("summarizeBtn");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Use Chrome or Edge");
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onerror = (e) => {
  console.error("Speech error:", e.error);
};

recognition.onresult = (event) => {
  let interim = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const text = event.results[i][0].transcript;

    if (event.results[i].isFinal) {
      liveText += " " + text;
    } else {
      interim += text;
    }
  }

  liveTextDiv.textContent = liveText + " " + interim;
};

toggleBtn.onclick = () => {
  if (!recording) startRecording();
  else stopRecording();
};

function startRecording() {
  recording = true;
  liveText = "";
  liveTextDiv.textContent = "";
  recognition.start();

  toggleBtn.textContent = "Stop Recording";

  autoInterval = setInterval(autoSummarize, 10000);
}

function stopRecording() {
  recording = false;
  recognition.stop();
  toggleBtn.textContent = "Start Recording";

  clearInterval(autoInterval);
}

async function autoSummarize() {
  if (!liveText.trim()) return;

  // prevent duplicate API calls
  if (liveText === lastSummarizedText) return;
  lastSummarizedText = liveText;

  try {
    const res = await fetch('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: liveText })
    });

    const data = await res.json();

    summaryDiv.textContent = data.summary;
    factCheckDiv.textContent = data.factCheck || "No lies detected";
  } catch (err) {
    console.error(err);
  }
}

summarizeBtn.onclick = autoSummarize;
</script>
</body>
</html>
  `);
});

app.post('/summarize', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.json({
      summary: "No content",
      factCheck: "No lies detected"
    });
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
You MUST respond in valid JSON only.

Rules:
- The "summary" MUST only summarize what the speaker said. Keep it short and clear.
- Do NOT add extra explanations or opinions.

- The "factCheck" MUST be VERY short:
  - If correct: "No lies detected"
  - If incorrect: "False – actual fact: <correct info>"
  - If uncertain: "Unclear"

Format:
{
  "summary": "short summary of speech",
  "factCheck": "very short result"
}

DO NOT include anything outside the JSON.
`
          },
          { role: "user", content }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let text = response.data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        summary: text,
        factCheck: "No lies detected"
      };
    }

    res.json({
      summary: parsed.summary || "No summary",
      factCheck: parsed.factCheck || "No lies detected"
    });

  } catch (err) {
    console.error(err);
    res.json({
      summary: "Error",
      factCheck: "No lies detected"
    });
  }
});

async function startCloudflaredTunnel() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(cloudflaredPath)) {
      console.warn('Cloudflared not found.');
      resolve(false);
      return;
    }

    console.log('Starting Cloudflared tunnel...');

    cloudflaredProcess = spawn(cloudflaredPath, [
      'tunnel',
      '--url', `http://localhost:${port}`,
      '--no-autoupdate'
    ]);

    cloudflaredProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Cloudflared]', output);

      const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
      if (match) {
        console.log('🌍 Public URL:', match[0]);
        resolve(true);
      }
    });

    cloudflaredProcess.stderr.on('data', (data) => {
      console.error('[Cloudflared ERROR]', data.toString());
    });

    cloudflaredProcess.on('close', (code) => {
      console.log('Cloudflared exited with code', code);
    });
  });
}

app.listen(port, async () => {
  console.log("Server running on port " + port);
  await startCloudflaredTunnel();
});
