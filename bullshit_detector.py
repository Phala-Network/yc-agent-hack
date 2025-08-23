#!/usr/bin/env python3
"""
Bullshit Detector - Real-time fact checking for pitches
Uses OpenAI Web Search API for real-time verification
"""

import json
import time
import asyncio
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import threading
import queue

# Third-party imports
from flask import Flask, request, jsonify
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich.live import Live
from rich.layout import Layout
from rich.text import Text
from openai import OpenAI
from dotenv import load_dotenv

# Platform-specific imports for notifications
try:
    from plyer import notification
    NOTIFICATIONS_ENABLED = True
except ImportError:
    NOTIFICATIONS_ENABLED = False
    print("Warning: Install 'plyer' for desktop notifications")

load_dotenv()

# Initialize Rich console for beautiful terminal output
console = Console()

# Configuration
class Config:
    # API Settings
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_SEARCH_MODEL = "gpt-4o-search-preview"  # Web search enabled model
    OPENAI_FALLBACK_MODEL = "gpt-4o-mini"  # Fallback without search
    
    # Detection Settings
    BULLSHIT_THRESHOLD = 0.7  # Confidence threshold for BS detection (0-1)
    BUFFER_SIZE = 300  # Characters to buffer before processing
    PROCESSING_DELAY = 2  # Seconds to wait for complete sentences
    SEARCH_CONTEXT_SIZE = "medium"  # low, medium, or high
    
    # Server Settings
    FLASK_PORT = 5000
    WEBHOOK_ENDPOINT = '/transcript'
    
    # Output Settings
    ENABLE_SOUND = True
    ENABLE_NOTIFICATIONS = NOTIFICATIONS_ENABLED
    LOG_FILE = 'bullshit_detections.log'
    CITATIONS_FILE = 'fact_check_citations.json'

# Flask app for receiving transcripts
app = Flask(__name__)

class WebSearchFactChecker:
    """Enhanced fact-checker using OpenAI web search"""
    
    def __init__(self):
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY) if Config.OPENAI_API_KEY else None
        self.citations_history = []
        
    async def check_claim_with_search(self, claim: str, context: str = "") -> Dict:
        """Check a claim using web search for real-time verification"""
        if not self.client:
            return self.fallback_check(claim)
        
        try:
            # Prepare the fact-checking prompt
            messages = [
                {
                    "role": "system",
                    "content": """You are a real-time fact-checker for startup pitch claims. 
Your job is to verify claims using web search and identify false or exaggerated statements.
Focus on verifying: company existence, revenue claims, customer claims, technology benchmarks, partnerships, and team credentials.
Be skeptical of extraordinary claims that lack evidence."""
                },
                {
                    "role": "user", 
                    "content": f"""Fact-check this claim from a startup pitch:

CLAIM: "{claim}"
{f'CONTEXT: {context}' if context else ''}

Please search for and verify:
1. Does the company/product mentioned actually exist?
2. Are the specific metrics/numbers accurate?
3. Are customer/partnership claims verifiable?
4. Are technology claims realistic?

Return a JSON response with:
{{
    "claim": "the original claim",
    "verdict": "TRUE/FALSE/UNVERIFIABLE/MISLEADING",
    "confidence": 0.0-1.0,
    "evidence_found": ["list of evidence"],
    "contradictions": ["list of contradictions found"],
    "explanation": "detailed explanation",
    "sources": ["URLs that were checked"],
    "bullshit_score": 0.0-1.0,
    "challenge_question": "question to ask if bullshit detected"
}}"""
                }
            ]
            
            # Make the API call with web search
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=Config.OPENAI_SEARCH_MODEL,
                messages=messages,
                web_search_options={
                    "search_context_size": Config.SEARCH_CONTEXT_SIZE
                },
                temperature=0.1,
                max_tokens=1000
            )
            
            # Extract the response and citations
            result_text = response.choices[0].message.content
            
            # Parse citations if available
            citations = []
            if hasattr(response.choices[0].message, 'annotations'):
                for annotation in response.choices[0].message.annotations:
                    if annotation.type == 'url_citation':
                        citations.append({
                            'url': annotation.url_citation.url,
                            'title': annotation.url_citation.title,
                            'used_at': result_text[annotation.url_citation.start_index:annotation.url_citation.end_index]
                        })
            
            # Parse the JSON response
            try:
                result = json.loads(result_text)
                result['citations'] = citations
                self.citations_history.append({
                    'timestamp': datetime.now().isoformat(),
                    'claim': claim,
                    'citations': citations
                })
                return result
            except json.JSONDecodeError:
                # If response isn't proper JSON, extract key information
                return self.parse_unstructured_response(result_text, citations)
                
        except Exception as e:
            console.print(f"[red]Error with web search: {e}[/red]")
            return self.fallback_check(claim)
    
    def parse_unstructured_response(self, text: str, citations: List) -> Dict:
        """Parse unstructured response into expected format"""
        text_lower = text.lower()
        
        # Detect verdict keywords
        verdict = "UNVERIFIABLE"
        if "false" in text_lower or "incorrect" in text_lower or "no evidence" in text_lower:
            verdict = "FALSE"
        elif "true" in text_lower or "correct" in text_lower or "verified" in text_lower:
            verdict = "TRUE"
        elif "misleading" in text_lower or "exaggerated" in text_lower:
            verdict = "MISLEADING"
        
        # Calculate bullshit score based on verdict
        bullshit_scores = {
            "FALSE": 0.95,
            "MISLEADING": 0.75,
            "UNVERIFIABLE": 0.5,
            "TRUE": 0.1
        }
        
        return {
            "verdict": verdict,
            "confidence": 0.8,
            "explanation": text[:500],
            "sources": [c['url'] for c in citations],
            "bullshit_score": bullshit_scores[verdict],
            "challenge_question": "Can you provide specific evidence for this claim?",
            "citations": citations
        }
    
    def fallback_check(self, claim: str) -> Dict:
        """Fallback checking without web search"""
        claim_lower = claim.lower()
        
        # Pattern-based detection for common BS
        patterns = {
            r"\d+% of fortune 500": ("Fortune 500 claim", 0.9),
            r"\$\d+[MB] (ARR|revenue)": ("Revenue claim", 0.8),
            r"99\.\d+%": ("Suspiciously high percentage", 0.85),
            r"partnership with (google|microsoft|openai|amazon)": ("Big tech partnership", 0.9),
            r"\d+ million users": ("User count claim", 0.7),
            r"patented|proprietary": ("IP claim", 0.6),
        }
        
        import re
        for pattern, (claim_type, bs_score) in patterns.items():
            if re.search(pattern, claim_lower):
                return {
                    "verdict": "UNVERIFIABLE",
                    "confidence": 0.7,
                    "explanation": f"Detected {claim_type} - requires verification",
                    "bullshit_score": bs_score,
                    "challenge_question": f"Can you provide third-party verification for your {claim_type}?",
                    "sources": [],
                    "citations": []
                }
        
        return {
            "verdict": "UNVERIFIABLE",
            "confidence": 0.5,
            "explanation": "Unable to verify without web search",
            "bullshit_score": 0.3,
            "challenge_question": "Can you elaborate on this claim?",
            "sources": [],
            "citations": []
        }
    
    def save_citations(self):
        """Save all citations to file for reference"""
        with open(Config.CITATIONS_FILE, 'w') as f:
            json.dump(self.citations_history, f, indent=2)

class BullshitDetector:
    """Main detector class with web search integration"""
    
    def __init__(self):
        self.console = console
        self.fact_checker = WebSearchFactChecker()
        self.transcript_buffer = ""
        self.detection_history = []
        self.current_claims = []
        self.detection_count = 0
        self.is_processing = False
        self.session_start = datetime.now()
        
    def extract_claims_from_text(self, text: str) -> List[str]:
        """Extract individual claims from transcript text"""
        # Split into sentences and filter for claim-like statements
        import re
        sentences = re.split(r'[.!?]+', text)
        
        claims = []
        claim_indicators = [
            'we have', 'we are', 'we\'ve', 'our',
            'achieved', 'reached', 'secured', 'partnered',
            'revenue', 'customers', 'users', 'accuracy',
            'faster than', 'better than', 'more than',
            '%', '$', 'million', 'billion'
        ]
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20:  # Skip very short sentences
                sentence_lower = sentence.lower()
                if any(indicator in sentence_lower for indicator in claim_indicators):
                    claims.append(sentence)
        
        return claims
    
    async def process_transcript_chunk(self, chunk: str):
        """Process incoming transcript chunk"""
        self.transcript_buffer += chunk
        
        # Extract claims when buffer is large enough
        if len(self.transcript_buffer) > Config.BUFFER_SIZE:
            self.console.print(f"\n[dim]Processing: {self.transcript_buffer[:100]}...[/dim]\n")
            
            # Extract individual claims
            claims = self.extract_claims_from_text(self.transcript_buffer)
            
            if claims:
                # Create a progress bar for checking claims
                with Progress(
                    SpinnerColumn(),
                    TextColumn("[progress.description]{task.description}"),
                    console=self.console
                ) as progress:
                    task = progress.add_task(f"[cyan]Fact-checking {len(claims)} claims...", total=len(claims))
                    
                    # Check each claim
                    for claim in claims:
                        result = await self.fact_checker.check_claim_with_search(
                            claim, 
                            context=self.transcript_buffer[:200]
                        )
                        
                        # Process result
                        if result['bullshit_score'] > Config.BULLSHIT_THRESHOLD:
                            await self.show_bullshit_alert(claim, result)
                        elif result['verdict'] == "TRUE":
                            self.console.print(f"[green]✓ Verified: {claim[:60]}...[/green]")
                        else:
                            self.console.print(f"[yellow]? Unverifiable: {claim[:60]}...[/yellow]")
                        
                        progress.advance(task)
                        self.detection_history.append(result)
            
            # Clear buffer
            self.transcript_buffer = ""
    
    async def show_bullshit_alert(self, claim: str, detection: Dict):
        """Display enhanced bullshit detection alert with citations"""
        self.detection_count += 1
        
        # Build citation list
        citation_text = ""
        if detection.get('citations'):
            citation_text = "\n[dim]Sources checked:[/dim]\n"
            for cite in detection['citations'][:3]:  # Show top 3 citations
                citation_text += f"  • {cite['title'][:50]}...\n    {cite['url'][:60]}...\n"
        
        # Console output with color and formatting
        panel = Panel.fit(
            f"""[bold red]🚨 BULLSHIT DETECTED! 🚨[/bold red]
            
[yellow]Claim:[/yellow] "{claim[:100]}..."
[yellow]Verdict:[/yellow] [red]{detection.get('verdict', 'FALSE')}[/red]
[yellow]Confidence:[/yellow] {detection.get('confidence', 0.8)*100:.1f}%
[yellow]Bullshit Score:[/yellow] {detection.get('bullshit_score', 0.9)*100:.1f}%

[yellow]Analysis:[/yellow] 
{detection.get('explanation', 'This claim appears to be false or misleading.')}

{citation_text}

[bold cyan]Challenge Question:[/bold cyan]
"{detection.get('challenge_question', 'Can you provide evidence for this claim?')}"
""",
            title=f"[red]Detection #{self.detection_count}[/red]",
            border_style="red"
        )
        self.console.print(panel)
        
        # Desktop notification
        if Config.ENABLE_NOTIFICATIONS:
            try:
                notification.notify(
                    title="🚨 BULLSHIT DETECTED!",
                    message=f"False claim: {claim[:50]}...",
                    timeout=5
                )
            except:
                pass
        
        # Log detection with citations
        self.log_detection(claim, detection)
        
        # Send to Vapi.ai
        await self.send_to_vapi(detection)
    
    def log_detection(self, claim: str, detection: Dict):
        """Log detection to file with citations"""
        with open(Config.LOG_FILE, 'a') as f:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "detection_number": self.detection_count,
                "claim": claim,
                "detection": detection
            }
            f.write(json.dumps(log_entry) + "\n")
    
    async def send_to_vapi(self, detection: Dict):
        """Send to Vapi.ai for voice output"""
        vapi_payload = {
            "event": "bullshit_detected",
            "text": f"BULLSHIT! {detection.get('explanation', '')[:100]}",
            "question": detection.get('challenge_question', ''),
            "confidence": detection.get('bullshit_score', 0.9)
        }
        self.console.print(f"[cyan]→ Triggering Vapi.ai voice response[/cyan]")
        # TODO: Actual Vapi.ai webhook/API call
    
    def show_summary(self):
        """Show session summary with citation report"""
        # Save all citations
        self.fact_checker.save_citations()
        
        # Calculate statistics
        total_claims = len(self.detection_history)
        bullshit_claims = sum(1 for d in self.detection_history if d.get('bullshit_score', 0) > Config.BULLSHIT_THRESHOLD)
        verified_claims = sum(1 for d in self.detection_history if d.get('verdict') == 'TRUE')
        
        # Create summary table
        table = Table(title="Fact-Checking Session Summary", show_header=True)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="yellow")
        
        table.add_row("Session Duration", f"{(datetime.now() - self.session_start).seconds} seconds")
        table.add_row("Total Claims Checked", str(total_claims))
        table.add_row("Bullshit Detected", f"{bullshit_claims} ({bullshit_claims/max(total_claims,1)*100:.1f}%)")
        table.add_row("Verified as True", f"{verified_claims} ({verified_claims/max(total_claims,1)*100:.1f}%)")
        table.add_row("Web Searches Performed", str(len(self.fact_checker.citations_history)))
        table.add_row("Citations Saved To", Config.CITATIONS_FILE)
        
        self.console.print("\n")
        self.console.print(table)
        
        if bullshit_claims > 0:
            self.console.print(f"\n[bold red]⚠️  WARNING: This pitch contained {bullshit_claims} false or misleading claims![/bold red]")
        else:
            self.console.print("\n[bold green]✓ No significant false claims detected[/bold green]")

# Flask webhook endpoint
transcript_queue = queue.Queue()

@app.route(Config.WEBHOOK_ENDPOINT, methods=['POST'])
def receive_transcript():
    """Webhook to receive transcript from Google Meet integration"""
    data = request.json
    transcript_text = data.get('transcript', '')
    
    if transcript_text:
        transcript_queue.put(transcript_text)
        return jsonify({"status": "received", "length": len(transcript_text)}), 200
    
    return jsonify({"error": "No transcript provided"}), 400

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "bullshit-detector"}), 200

async def process_queue(detector):
    """Process transcript queue"""
    while True:
        if not transcript_queue.empty():
            chunk = transcript_queue.get()
            await detector.process_transcript_chunk(chunk)
        await asyncio.sleep(0.1)

async def main():
    """Main application"""
    detector = BullshitDetector()
    
    # Check for API key
    if not Config.OPENAI_API_KEY:
        console.print("[bold red]⚠️  Warning: OPENAI_API_KEY not set in .env[/bold red]")
        console.print("[yellow]Running in pattern-matching mode (limited functionality)[/yellow]\n")
    else:
        console.print("[green]✓ OpenAI Web Search API configured[/green]")
    
    # Show startup message
    console.print(Panel.fit(
        f"""[bold cyan]🎯 BULLSHIT DETECTOR v2.0 - Web Search Edition 🎯[/bold cyan]
        
Real-time fact-checking with OpenAI Web Search
Model: {Config.OPENAI_SEARCH_MODEL}
Webhook: http://localhost:{Config.FLASK_PORT}{Config.WEBHOOK_ENDPOINT}
        
[yellow]Ready to detect false claims...[/yellow]""",
        title="YC Hackathon Demo",
        border_style="cyan"
    ))
    
    # Start Flask in background thread
    flask_thread = threading.Thread(
        target=lambda: app.run(port=Config.FLASK_PORT, debug=False, use_reloader=False),
        daemon=True
    )
    flask_thread.start()
    
    # Process transcript queue
    try:
        await process_queue(detector)
    except KeyboardInterrupt:
        console.print("\n[yellow]Shutting down...[/yellow]")
        detector.show_summary()

if __name__ == "__main__":
    asyncio.run(main())