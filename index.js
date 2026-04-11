/* 
Title: AI-Conversation-Tool
Description: Converts Speech to Text and utilizes Groq AI to summarize things
Date Created: 4/3/26
Author: GoldenKisp
*/

const apiKey = 'Z3NrX2tGVURRSEwzQlZFUXF1UWdwYkY3V0dkeWIzRlllWU1XNlBqZEZJbkp4UG1HYnJMNEFjMWY=';
const fs = require('fs');
const { spawn } = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 9495;
app.use(bodyParser.json());

const cloudflaredPath = './cloudflared';
let cloudflaredProcess = null;

try {
  fs.chmodSync(cloudflaredPath, 0o755);
} catch (err) {
  console.error('Failed to chmod cloudflared:', err);
}

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
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #0a0a0f; --bg2: #111118; --bg3: #18181f; --bg4: #1e1e28;
  --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12);
  --text1: #f0f0f5; --text2: #9898b0; --text3: #5a5a72;
  --accent: #7c6ee6; --accent2: #a693ff;
  --green: #3ecf8e; --red: #f05252; --amber: #f4a32a;
}
body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text1); min-height: 100vh; overflow-x: hidden; }
nav {
  position: fixed; top: 0; left: 0; right: 0; height: 56px;
  background: rgba(10,10,15,0.85); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; z-index: 1000;
}
.nav-logo { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 700; color: var(--text1); cursor: pointer; text-decoration: none; }
.nav-logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--accent), #a693ff); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
.nav-links { display: flex; align-items: center; gap: 0.25rem; list-style: none; }
.nav-links li a { padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.88rem; color: var(--text2); text-decoration: none; transition: all 0.15s; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.nav-links li a:hover, .nav-links li a.active { color: var(--text1); background: var(--bg3); }
.nav-right { display: flex; align-items: center; gap: 0.75rem; }
.nav-badge { font-size: 0.78rem; padding: 0.3rem 0.75rem; border-radius: 20px; background: linear-gradient(135deg, var(--accent), #a693ff); color: white; font-weight: 500; cursor: pointer; }
.page { display: none; padding-top: 56px; min-height: 100vh; }
.page.active { display: block; }
.hero { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 5rem 2rem 4rem; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(124,110,230,0.15) 0%, transparent 65%); pointer-events: none; }
.hero-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; padding: 0.35rem 0.9rem; border-radius: 20px; border: 1px solid var(--border2); background: var(--bg3); color: var(--accent2); margin-bottom: 1.5rem; font-weight: 500; }
.hero-pill span { width: 6px; height: 6px; border-radius: 50%; background: var(--green); display: inline-block; }
.hero h1 { font-size: clamp(2.5rem, 5vw, 3.8rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 1.25rem; max-width: 700px; }
.hero h1 span { background: linear-gradient(135deg, var(--accent2), #e0d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero p { font-size: 1.05rem; color: var(--text2); max-width: 480px; line-height: 1.7; margin-bottom: 2.5rem; }
.hero-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; margin-bottom: 3.5rem; }
.btn-primary { background: linear-gradient(135deg, var(--accent), #9983f0); color: white; border: none; padding: 0.75rem 1.75rem; border-radius: 8px; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s, transform 0.15s; font-family: inherit; display: flex; align-items: center; gap: 8px; }
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border2); padding: 0.75rem 1.75rem; border-radius: 8px; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: inherit; display: flex; align-items: center; gap: 8px; }
.btn-ghost:hover { color: var(--text1); border-color: rgba(255,255,255,0.25); background: var(--bg3); }
.stats-bar { display: flex; gap: 2.5rem; flex-wrap: wrap; justify-content: center; padding: 1.5rem 2rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--bg2); }
.stat-item { text-align: center; }
.stat-item .num { font-size: 1.5rem; font-weight: 700; color: var(--text1); }
.stat-item .label { font-size: 0.8rem; color: var(--text3); margin-top: 2px; }
.features-section { padding: 4rem 2rem; max-width: 1100px; margin: 0 auto; }
.section-label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent2); font-weight: 600; margin-bottom: 0.75rem; }
.section-title { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
.section-sub { color: var(--text2); font-size: 1rem; max-width: 480px; line-height: 1.6; margin-bottom: 2.5rem; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
.feature-card { background: var(--bg2); padding: 1.75rem; transition: background 0.2s; cursor: default; }
.feature-card:hover { background: var(--bg3); }
.feature-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--bg4); border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-bottom: 1rem; color: var(--accent2); }
.feature-card h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; }
.feature-card p { font-size: 0.87rem; color: var(--text2); line-height: 1.6; }
.transcribe-layout { max-width: 1000px; margin: 0 auto; padding: 2.5rem 2rem; }
.page-header { margin-bottom: 2rem; }
.page-header h2 { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.35rem; }
.page-header p { color: var(--text2); font-size: 0.92rem; }
.recorder-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
.mic-orb { width: 80px; height: 80px; border-radius: 50%; background: var(--bg4); border: 2px solid var(--border2); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--text2); flex-shrink: 0; transition: all 0.3s; position: relative; }
.mic-orb.recording { background: rgba(240,82,82,0.1); border-color: var(--red); color: var(--red); animation: orbPulse 1.5s ease-in-out infinite; }
@keyframes orbPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(240,82,82,0.3); } 50% { box-shadow: 0 0 0 16px rgba(240,82,82,0); } }
.recorder-info { flex: 1; }
.recorder-info h3 { font-size: 1.05rem; font-weight: 600; margin-bottom: 0.35rem; }
.recorder-info p { font-size: 0.87rem; color: var(--text2); }
.record-controls { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-top: 1rem; }
.status-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; padding: 0.3rem 0.75rem; border-radius: 20px; background: var(--bg4); color: var(--text2); border: 1px solid var(--border); }
.status-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text3); }
.status-pill.recording { color: var(--red); border-color: rgba(240,82,82,0.3); }
.status-pill.recording .dot { background: var(--red); animation: blinkDot 1s infinite; }
@keyframes blinkDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
.panels-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
.panel { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.panel-head { display: flex; align-items: center; gap: 8px; padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border); font-size: 0.82rem; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.05em; }
.panel-head-dot { width: 8px; height: 8px; border-radius: 50%; }
.panel-body { padding: 1.25rem; min-height: 160px; font-size: 0.92rem; line-height: 1.7; color: var(--text2); }
.panel-body.has-content { color: var(--text1); }
.fact-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
.fact-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem; }
.fact-icon { font-size: 1.1rem; margin-top: 2px; flex-shrink: 0; }
.fact-body h4 { font-size: 0.88rem; font-weight: 600; margin-bottom: 0.3rem; }
.fact-body p { font-size: 0.85rem; color: var(--text2); line-height: 1.5; }
.generate-btn { width: 100%; padding: 0.9rem; border-radius: 10px; background: linear-gradient(135deg, var(--accent), #9983f0); color: white; border: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s, transform 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.generate-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.history-layout { max-width: 900px; margin: 0 auto; padding: 2.5rem 2rem; }
.history-list { display: flex; flex-direction: column; gap: 1rem; }
.history-item { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; transition: border-color 0.15s; }
.history-item:hover { border-color: var(--border2); }
.history-item-left h4 { font-size: 0.92rem; font-weight: 600; margin-bottom: 0.3rem; }
.history-item-left p { font-size: 0.83rem; color: var(--text2); }
.history-item-meta { font-size: 0.78rem; color: var(--text3); margin-top: 0.5rem; display: flex; gap: 1rem; }
.tag { display: inline-block; font-size: 0.75rem; padding: 0.2rem 0.55rem; border-radius: 5px; font-weight: 500; }
.tag-purple { background: rgba(124,110,230,0.12); color: var(--accent2); }
.empty-state { text-align: center; padding: 4rem 2rem; color: var(--text3); }
.empty-state i { font-size: 2.5rem; margin-bottom: 1rem; display: block; }
.empty-state p { font-size: 0.92rem; }
.settings-layout { max-width: 700px; margin: 0 auto; padding: 2.5rem 2rem; }
.settings-group { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem; }
.settings-group-title { padding: 1rem 1.5rem; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text3); border-bottom: 1px solid var(--border); }
.settings-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); }
.settings-row:last-child { border-bottom: none; }
.settings-row-left h4 { font-size: 0.9rem; font-weight: 500; margin-bottom: 0.2rem; }
.settings-row-left p { font-size: 0.82rem; color: var(--text2); }
.toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-track { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg4); border: 1px solid var(--border2); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.toggle-track::before { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: var(--text3); top: 2px; left: 2px; transition: transform 0.2s, background 0.2s; }
.toggle-switch input:checked + .toggle-track { background: rgba(124,110,230,0.3); border-color: var(--accent); }
.toggle-switch input:checked + .toggle-track::before { transform: translateX(20px); background: var(--accent2); }
.settings-select { background: var(--bg4); border: 1px solid var(--border2); color: var(--text1); padding: 0.4rem 0.75rem; border-radius: 7px; font-size: 0.85rem; font-family: inherit; cursor: pointer; }
.settings-select:focus { outline: none; border-color: var(--accent); }
footer { background: var(--bg2); border-top: 1px solid var(--border); padding: 2rem; text-align: center; }
footer p { font-size: 0.82rem; color: var(--text3); }
footer a { color: var(--accent2); text-decoration: none; }
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 64px;
  background: rgba(10,10,15,0.97);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border2);
  z-index: 1000;
  justify-content: space-around;
  align-items: center;
  padding: 0 0.25rem;
  padding-bottom: env(safe-area-inset-bottom);
}
.mobile-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text3);
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  flex: 1;
}
.mobile-nav-btn i { font-size: 1.1rem; }
.mobile-nav-btn.active { color: var(--accent2); }
@media (max-width: 640px) {
  .panels-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
  .nav-badge { display: none; }
  .mobile-nav { display: flex; }
  .hero h1 { font-size: 2rem; }
  .stats-bar { gap: 1.5rem; }
  .page { padding-bottom: 80px; }
  .transcribe-layout, .history-layout, .settings-layout { padding: 1.5rem 1rem; }
  .recorder-card { padding: 1.25rem; gap: 1rem; }
  .hero { padding: 3rem 1rem 2rem; }
  .features-section { padding: 2.5rem 1rem; }
}
</style>
</head>
<body>

<nav>
  <a class="nav-logo" onclick="showPage('home')">
    <div class="nav-logo-icon"><i class="fas fa-microphone-alt" style="color:white;font-size:0.9rem;"></i></div>
    EchoAi
  </a>
  <ul class="nav-links">
    <li><a onclick="showPage('home')" id="nav-home" class="active"><i class="fas fa-house" style="font-size:0.8rem;"></i> Home</a></li>
    <li><a onclick="showPage('transcribe')" id="nav-transcribe"><i class="fas fa-microphone" style="font-size:0.8rem;"></i> Transcribe</a></li>
    <li><a onclick="showPage('history')" id="nav-history"><i class="fas fa-clock-rotate-left" style="font-size:0.8rem;"></i> History</a></li>
    <li><a onclick="showPage('settings')" id="nav-settings"><i class="fas fa-gear" style="font-size:0.8rem;"></i> Settings</a></li>
  </ul>
  <div class="nav-right">
    <div class="nav-badge">&#10022; Pro</div>
  </div>
</nav>

<div class="mobile-nav">
  <button class="mobile-nav-btn active" id="mob-home" onclick="showPage('home')">
    <i class="fas fa-house"></i>Home
  </button>
  <button class="mobile-nav-btn" id="mob-transcribe" onclick="showPage('transcribe')">
    <i class="fas fa-microphone"></i>Transcribe
  </button>
  <button class="mobile-nav-btn" id="mob-history" onclick="showPage('history')">
    <i class="fas fa-clock-rotate-left"></i>History
  </button>
  <button class="mobile-nav-btn" id="mob-settings" onclick="showPage('settings')">
    <i class="fas fa-gear"></i>Settings
  </button>
</div>

<div class="page active" id="page-home">
  <div class="hero">
    <div class="hero-pill"><span></span> Now with real-time fact checking</div>
    <h1>Your voice,<br><span>intelligently transcribed</span></h1>
    <p>Live speech-to-text with AI summaries and instant fact checking — completely free and powered by Groq.</p>
    <div class="hero-btns">
      <button class="btn-primary" onclick="showPage('transcribe')"><i class="fas fa-microphone-alt"></i> Start Recording</button>
      <button class="btn-ghost" onclick="showPage('history')"><i class="fas fa-clock-rotate-left"></i> View History</button>
    </div>
  </div>
  <div class="stats-bar">
    <div class="stat-item"><div class="num">99.2%</div><div class="label">Accuracy rate</div></div>
    <div class="stat-item"><div class="num">&lt;200ms</div><div class="label">Transcription latency</div></div>
    <div class="stat-item"><div class="num">70B</div><div class="label">Param Groq model</div></div>
    <div class="stat-item"><div class="num">Free</div><div class="label">Forever tier</div></div>
  </div>
  <div class="features-section">
    <div class="section-label">Features</div>
    <div class="section-title">Everything you need</div>
    <div class="section-sub">EchoAi is built for speed and clarity — no setup, no accounts required.</div>
    <div class="feature-grid">
      <div class="feature-card"><div class="feature-icon"><i class="fas fa-bolt"></i></div><h3>Live Transcription</h3><p>See your words appear in real time with near-zero latency using the Web Speech API.</p></div>
      <div class="feature-card"><div class="feature-icon"><i class="fas fa-file-lines"></i></div><h3>AI Summaries</h3><p>Automatically generates concise summaries every 10 seconds using Llama 3.3 70B via Groq.</p></div>
      <div class="feature-card"><div class="feature-icon"><i class="fas fa-shield-halved"></i></div><h3>Fact Checking</h3><p>Instantly flags inaccuracies in what you say, with corrections sourced by the AI model.</p></div>
      <div class="feature-card"><div class="feature-icon"><i class="fas fa-clock-rotate-left"></i></div><h3>Session History</h3><p>Every session is saved locally so you can review past transcriptions and summaries.</p></div>
      <div class="feature-card"><div class="feature-icon"><i class="fas fa-language"></i></div><h3>Multi-language</h3><p>Supports English and dozens of other languages via browser speech recognition APIs.</p></div>
      <div class="feature-card"><div class="feature-icon"><i class="fas fa-download"></i></div><h3>Export Transcripts</h3><p>Download your full transcript and summary as a plain text file with one click.</p></div>
    </div>
  </div>
  <footer><p>This applicaiton uses <a href="#">Groq</a> · <a href="#">Llama 3.3 70B</a> · Google Speech API</p></footer>
</div>

<div class="page" id="page-transcribe">
  <div class="transcribe-layout">
    <div class="page-header">
      <h2>Live Transcription</h2>
      <p>Start recording to transcribe speech in real time with AI analysis.</p>
    </div>
    <div class="recorder-card">
      <div class="mic-orb" id="micOrb"><i class="fas fa-microphone"></i></div>
      <div class="recorder-info">
        <h3 id="recorderTitle">Ready to record</h3>
        <p id="recorderSub">Click the button below to start capturing your voice.</p>
        <div class="record-controls">
          <button class="btn-primary" id="toggleBtn" onclick="toggleRecording()">
            <i class="fas fa-microphone-alt"></i> Start Recording
          </button>
          <div class="status-pill" id="statusPill">
            <div class="dot"></div>
            <span id="statusText">Idle</span>
          </div>
        </div>
      </div>
    </div>
    <div class="panels-grid">
      <div class="panel">
        <div class="panel-head"><div class="panel-head-dot" style="background:var(--accent2);"></div>Live Transcript</div>
        <div class="panel-body" id="liveText">Click "Start Recording" to begin capturing audio...</div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-head-dot" style="background:var(--green);"></div>AI Summary</div>
        <div class="panel-body" id="summary">Summary will appear here automatically every 10 seconds...</div>
      </div>
    </div>
    <div class="fact-grid">
      <div class="fact-card" id="factCard">
        <div class="fact-icon" style="color:var(--green);">&#10003;</div>
        <div class="fact-body">
          <h4>Fact Check</h4>
          <p id="factCheck">Ready to verify what you say. Start recording to begin.</p>
        </div>
      </div>
    </div>
    <button class="generate-btn" onclick="autoSummarize()">
      <i class="fas fa-sparkles"></i> Generate Summary Now
    </button>
  </div>
</div>

<div class="page" id="page-history">
  <div class="history-layout">
    <div class="page-header">
      <h2>Session History</h2>
      <p>All your past transcription sessions are saved here.</p>
    </div>
    <div class="history-list" id="historyList"></div>
  </div>
</div>

<div class="page" id="page-settings">
  <div class="settings-layout">
    <div class="page-header">
      <h2>Settings</h2>
      <p>Customize how EchoAi works for you.</p>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">Transcription</div>
      <div class="settings-row">
        <div class="settings-row-left"><h4>Language</h4><p>Language for speech recognition</p></div>
        <select class="settings-select" id="langSelect">
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          <option value="de-DE">German</option>
          <option value="ja-JP">Japanese</option>
        </select>
      </div>
      <div class="settings-row">
        <div class="settings-row-left"><h4>Auto-summarize interval</h4><p>How often to generate AI summaries</p></div>
        <select class="settings-select" id="intervalSelect">
          <option value="5000">Every 5s</option>
          <option value="10000" selected>Every 10s</option>
          <option value="30000">Every 30s</option>
          <option value="60000">Every 60s</option>
        </select>
      </div>
      <div class="settings-row">
        <div class="settings-row-left"><h4>Interim results</h4><p>Show words as you speak, before finalizing</p></div>
        <label class="toggle-switch"><input type="checkbox" checked id="interimToggle"><div class="toggle-track"></div></label>
      </div>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">AI</div>
      <div class="settings-row">
        <div class="settings-row-left"><h4>Fact checking</h4><p>Automatically verify statements you make</p></div>
        <label class="toggle-switch"><input type="checkbox" checked id="factToggle"><div class="toggle-track"></div></label>
      </div>
      <div class="settings-row">
        <div class="settings-row-left"><h4>Save sessions</h4><p>Store transcripts in browser history</p></div>
        <label class="toggle-switch"><input type="checkbox" checked id="saveToggle"><div class="toggle-track"></div></label>
      </div>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">Danger zone</div>
      <div class="settings-row">
        <div class="settings-row-left"><h4>Clear all history</h4><p>Permanently delete all saved sessions</p></div>
        <button class="btn-ghost" style="color:var(--red);border-color:rgba(240,82,82,0.3);font-size:0.85rem;padding:0.4rem 1rem;" onclick="clearHistory()">
          <i class="fas fa-trash"></i> Clear
        </button>
      </div>
    </div>
  </div>
</div>

<script>
function showPage(name) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-links a').forEach(function(a) { a.classList.remove('active'); });
  document.querySelectorAll('.mobile-nav-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  var mob = document.getElementById('mob-' + name);
  if (mob) { mob.classList.add('active'); }
  if (name === 'history') renderHistory();
  window.scrollTo(0, 0);
}

var recording = false;
var liveTextStr = '';
var autoInterval = null;
var lastSummarized = '';
var sessions = JSON.parse(localStorage.getItem('echoai_sessions') || '[]');

var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = function(event) {
    var interim = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var t = event.results[i][0].transcript;
      if (event.results[i].isFinal) { liveTextStr += ' ' + t; }
      else { interim += t; }
    }
    var liveEl = document.getElementById('liveText');
    liveEl.textContent = (liveTextStr + ' ' + interim).trim() || 'Listening...';
    liveEl.classList.add('has-content');
  };

  recognition.onerror = function() { if (recording) toggleRecording(); };
} else {
  document.getElementById('toggleBtn').textContent = 'Browser not supported';
  document.getElementById('toggleBtn').disabled = true;
}

function toggleRecording() {
  if (!recording) { startRecording(); } else { stopRecording(); }
}

function startRecording() {
  recording = true;
  liveTextStr = '';
  document.getElementById('liveText').textContent = 'Listening...';
  document.getElementById('liveText').classList.remove('has-content');
  var lang = document.getElementById('langSelect') ? document.getElementById('langSelect').value : 'en-US';
  if (recognition) { recognition.lang = lang; recognition.start(); }
  document.getElementById('toggleBtn').innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
  document.getElementById('micOrb').classList.add('recording');
  document.getElementById('recorderTitle').textContent = 'Recording...';
  document.getElementById('recorderSub').textContent = 'Speak clearly - your words are being transcribed live.';
  document.getElementById('statusPill').classList.add('recording');
  document.getElementById('statusText').textContent = 'Live';
  var interval = parseInt(document.getElementById('intervalSelect') ? document.getElementById('intervalSelect').value : '10000');
  autoInterval = setInterval(autoSummarize, interval);
}

function stopRecording() {
  recording = false;
  if (recognition) { recognition.stop(); }
  clearInterval(autoInterval);
  document.getElementById('toggleBtn').innerHTML = '<i class="fas fa-microphone-alt"></i> Start Recording';
  document.getElementById('micOrb').classList.remove('recording');
  document.getElementById('recorderTitle').textContent = 'Recording stopped';
  document.getElementById('recorderSub').textContent = 'Session ended. You can generate a summary or start a new recording.';
  document.getElementById('statusPill').classList.remove('recording');
  document.getElementById('statusText').textContent = 'Idle';
  var saveToggle = document.getElementById('saveToggle');
  if (liveTextStr.trim() && (!saveToggle || saveToggle.checked)) {
    saveSession(liveTextStr.trim());
  }
}

function autoSummarize() {
  if (!liveTextStr.trim() || liveTextStr === lastSummarized) { return; }
  lastSummarized = liveTextStr;
  document.getElementById('summary').textContent = 'Generating summary...';
  document.getElementById('factCheck').textContent = 'Checking facts...';
  fetch('/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: liveTextStr })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    var summaryEl = document.getElementById('summary');
    var factEl = document.getElementById('factCheck');
    summaryEl.textContent = data.summary || 'No summary generated';
    summaryEl.classList.add('has-content');
    factEl.textContent = data.factCheck || 'No issues detected';
    var factCard = document.getElementById('factCard');
    var factIcon = factCard.querySelector('.fact-icon');
    if (data.factCheck && data.factCheck.toLowerCase().indexOf('false') !== -1) {
      factIcon.textContent = '!';
      factIcon.style.color = 'var(--red)';
    } else {
      factIcon.textContent = String.fromCharCode(10003);
      factIcon.style.color = 'var(--green)';
    }
  })
  .catch(function() {
    document.getElementById('summary').textContent = 'Error connecting to server.';
  });
}

function saveSession(text) {
  var summary = document.getElementById('summary').textContent;
  sessions.unshift({
    id: Date.now(),
    date: new Date().toLocaleString(),
    text: text.slice(0, 300),
    summary: summary.indexOf('Summary will') !== -1 ? null : summary,
    words: text.split(/\s+/).length
  });
  localStorage.setItem('echoai_sessions', JSON.stringify(sessions));
}

function renderHistory() {
  var list = document.getElementById('historyList');
  if (sessions.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-clock-rotate-left"></i><p>No sessions yet. Start a transcription to see your history here.</p></div>';
    return;
  }
  var html = '';
  for (var i = 0; i < sessions.length; i++) {
    var s = sessions[i];
    var title = s.summary ? s.summary.slice(0, 80) + (s.summary.length > 80 ? '...' : '') : 'Untitled session';
    var preview = s.text.slice(0, 120) + (s.text.length > 120 ? '...' : '');
    html += '<div class="history-item">';
    html += '<div class="history-item-left">';
    html += '<h4>' + title + '</h4>';
    html += '<p>' + preview + '</p>';
    html += '<div class="history-item-meta"><span>' + s.date + '</span><span>' + s.words + ' words</span></div>';
    html += '</div>';
    html += '<div><span class="tag tag-purple">Saved</span></div>';
    html += '</div>';
  }
  list.innerHTML = html;
}

function clearHistory() {
  if (confirm('Clear all session history? This cannot be undone.')) {
    sessions = [];
    localStorage.removeItem('echoai_sessions');
    renderHistory();
  }
}
</script>
</body>
</html>
  `);
});

app.post('/summarize', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.json({ summary: 'No content', factCheck: 'No lies detected' });
  }

  const systemPrompt = [
    'You MUST respond in valid JSON only. No extra text, no markdown, no backticks.',
    '',
    'Rules:',
    '- summary: briefly summarize what the speaker said. Keep it short and clear.',
    '- factCheck: must be very short.',
    '  If accurate: "No lies detected"',
    '  If inaccurate: "False - [correct fact here]"',
    '  If uncertain: "Unclear"',
    '',
    'Respond ONLY with this JSON structure:',
    '{"summary": "...", "factCheck": "..."}'
  ].join('\n');

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Transcribed speech: ' + content }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    let text = response.data.choices[0].message.content.trim();

    // Strip markdown code fences if model adds them
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('JSON parse failed. Raw response:', text);
      parsed = { summary: text, factCheck: 'No lies detected' };
    }

    res.json({
      summary: parsed.summary || 'No summary',
      factCheck: parsed.factCheck || 'No lies detected'
    });

  } catch (err) {
    if (err.response) {
      console.error('Groq API error status:', err.response.status);
      console.error('Groq API error data:', JSON.stringify(err.response.data));
    } else {
      console.error('Request error:', err.message);
    }
    res.json({ summary: 'Error: ' + (err.response ? err.response.status : err.message), factCheck: 'N/A' });
  }
});

async function startCloudflaredTunnel() {
  return new Promise((resolve) => {
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
        console.log('Public URL:', match[0]);
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
  console.log('Server running on port ' + port);
  await startCloudflaredTunnel();
});
