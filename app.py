#!/usr/bin/env python3
"""
YC Hackathon Bullshit Detector - Final Production Version
Combines all best features: web search, smart LLM analysis, and multiple interfaces
"""

from flask import Flask, render_template, request, jsonify
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
    OPENAI_MODEL = "gpt-4o-search-preview"  # Web search enabled
    FLASK_PORT = 5000
    WEBHOOK_ENDPOINT = '/transcript'
    LOG_FILE = 'bullshit_detections.log'
    CITATIONS_FILE = 'fact_check_citations.json'

app = Flask(__name__)
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
- Technology limitations and achievable performance benchmarks
- Market sizing reality (no single market is $20T, global GDP is ~$100T)
- How partnerships with big tech companies actually work
- Realistic team credentials vs obvious fabrications

DETECTION EXPERTISE:
- Revenue claims: $50M ARR in 6 months for unknown startup = suspicious
- Customer claims: "Fortune 500 companies" without names = red flag  
- Partnership claims: "Working with Google/Microsoft" usually false
- Performance claims: >99% accuracy on benchmarks = likely impossible
- Market claims: Multi-trillion dollar markets = grossly inflated
- Team claims: "Ex-Google founders" = verify carefully
- Funding claims: Massive rounds from top VCs = often fabricated

Your job is to detect bullshit with high accuracy while being fair to legitimate claims."""

            user_prompt = f"""Analyze this startup pitch claim for potential bullshit:

"{text}"

Use web search to verify facts where possible. Provide analysis in this EXACT JSON format:

{{
    "is_bullshit": true/false,
    "confidence_score": 0.0-1.0,
    "verdict": "TRUE/FALSE/MISLEADING/UNVERIFIABLE", 
    "bullshit_type": "fake_partnerships/impossible_metrics/inflated_numbers/team_lies/market_fiction/funding_lies/other",
    "severity": "low/medium/high/extreme",
    "explanation": "Detailed analysis of why this is/isn't bullshit",
    "red_flags": ["specific", "red", "flags", "identified"],
    "reality_check": "What would be realistic instead",
    "voice_agent_response": "What voice agent should say (empty if not bullshit)",
    "should_interrupt": true/false,
    "sources_checked": ["URLs or sources if web search used"]
}}

Be decisive - if it sounds like typical startup bullshit, call it out strongly. Focus on MEANING not exact wording."""

            # Use web search model for comprehensive analysis
            response = await asyncio.to_thread(
                openai_client.chat.completions.create,
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                web_search_options={"search_context_size": "medium"},
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
            ('trillion', 'impossible_market_size', 'No single market is worth trillions'),
            ('fortune 500', 'fake_customers', 'Fortune 500 claims need verification'),
            ('partnership with google', 'fake_partnerships', 'Google partnerships are rarely real'),
            ('partnership with microsoft', 'fake_partnerships', 'Microsoft partnerships need proof'),
            ('99.', 'impossible_performance', 'Performance claims exceed realistic limits'),
            ('$', 'suspicious_funding', 'Financial claims need verification'),
            ('yc invested', 'premature_investment', 'Investment claims are premature'),
            ('series a', 'funding_claims', 'Funding rounds need verification')
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
                    'voice_response': f'BULLSHIT! {explanation}. Can you provide concrete evidence?',
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
        
Advanced AI-powered fact checking with web search
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