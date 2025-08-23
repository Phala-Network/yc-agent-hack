# Bullshit Detector - YC Hackathon Project

## Project Overview
Real-time fact-checking system for detecting false claims during pitches. AI meeting bot that joins Google meetings, listens to audio, transcribes in real-time, and alerts when "bullshit" is detected with both voice and visual warnings.

## Team Structure
- **Member 1 (You)**: Fact-checking script, detection logic, output system
- **Member 2**: Google Meet integration, transcript capture
- **Member 3**: Vapi.ai integration for voice feedback

## Your Components

### 1. Mock Pitch Script (`pitch_script.md`)
- Founder pitching fictional "AgentFlow" company
- Each paragraph starts with detectable false claim
- 15-20 second pauses for detector processing
- Claims about fake customers, impossible metrics, false partnerships

### 2. Detector Script (`bullshit_detector.py`)
- Flask webhook receives transcript chunks
- LLM-based fact checking against truth database
- Real-time bullshit detection with confidence scores
- Desktop notifications and console alerts
- Generates confrontational questions for TTS

### 3. Supporting Files
- `.env`: API keys (OPENAI_API_KEY, VAPI_API_KEY)
- `requirements.txt`: Python dependencies
- `facts.json`: Ground truth database
- `test_transcript.py`: Testing without Google Meet

## Key Features
- **Real-time Processing**: Analyzes transcript as it streams
- **Smart Detection**: Uses GPT-4 for nuanced fact-checking
- **Visual Alerts**: Red warning panels, desktop notifications, "BULLSHIT!" zoom-in animation
- **Voice Feedback**: Immediate "BULLSHIT! [reason]" announcement via Vapi.ai TTS
- **Confidence Scoring**: 0-100% bullshit confidence
- **Summary Report**: Final analysis of all detections
- **Meeting Bot**: Joins Google Meet as bot participant

## Demo Flow
1. Start detector script (shows "Listening...")
2. Teammate starts Google Meet transcript capture
3. Begin mock pitch with first false claim
4. ~5 seconds: "BULLSHIT!" alert appears
5. ~10 seconds: Fact-check summary displays
6. ~15 seconds: Vapi.ai asks challenging question
7. Continue through all paragraphs
8. Show final detection summary

## Detection Examples
- "40% of Fortune 500 use us" → "No customers exist"
- "$50M ARR in 6 months" → "Company has $0 revenue"
- "99.7% accuracy" → "Impossible benchmark claim"
- "OpenAI partnership" → "No such partnership exists"

## API Integration Points

### Incoming (from teammate's Google Meet integration)
```json
POST /transcript
{
  "transcript": "live text from meeting",
  "timestamp": "2024-01-15T10:30:00Z",
  "speaker": "Presenter"
}
```

### Outgoing (to Vapi.ai)
```json
{
  "text": "Can you provide evidence for your $50M ARR claim?",
  "voice": "assertive",
  "emotion": "skeptical"
}
```

## Testing Without Full Integration
```bash
# Test with mock transcript
python test_transcript.py

# Send manual transcript
curl -X POST http://localhost:5000/transcript \
  -H "Content-Type: application/json" \
  -d '{"transcript": "We have 50 million users"}'
```

## Environment Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Set API keys
export OPENAI_API_KEY="your-key"
export VAPI_API_KEY="your-key"

# Run detector
python bullshit_detector.py
```

## Troubleshooting
- **No notifications**: Install `plyer` for desktop alerts
- **No API key**: Falls back to pattern matching
- **Slow detection**: Reduce buffer size in config
- **Missing claims**: Lower confidence threshold

## Demo Tips
- Speak clearly and pause after claims
- Emphasize false statistics for easy detection
- Keep straight face during absurd claims
- Let detector fully process before continuing
- Have backup slides showing detection working

## Detailed Architecture

### Voice Agent (Vapi)
- **Web Call Integration**: Uses Vapi's Web Call feature for browser-based audio
- **Agent Logic**: Configured in Vapi dashboard with facts and false claims
- **Behavior**: Stays silent unless detecting false claims, then immediately announces "BULLSHIT! [reason]"
- **Events**: Pushes events to frontend for visual alerts

### Google Meet Integration Options

#### Option 1: Virtual Audio Driver (Preferred)
- Use BlackHole or similar virtual audio driver on Mac
- Join Google Meet with bot account
- Frontend hosts Vapi Web Call widget
- Audio routing:
  - Google Meet output → Frontend input
  - Frontend output → Google Meet input
- Share Vapi frontend tab to show visual alerts

#### Option 2: Meeting Bot SDK
- Use recall.ai's real-time audio protocol
- More complex implementation but direct API integration

### Frontend Components
- **Vapi Widget**: Web Call integration for audio processing
- **Event Listener**: Receives "BULLSHIT" triggers from Vapi agent
- **Visual Alert**: Big "BULLSHIT!" zoom-in animation on detection
- **Status Display**: Shows connection state and detection history

## Project TODOs

- [x] Write the demo script and the corresponding agent prompt
- [ ] Agent: Build the Vapi voice agent that works with the demo script
- [ ] Agent: Ensure the agent can push an event to the frontend
- [ ] Frontend: Vapi Web Call integration
- [ ] Frontend: Receive events from Vapi agent to trigger animation
- [ ] Frontend: "BULLSHIT" zoom-in animation
- [ ] Google Meet integration: test feasibility
- [ ] Connect Google Meet, frontend, and Vapi