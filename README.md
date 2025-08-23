# 🎯 YC Hackathon Bullshit Detector

Real-time AI-powered fact-checking system for detecting false claims during startup pitches. Features voice agent integration and visual alerts for live demos.
<img width="1512" height="824" alt="Screenshot 2025-08-23 at 13 56 11" src="https://github.com/user-attachments/assets/24fdc06b-1d2d-4584-8259-95d0dc9519ff" />

## 🚀 Features

- **Real-time Detection**: Analyzes speech transcripts using GPT-4o
- **Voice Agent Integration**: Vapi.ai voice assistant that challenges false claims
- **Visual Alerts**: Large bullshit alerts and detailed analysis display
- **Smart Analysis**: Detects subtle lies mixed with realistic startup metrics
- **Live Demo Ready**: Built for YC Demo Day presentations

## ⚡ Quick Start

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variable
export OPENAI_API_KEY="your-openai-key"

# Start Flask server
python app.py
# Server runs on http://localhost:8000
```

### Frontend
```bash
cd ui
npm install
npm run dev
# UI runs on http://localhost:5173
```

### Voice Agent Setup
1. Follow setup in `VAPI_ASSISTANT_CONFIG.md`
2. Update assistant ID in `VoiceCall.tsx` line 16
3. Configure function calling for backend integration

## 🏗️ Architecture

```
├── app.py                      # Flask backend with GPT-4o integration
├── realistic_pitch_script.md   # Demo script (80% realistic + 20% lies)
├── VAPI_ASSISTANT_CONFIG.md   # Voice agent setup instructions
└── ui/                        # React frontend
    ├── src/components/
    │   ├── VoiceCall.tsx      # Main component with Vapi integration
    │   ├── ConversationPanel.tsx # Chat display with bullshit alerts
    │   ├── ParticipantFrame.tsx   # Video frames with overlays
    │   └── MeetingControls.tsx    # Meeting control buttons
    └── src/types/vapi.ts      # TypeScript definitions
```

## 🎬 Demo Usage

1. **Start Servers**: Run both backend and frontend
2. **Open UI**: Navigate to http://localhost:5173
3. **Join Meeting**: Click "Join Meeting" to start voice call
4. **Run Pitch**: Read from `realistic_pitch_script.md`
5. **Watch Detection**: System detects lies and shows alerts

## 🧠 Detection Types

### Backend Detection (GPT-4o Analysis)
- Analyzes user speech for false claims
- Shows detailed bullshit analysis with confidence scores
- Triggers "💬 VC CHALLENGE" responses

### Voice Agent Detection  
- Voice agent says "bullshit" when detecting lies
- Shows "🎙️ LIVE VOICE CHALLENGE" with special formatting
- Creates enhanced analysis with 95% confidence

## 📊 Detection Examples

- "Working with 20 Fortune 500 companies" → Fake customer claims
- "94.7% accuracy, 23% better than Copilot" → Impossible benchmarks  
- "Sequoia led our $8M seed round" → False funding claims
- "Microsoft considering $200M acquisition" → Fake partnerships

## 🔧 Tech Stack

- **Backend**: Flask + OpenAI GPT-4o + Python
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Voice**: Vapi.ai voice agent with real-time audio
- **UI Components**: shadcn/ui component library

## 🔌 API Endpoints

- `POST /api/analyze` - Analyze text claims for bullshit detection
- `GET /health` - Health check endpoint

### Example Usage
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "We raised $50M from Sequoia at a $200M valuation"}'
```

Built for YC Hackathon - Real-time bullshit detection that actually works! 🚨
