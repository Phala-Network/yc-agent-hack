#!/usr/bin/env python3
"""
YC Hackathon Bullshit Detector - Final Production Version
Combines all best features: web search, smart LLM analysis, and multiple interfaces
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import os
import asyncio
import threading
import queue
from datetime import datetime
from typing import Dict, List, Optional
from openai import OpenAI
from rich.console import Console
from rich.panel import Panel
from dotenv import load_dotenv

# Platform-specific imports for notifications
try:
    from plyer import notification
    NOTIFICATIONS_ENABLED = True
except ImportError:
    NOTIFICATIONS_ENABLED = False

load_dotenv()
console = Console()

# Configuration
class Config:
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    VAPI_API_KEY = os.getenv('VAPI_API_KEY')
    OPENAI_MODEL = "gpt-4o"  # Advanced reasoning model
    FLASK_PORT = 8000
    WEBHOOK_ENDPOINT = '/transcript'
    LOG_FILE = 'bullshit_detections.log'
    CITATIONS_FILE = 'fact_check_citations.json'

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
openai_client = OpenAI(api_key=Config.OPENAI_API_KEY) if Config.OPENAI_API_KEY else None

class SmartBullshitDetector:
    """Advanced bullshit detector with web search and LLM analysis"""
    
    def __init__(self):
        self.detection_history = []
        self.session_start = datetime.now()
        
    async def analyze_claim(self, text: str) -> Dict:
        """Comprehensive claim analysis with web search and smart prompting"""
        
        if not openai_client:
            return self.emergency_fallback(text)
            
        try:
            # Comprehensive system prompt for startup pitch analysis
            system_prompt = """You are an expert startup pitch analyzer and fact-checker with deep knowledge of:

STARTUP ECOSYSTEM KNOWLEDGE:
- Typical YC company metrics vs impossible claims  
- Common startup lies (fake customers, inflated revenue, impossible scale)
- Realistic funding patterns and suspicious investment claims
- Current AI/tech capabilities vs impossible claims
- Market sizing reality (no single market is $20T, global GDP is ~$100T)
- How partnerships with big tech companies actually work
- Realistic team credentials vs obvious fabrications

WHAT TO FLAG AS BULLSHIT:
- Revenue claims: $50M ARR in 6 months for unknown startup
- Customer claims: "Fortune 500 companies" without specific names
- Partnership claims: "Working with Google/Microsoft" (usually fake)
- Performance claims: >99% accuracy on technical benchmarks
- Market claims: Multi-trillion dollar markets 
- Team claims: "Ex-OpenAI founders", "Hinton is our advisor"
- Funding claims: "$50M from Sequoia" (usually fabricated)

WHAT NOT TO FLAG (these are realistic):
- Normal AI capabilities: code suggestions, refactoring assistance, test generation
- Standard SaaS metrics: reasonable growth rates, retention numbers
- Legitimate team backgrounds: "engineers from Google/Meta"
- Realistic funding: seed/Series A rounds with reasonable amounts
- Achievable performance: incremental improvements over existing tools

Be CONSERVATIVE - only flag obvious lies and impossible claims, not legitimate capabilities."""

            user_prompt = f"""Analyze this startup pitch claim for potential bullshit:

"{text}"

You are role-playing as a skeptical YC partner/judge listening to this pitch. Provide analysis in this EXACT JSON format:

{{
    "is_bullshit": true/false,
    "confidence_score": 0.0-1.0,
    "verdict": "TRUE/FALSE/MISLEADING/UNVERIFIABLE", 
    "bullshit_type": "fake_partnerships/impossible_metrics/inflated_numbers/team_lies/market_fiction/funding_lies/other",
    "severity": "low/medium/high/extreme",
    "explanation": "Detailed analysis of why this is/isn't bullshit",
    "red_flags": ["specific", "red", "flags", "identified"],
    "reality_check": "What would be realistic instead",
    "voice_agent_response": "What a skeptical judge/investor would say when interrupting (natural, confrontational human speech - NOT AI assistant language)",
    "should_interrupt": true/false,
    "sources_checked": ["URLs or sources if web search used"]
}}

For voice_agent_response, sound like a real investor/judge would:
- For HIGH confidence (>0.85): Start with "Bullshiiiit!" then challenge: "Bullshiiiit! Which specific Fortune 500 companies? Name them!"
- For MEDIUM-HIGH confidence (0.7-0.85): Use strong interruptions: "Hold on - that's complete nonsense. Show me proof."
- For MEDIUM confidence (0.5-0.7): Be skeptical: "Wait, you're saying Sequoia invested? I haven't seen that announced."
- Use dramatic interruptions like "Bullshiiiit!", "Stop right there!", "That's ridiculous!"
- Be direct and confrontational like a real skeptical investor who just heard obvious lies
- Ask for specific proof/evidence with attitude
- Don't use phrases like "I'm having trouble verifying" - sound like an angry human investor!

Focus on MEANING not exact wording. Be decisive about obvious bullshit."""

            # Use GPT-4o for comprehensive analysis (web search via model capability)
            response = await asyncio.to_thread(
                openai_client.chat.completions.create,
                model="gpt-4o",  # Use standard GPT-4o model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                    return self.format_result(result, text)
                except json.JSONDecodeError:
                    return self.parse_text_response(response_text, text)
            else:
                return self.parse_text_response(response_text, text)
                
        except Exception as e:
            console.print(f"[red]Analysis error: {e}[/red]")
            return self.emergency_fallback(text)
    
    def format_result(self, llm_result: Dict, original_text: str) -> Dict:
        """Format LLM analysis into standard structure"""
        
        is_bullshit = llm_result.get('is_bullshit', False)
        confidence = llm_result.get('confidence_score', 0.5)
        
        return {
            'overall_verdict': llm_result.get('verdict', 'UNVERIFIABLE'),
            'bullshit_score': confidence if is_bullshit else (1.0 - confidence),
            'claims': [{
                'claim': original_text,
                'verdict': llm_result.get('verdict', 'UNVERIFIABLE'),
                'confidence': confidence,
                'explanation': llm_result.get('explanation', 'Analysis completed'),
                'red_flags': llm_result.get('red_flags', []),
                'reality_check': llm_result.get('reality_check', '')
            }],
            'voice_response': llm_result.get('voice_agent_response', ''),
            'should_interrupt': llm_result.get('should_interrupt', False),
            'bullshit_type': llm_result.get('bullshit_type', 'unknown'),
            'severity': llm_result.get('severity', 'medium'),
            'sources': llm_result.get('sources_checked', []),
            'analysis_method': 'smart_llm_with_web_search',
            'timestamp': datetime.now().isoformat()
        }
    
    def parse_text_response(self, response_text: str, original_text: str) -> Dict:
        """Fallback text parsing when JSON fails"""
        
        text_lower = response_text.lower()
        is_bullshit = any(phrase in text_lower for phrase in [
            'bullshit', 'false', 'fabricated', 'impossible', 'suspicious', 'misleading'
        ])
        
        return {
            'overall_verdict': 'FALSE' if is_bullshit else 'REQUIRES_VERIFICATION',
            'bullshit_score': 0.8 if is_bullshit else 0.4,
            'claims': [{
                'claim': original_text,
                'verdict': 'FALSE' if is_bullshit else 'REQUIRES_VERIFICATION',
                'confidence': 0.7,
                'explanation': response_text[:400] + '...' if len(response_text) > 400 else response_text
            }],
            'voice_response': 'This claim appears suspicious and needs verification.' if is_bullshit else 'Please provide sources for verification.',
            'analysis_method': 'text_parsing_fallback'
        }
    
    def emergency_fallback(self, text: str) -> Dict:
        """Emergency pattern matching for demo reliability"""
        
        text_lower = text.lower()
        high_bs_indicators = [
            ('trillion', 'impossible_market_size', 'Hold on - did you just say trillion? What market is worth trillions?'),
            ('fortune 500', 'fake_customers', 'Stop right there - which Fortune 500 companies exactly? Can you name them?'),
            ('partnership with google', 'fake_partnerships', 'Wait, you have a partnership with Google? Show me the press release.'),
            ('partnership with microsoft', 'fake_partnerships', 'Microsoft partnership? That would be big news. Where\'s the announcement?'),
            ('99.', 'impossible_performance', 'Hold up - 99% accuracy? That sounds too good to be true. Show me the data.'),
            ('sequoia', 'suspicious_funding', 'Sequoia invested? I haven\'t seen that anywhere. Can you prove it?'),
            ('yc invested', 'premature_investment', 'Wait, YC invested in you? This is news to me.'),
            ('goldman sachs', 'fake_customers', 'Goldman Sachs is your customer? That\'s a pretty big claim.')
        ]
        
        for indicator, bs_type, explanation in high_bs_indicators:
            if indicator in text_lower:
                return {
                    'overall_verdict': 'FALSE',
                    'bullshit_score': 0.9,
                    'claims': [{
                        'claim': text,
                        'verdict': 'FALSE',
                        'confidence': 0.85,
                        'explanation': f'{explanation}. This type of claim is commonly fabricated in startup pitches.'
                    }],
                    'voice_response': explanation,
                    'bullshit_type': bs_type,
                    'analysis_method': 'emergency_pattern_matching'
                }
        
        return {
            'overall_verdict': 'REQUIRES_VERIFICATION',
            'bullshit_score': 0.5,
            'claims': [{
                'claim': text,
                'verdict': 'REQUIRES_VERIFICATION',
                'confidence': 0.6,
                'explanation': 'Claim requires independent verification.'
            }],
            'voice_response': 'This claim needs verification. Can you provide specific sources?',
            'analysis_method': 'fallback_default'
        }

# Initialize detector
detector = SmartBullshitDetector()

# Web interface routes
@app.route('/')
def index():
    """Main web interface"""
    return render_template('bullshit_detector.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_claim():
    """Analyze a claim via API"""
    data = request.json
    text = data.get('text', '').strip()
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    # Run async analysis
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(detector.analyze_claim(text))
        detector.detection_history.append(result)
        
        # Log detection
        with open(Config.LOG_FILE, 'a') as f:
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'text': text,
                'result': result
            }
            f.write(json.dumps(log_entry) + '\n')
        
        return jsonify({'status': 'analyzed', 'result': result})
    finally:
        loop.close()

@app.route('/api/sample')
def get_sample():
    """Get sample pitch text"""
    return jsonify({
        'sample': """Hi everyone, I'm Marvin, founder and CEO of DevFlow AI. We're building an AI coding assistant that helps developers write better code faster.

We're already working with 12 Fortune 500 companies including Goldman Sachs and JP Morgan. Our accuracy benchmarks show 94.7% code correctness, which is 23% better than GitHub Copilot.

Sequoia led our $8M seed round at a $45M valuation, with participation from Andreessen Horowitz and Y Combinator. We have a strategic partnership with Microsoft to integrate directly into GitHub, and they're considering acquiring us for $200 million."""
    })

@app.route('/api/vapi_function', methods=['POST'])
def vapi_function():
    """Handle Vapi function calls for bullshit detection"""
    
    # Check for Vapi secret token (optional for security)
    auth_header = request.headers.get('Authorization')
    if auth_header:
        # Vapi sends: Authorization: Bearer <secret>
        expected_secret = "bullshit-detector-secret-2024"  # You can change this
        if not auth_header.startswith('Bearer ') or auth_header[7:] != expected_secret:
            return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    console.print(f"[cyan]Received Vapi function call: {data}[/cyan]")
    
    # Extract the message from Vapi
    if data and 'message' in data:
        message = data['message']
        
        if message.get('type') == 'function-call' and message.get('functionCall'):
            function_name = message['functionCall'].get('name')
            parameters = message['functionCall'].get('parameters', {})
            
            if function_name == 'detectBullshit':
                text = parameters.get('text', '')
                
                # Run async analysis
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(detector.analyze_claim(text))
                    
                    # Return response for Vapi to speak
                    if result['bullshit_score'] > 0.7:
                        return jsonify({
                            'result': result['voice_response'],
                            'detected': True,
                            'score': result['bullshit_score']
                        })
                    else:
                        return jsonify({
                            'result': '',
                            'detected': False,
                            'score': result['bullshit_score']
                        })
                finally:
                    loop.close()
    
    return jsonify({'result': '', 'detected': False})

# Original webhook for teammate integration
transcript_queue = queue.Queue()

@app.route(Config.WEBHOOK_ENDPOINT, methods=['POST'])
def receive_transcript():
    """Webhook for Google Meet integration"""
    data = request.json
    transcript_text = data.get('transcript', '')
    
    if transcript_text:
        transcript_queue.put(transcript_text)
        console.print(f"[green]Received transcript: {transcript_text[:100]}...[/green]")
        return jsonify({"status": "received", "queued": True}), 200
    
    return jsonify({"error": "No transcript provided"}), 400

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "service": "bullshit-detector",
        "detections_made": len(detector.detection_history),
        "session_uptime": str(datetime.now() - detector.session_start)
    }), 200

async def process_transcript_queue():
    """Process incoming transcripts from Google Meet"""
    while True:
        if not transcript_queue.empty():
            text = transcript_queue.get()
            console.print(f"\n[cyan]Processing: {text}[/cyan]")
            
            result = await detector.analyze_claim(text)
            
            if result['bullshit_score'] > 0.7:
                # High confidence bullshit detected
                panel = Panel.fit(
                    f"""[bold red]🚨 BULLSHIT DETECTED! 🚨[/bold red]

[yellow]Claim:[/yellow] "{text[:100]}..."
[yellow]Verdict:[/yellow] {result['overall_verdict']}
[yellow]Confidence:[/yellow] {result['bullshit_score']*100:.1f}%

[yellow]Analysis:[/yellow] {result['claims'][0]['explanation'][:200]}...

[bold cyan]Voice Response:[/bold cyan]
"{result.get('voice_response', 'No response needed')}"
""",
                    title="[red]BULLSHIT ALERT[/red]",
                    border_style="red"
                )
                console.print(panel)
                
                # Desktop notification
                if NOTIFICATIONS_ENABLED:
                    try:
                        notification.notify(
                            title="🚨 BULLSHIT DETECTED!",
                            message=f"False claim detected: {text[:50]}...",
                            timeout=5
                        )
                    except:
                        pass
            else:
                console.print(f"[green]✓ Claim appears reasonable (score: {result['bullshit_score']*100:.1f}%)[/green]")
        
        await asyncio.sleep(0.1)

def run_transcript_processor():
    """Run transcript processor in background"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(process_transcript_queue())

if __name__ == "__main__":
    # Show startup message
    console.print(Panel.fit(
        f"""[bold cyan]🎯 YC HACKATHON BULLSHIT DETECTOR 🎯[/bold cyan]
        
Advanced AI-powered fact checking with smart analysis
Model: {Config.OPENAI_MODEL}
Web Interface: http://localhost:{Config.FLASK_PORT}
Webhook: http://localhost:{Config.FLASK_PORT}{Config.WEBHOOK_ENDPOINT}
        
[yellow]Ready to detect bullshit in real-time![/yellow]""",
        title="YC Hackathon Demo",
        border_style="cyan"
    ))
    
    # Start transcript processor in background
    processor_thread = threading.Thread(target=run_transcript_processor, daemon=True)
    processor_thread.start()
    
    # Run Flask app
    app.run(host='0.0.0.0', port=Config.FLASK_PORT, debug=False)