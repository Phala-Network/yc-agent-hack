# Vapi Assistant Configuration for Bullshit Detector

## Quick Setup

1. Go to [Vapi Dashboard](https://dashboard.vapi.ai)
2. Edit Assistant ID: `f80bdb7d-68d6-48cd-8676-f803bab629c7`
3. Configure as below:

## Assistant Settings

### Basic Configuration
```yaml
Name: Bullshit Detector Judge
Voice: ElevenLabs - Adam (assertive male) or Rachel (assertive female)
Model: GPT-4
First Message: "I'm listening to your pitch. Go ahead."
```

### System Prompt
```
You are a skeptical YC partner/judge listening to a startup pitch. 

CRITICAL INSTRUCTION: When you receive any function call result that contains text, you MUST immediately interrupt and speak that text word-for-word. Do not add anything, do not modify it, just speak exactly what the function returns.

Your behavior:
1. Listen silently to the pitch
2. Do NOT speak unless you receive a function result with text
3. When function returns text, INTERRUPT and speak it immediately
4. Sound assertive and confrontational when speaking

The function will return challenges like:
- "Hold on - which specific Fortune 500 companies? Can you name them?"
- "Stop right there - Sequoia invested? Show me the announcement."
- "Wait, 94.7% accuracy? Where's your data?"

You are simply the voice. The detection happens externally. Just speak what you're told to speak.
```

### Tool Configuration

In Vapi Dashboard, add this tool to your assistant:

#### Method 1: Using Assistant Tools Section
Add this tool configuration:

```json
{
  "type": "apiRequest",
  "function": {
    "name": "detectBullshit"
  },
  "name": "Bullshit Detector",
  "url": "http://localhost:8000/api/vapi_function",
  "method": "POST",
  "headers": {
    "type": "object",
    "properties": {
      "Authorization": {
        "type": "string",
        "value": "Bearer bullshit-detector-secret-2024"
      },
      "Content-Type": {
        "type": "string", 
        "value": "application/json"
      }
    }
  },
  "body": {
    "type": "object",
    "properties": {
      "text": {
        "description": "The user speech to analyze for bullshit",
        "type": "string"
      }
    }
  }
}
```

#### Method 2: If using Functions section
- **Name**: `detectBullshit`
- **Description**: `Analyzes user speech for bullshit claims and returns challenges to speak`
- **Server URL**: `http://localhost:8000/api/vapi_function`
- **Method**: `POST`
- **Headers**: 
```json
{
  "Authorization": "Bearer bullshit-detector-secret-2024",
  "Content-Type": "application/json"
}
```
- **Parameters Schema**:
```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "description": "Text to analyze for bullshit"
    }
  },
  "required": ["text"]
}
```

**Note**: If using localhost doesn't work, use ngrok to create a public URL:
```bash
ngrok http 8000
# Then use the https://xxxxx.ngrok.io/api/vapi_function URL
```

### Automatic Function Trigger

Configure the assistant to automatically call this function on every user message by adding this to the assistant's function calling behavior:

```yaml
Function Calling: 
  - Trigger: On every user message
  - Auto-call detectBullshit with user transcript
  - Interrupt immediately if function returns non-empty text
```

### Interruption Settings
```yaml
Interruptions: Enabled
Interruption Threshold: 100ms (very aggressive)
End Call Phrases: ["goodbye", "end demo", "stop"]
```

### Advanced Settings
```yaml
Temperature: 0.3 (consistent responses)
Max Tokens: 150 (keep responses short)
Silence Timeout: 30 seconds
Response Timeout: 5 seconds
```

## Testing the Assistant

1. Start the backend: `python app.py`
2. Open Vapi Dashboard → Your Assistant → Test Call
3. Say a bullshit claim from the script:
   - "We're working with 12 Fortune 500 companies including Goldman Sachs"
   - "Sequoia led our 8 million dollar seed round"
   
4. The assistant should:
   - Interrupt you immediately
   - Challenge the claim assertively
   - Ask for specific evidence

## Integration with UI

The UI at http://localhost:5173 uses:
- Public Key: `8bf3ee7e-bfdc-42b0-893b-a75e93ed9c40`
- Assistant ID: `f80bdb7d-68d6-48cd-8676-f803bab629c7`

When bullshit is detected:
1. Backend analyzes the claim
2. Shows detailed analysis in UI
3. Vapi assistant speaks the challenge
4. Visual alert appears

## Custom Responses

You can customize responses by claim type in the system prompt:

```
For fake partnerships: "Which companies specifically? I'll verify that right now."
For impossible metrics: "Show me the benchmark data. Those numbers sound inflated."
For fake funding: "I haven't seen that funding announcement. Can you provide proof?"
For team lies: "Let me check LinkedIn. Those credentials sound suspicious."
```

## Troubleshooting

- **Assistant too polite**: Make system prompt more aggressive
- **Not interrupting**: Lower interruption threshold
- **Missing detections**: Check backend is running at http://localhost:8000
- **No voice response**: Verify function URL is accessible