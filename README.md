# 🎯 YC Hackathon Bullshit Detector

> **AI-powered real-time fact-checking system for startup pitches**

Detect false claims, impossible metrics, and fake partnerships in startup pitches using advanced LLM analysis with web search verification.

## 🚀 Quick Start

1. **Clone and Setup**
   ```bash
   git clone https://github.com/Phala-Network/yc-agent-hack.git
   cd yc-agent-hack
   pip install -r requirements.txt
   ```

2. **Configure API Keys**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add your OpenAI API key to .env
   OPENAI_API_KEY=your-key-here
   VAPI_API_KEY=your-vapi-key-here  # Optional
   ```

3. **Run the Detector**
   ```bash
   python app.py
   ```

4. **Open Web Interface**
   - Visit: http://localhost:5000
   - Try sample pitch claims
   - See real-time bullshit detection!

## 🎭 Demo Script

Use the included `realistic_pitch_script.md` for your YC hackathon demo:
- 80% realistic YC-style pitch content
- 20% subtle but detectable lies
- Perfect for showing real-world utility

## 🧠 How It Works

### Smart Detection Engine
- **LLM Analysis**: Uses GPT-4o with comprehensive startup knowledge
- **Web Search**: Verifies claims against real-time web data  
- **Pattern Recognition**: Identifies common startup lies
- **Confidence Scoring**: Provides 0-100% bullshit probability

### Detection Categories
- 🏢 **Fake Partnerships**: "We work with Google/Microsoft"
- 💰 **Impossible Funding**: "$50M seed round from Sequoia"
- 📊 **Inflated Metrics**: "99.7% accuracy on benchmarks"
- 🌍 **Market Fiction**: "$20 trillion market size"
- 👥 **Team Lies**: "Ex-Google founders, Hinton advisor"
- 🎯 **Premature Claims**: "YC is investing in us"

## 🎤 Voice Agent Integration

Perfect for Vapi.ai integration:

```json
{
  "event": "bullshit_detected",
  "interrupt": true,
  "speech": {
    "text": "BULLSHIT! Your revenue claims are impossible to verify.",
    "tone": "assertive", 
    "emotion": "skeptical"
  }
}
```

## 🔌 API Endpoints

### Web Interface
- `GET /` - Main detection interface
- `POST /api/analyze` - Analyze text claims
- `GET /api/sample` - Get sample pitch text

### Google Meet Integration  
- `POST /transcript` - Receive live transcript
- `GET /health` - Health check

### Webhook Usage
```bash
curl -X POST http://localhost:5000/transcript \
  -H "Content-Type: application/json" \
  -d '{"transcript": "We raised $50M from Sequoia"}'
```

## 📁 Project Structure

```
bullshit-detector/
├── app.py                          # Main application
├── requirements.txt                # Python dependencies  
├── .env.example                    # Environment template
├── realistic_pitch_script.md       # Demo script (80% real + 20% BS)
├── bullshit_detector.py           # Original detector (web search)
├── test_web_search.py             # Testing utilities
├── templates/
│   └── bullshit_detector.html     # Web interface
└── docs/
    ├── PITCH_GUIDELINES.md         # How to create realistic pitches
    └── API_DOCS.md                # Complete API documentation
```

## 🎯 Detection Examples

### ✅ **Catches These Lies**
```
❌ "We're working with 12 Fortune 500 companies including Goldman Sachs"
❌ "Sequoia led our $8M seed at $45M valuation"  
❌ "94.7% accuracy, 23% better than GitHub Copilot"
❌ "Microsoft is considering acquiring us for $200M"
❌ "Andrej Karpathy is our technical advisor"
```

### ✅ **Allows These Truths**
```  
✅ "We're a 4-month-old AI coding assistant"
✅ "The developer tools market is $24B annually"
✅ "We have 8,000 developers using our beta"
✅ "We're raising a $25M Series A"
✅ "Our team includes engineers from Google and Stripe"
```

## 🏗️ Architecture

### Components
1. **Smart Detector** (`app.py`)
   - Advanced LLM prompting with startup knowledge
   - Web search integration for fact verification
   - Real-time transcript processing
   - Voice agent response generation

2. **Web Interface** (`templates/bullshit_detector.html`)
   - Interactive claim testing
   - Real-time analysis results
   - Voice response generation
   - Copy-to-clipboard functionality

3. **Integration Layer**
   - Google Meet webhook endpoint
   - Vapi.ai response formatting
   - Desktop notifications
   - Session logging

### Technology Stack
- **Backend**: Python Flask
- **AI**: OpenAI GPT-4o with web search
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Integration**: REST APIs, Webhooks
- **Deployment**: Single-file application

## 🤝 Team Integration

Perfect for YC hackathon team collaboration:

**Your Component**: Bullshit detection engine
- ✅ Smart LLM analysis with web search
- ✅ Real-time transcript processing  
- ✅ Voice response generation
- ✅ Web interface for testing

**Teammate Components**:
- **Google Meet Integration**: Send transcripts to `/transcript` endpoint
- **Vapi.ai Voice Agent**: Use generated responses for TTS
- **Frontend Animation**: Trigger "BULLSHIT!" animations on detection

## 📊 Demo Flow

1. **Setup** (30 seconds)
   - Start detector: `python app.py`
   - Open web interface: `http://localhost:5000`
   - Show health status

2. **Live Detection** (2 minutes)
   - Use `realistic_pitch_script.md`
   - Speak naturally (speech-to-text variations handled)
   - Watch real-time detection alerts
   - Show voice agent responses

3. **Results** (30 seconds)
   - Display detection summary
   - Show confidence scores
   - Highlight caught lies vs. accepted truths

## 🔧 Configuration

### Environment Variables
```bash
OPENAI_API_KEY=sk-...           # Required for LLM analysis
VAPI_API_KEY=vapi_...           # Optional for voice integration
FLASK_PORT=5000                 # Web server port (default: 5000)
LOG_LEVEL=INFO                  # Logging level
```

### Detection Thresholds
```python
# In app.py Config class
BULLSHIT_THRESHOLD = 0.7        # Confidence threshold for alerts
WEB_SEARCH_CONTEXT = "medium"   # Web search depth
NOTIFICATION_ENABLED = True     # Desktop notifications
```

## 🐛 Troubleshooting

### Common Issues
- **API Key Error**: Check `.env` file has valid `OPENAI_API_KEY`
- **Port Conflicts**: Change `FLASK_PORT` in `.env`
- **Slow Detection**: Reduce web search context size
- **No Notifications**: Install `plyer` package

### Debug Mode
```bash
# Run with debug logging
export LOG_LEVEL=DEBUG
python app.py
```

### Health Check
```bash
curl http://localhost:5000/health
# Should return: {"status": "healthy", "service": "bullshit-detector"}
```

## 🎓 Educational Value

This project demonstrates:
- **AI Ethics**: Detecting misinformation and false claims
- **Real-world AI**: Practical application of LLMs for fact-checking  
- **System Integration**: Combining multiple AI services seamlessly
- **User Experience**: Making complex AI accessible through clean interfaces
- **Startup Reality**: Understanding common lies in the startup ecosystem

## 📜 License

MIT License - feel free to use for your YC hackathon or any other project!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built for YC Hackathon 2024** 🚀

*Detect bullshit. Build better companies. Make the startup world more honest.*