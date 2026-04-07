/* 
Title: AI-Conversation-Tool
Description: Converts Speech to Text and utilizes Groq AI to summarize things
Date Created: 4/3/26
Author: GoldenKisp
*/

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
<title>EchoAi • Premium Transcription</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --shadow-lg: 0 25px 45px -12px rgba(0, 0, 0, 0.25);
  --shadow-xl: 0 35px 60px -12px rgba(0, 0, 0, 0.3);
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --accent-gold: #f4d03f;
}

body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(-45deg, #0f0f23, #1a1a2e, #16213e, #0f3460);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
  z-index: -1;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-20px) rotate(120deg); }
  66% { transform: translateY(10px) rotate(240deg); }
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  animation: slideInDown 1s ease-out;
}

.header h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #e2e8f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.header p {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
  max-width: 500px;
  margin: 0 auto;
}

.mic-container {
  position: relative;
  margin-bottom: 2rem;
  animation: slideInUp 1s ease-out 0.2s both;
}

.mic-visualizer {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #667eea, #764ba2, #f093fb, #667eea);
  animation: pulse 2s ease-in-out infinite;
  position: relative;
  margin: 0 auto 1.5rem;
  box-shadow: var(--shadow-xl);
}

.mic-visualizer::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(10px);
}

.mic-visualizer.recording {
  animation: recordingPulse 1s ease-in-out infinite;
  box-shadow: 0 0 40px rgba(245, 87, 108, 0.6);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes recordingPulse {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    box-shadow: 0 0 40px rgba(245, 87, 108, 0.6);
  }
  50% { 
    transform: scale(1.1) rotate(180deg);
    box-shadow: 0 0 60px rgba(245, 87, 108, 0.8);
  }
}

.toggle-btn {
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  color: white;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-width: 200px;
}

.toggle-btn:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
  border-color: rgba(255, 255, 255, 0.3);
}

.toggle-btn:active {
  transform: translateY(-1px);
}

.toggle-btn.recording {
  background: linear-gradient(135deg, #f5576c, #f093fb);
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  width: 100%;
  margin-top: 2rem;
  animation: slideInUp 1s ease-out 0.4s both;
}

.content-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 2rem;
  height: 280px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.content-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: rgba(255, 255, 255, 0.3);
}

.content-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
}

.live .card-icon { background: var(--primary-gradient); }
.summary .card-icon { 
  background: linear-gradient(135deg, #11998e, #38ef7d); 
}
.fact .card-icon { 
  background: linear-gradient(135deg, #f4d03f, #fab005); 
}

.card-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-content {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.6;
  height: 160px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.3) transparent;
}

.card-content::-webkit-scrollbar {
  width: 4px;
}

.card-content::-webkit-scrollbar-track {
  background: transparent;
}

.card-content::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
}

.summarize-btn {
  grid-column: 1 / -1;
  background: var(--primary-gradient);
  backdrop-filter: blur(20px);
  border: none;
  color: white;
  padding: 1rem 3rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 1rem;
  position: relative;
  overflow: hidden;
}

.summarize-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-xl);
}

.summarize-btn:active {
  transform: translateY(-1px) scale(1);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 1rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  animation: pulseDot 2s infinite;
}

.status-dot.recording {
  background: #f5576c;
  animation: pulseDotFast 1s infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes pulseDotFast {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.4); }
}

@keyframes slideInDown {
  from { opacity: 0; transform: translateY(-50px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .container {
    padding: 1rem;
  }
  
  .content-card {
    height: 240px;
    padding: 1.5rem;
  }
}
</style>
</head>

<body>
<div class="container">
  <div class="header">
    <h1><i class="fas fa-microphone-alt"></i> EchoAi</h1>
    <p>Real-time transcription with intelligent summaries and fact-checking</p>
  </div>

  <div class="mic-container">
    <div id="micVisualizer" class="mic-visualizer">
      <i class="fas fa-microphone" style="font-size: 2rem; color: white; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></i>
    </div>
    <button id="toggleBtn" class="toggle-btn">
      <i class="fas fa-microphone-alt"></i> Start Recording
    </button>
    <div id="statusIndicator" class="status-indicator" style="display: none;">
      <div id="statusDot" class="status-dot"></div>
      Listening...
    </div>
  </div>

  <div class="content-grid">
    <div class="content-card live">
      <div class="card-header">
        <div class="card-icon">
          <i class="fas fa-circle-notch fa-spin"></i>
        </div>
        <div class="card-title">Live Transcription</div>
      </div>
      <div id="liveText" class="card-content">Click "Start Recording" to begin...</div>
    </div>

    <div class="content-card summary">
      <div class="card-header">
        <div class="card-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="card-title">AI Summary</div>
      </div>
      <div id="summary" class="card-content">Summary will appear here automatically...</div>
    </div>

    <div class="content-card fact">
      <div class="card-header">
        <div class="card-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="card-title">Fact Check</div>
      </div>
      <div id="factCheck" class="card-content">Ready to verify accuracy</div>
    </div>
  </div>

  <button id="summarizeBtn" class="summarize-btn">
    <i class="fas fa-sparkles"></i> Generate Summary Now
  </button>
</div>

<script>
let recording = false;
let liveText = "";
let autoInterval = null;
let lastSummarizedText = "";

const toggleBtn = document.getElementById("toggleBtn");
const micVisualizer = document.getElementById("micVisualizer");
const liveTextDiv = document.getElementById("liveText");
const summaryDiv = document.getElementById("summary");
const factCheckDiv = document.getElementById("factCheck");
const summarizeBtn = document.getElementById("summarizeBtn");
const statusIndicator = document.getElementById("statusIndicator");
const statusDot = document.getElementById("statusDot");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Please use Chrome or Edge for the best experience");
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onerror = (e) => {
  console.error("Speech error:", e.error);
  if (recording) {
    stopRecording();
  }
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
  liveTextDiv.textContent = (liveText + " " + interim).trim() || "Listening...";
};

toggleBtn.onclick = () => {
  if (!recording) startRecording();
  else stopRecording();
};

function startRecording() {
  recording = true;
  liveText = "";
  liveTextDiv.textContent = "Listening...";
  
  recognition.start();
  
  toggleBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
  toggleBtn.classList.add('recording');
  micVisualizer.classList.add('recording');
  statusIndicator.style.display = 'inline-flex';
  statusDot.classList.add('recording');

  autoInterval = setInterval(autoSummarize, 10000);
}

function stopRecording() {
  recording = false;
  recognition.stop();
  
  toggleBtn.innerHTML = '<i class="fas fa-microphone-alt"></i> Start Recording';
  toggleBtn.classList.remove('recording');
  micVisualizer.classList.remove('recording');
  statusIndicator.style.display = 'none';
  statusDot.classList.remove('recording');

  clearInterval(autoInterval);
}

async function autoSummarize() {
  if (!liveText.trim() || liveText === lastSummarizedText) return;
  lastSummarizedText = liveText;

  try {
    const res = await fetch('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: liveText })
    });

    const data = await res.json();
    
    summaryDiv.textContent = data.summary || "No summary generated";
    factCheckDiv.textContent = data.factCheck || "No issues detected";
    
    summaryDiv.parentElement.style.transform = 'translateY(-8px)';
    factCheckDiv.parentElement.style.transform = 'translateY(-8px)';
    
    setTimeout(() => {
      summaryDiv.parentElement.style.transform = 'translateY(0)';
      factCheckDiv.parentElement.style.transform = 'translateY(0)';
    }, 300);
    
  } catch (err) {
    console.error(err);
  }
}

summarizeBtn.onclick = autoSummarize;

// Typewriter effect for live text
const observer = new MutationObserver(() => {
  liveTextDiv.style.animation = 'none';
  liveTextDiv.offsetHeight;
  liveTextDiv.style.animation = 'typewriter 0.5s ease-out';
});

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
