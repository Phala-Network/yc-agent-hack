#!/usr/bin/env python3
"""
Test script for web search fact-checking
Tests the bullshit detector with various claims
"""

import asyncio
import requests
import time
from rich.console import Console

console = Console()

# Test claims - mix of true, false, and misleading statements
TEST_CLAIMS = [
    {
        "transcript": "Our startup, TechFlow AI, has achieved $50 million in ARR within just 6 months of launching.",
        "expected": "FALSE",
        "description": "Impossible revenue claim for unknown startup"
    },
    {
        "transcript": "We have secured partnerships with Microsoft, Google, and Amazon for our new AI platform.",
        "expected": "FALSE",
        "description": "Unverifiable partnership claims"
    },
    {
        "transcript": "Our AI model achieves 99.7% accuracy on the HumanEval benchmark, beating GPT-4.",
        "expected": "FALSE",
        "description": "Impossible benchmark claim"
    },
    {
        "transcript": "OpenAI was founded in 2015 as a non-profit AI research company.",
        "expected": "TRUE",
        "description": "Verifiable true statement"
    },
    {
        "transcript": "We've replaced 40% of software engineers at Fortune 500 companies with our AI agents.",
        "expected": "FALSE",
        "description": "Outrageous replacement claim"
    },
    {
        "transcript": "Tesla's market cap exceeded $1 trillion in 2021.",
        "expected": "TRUE",
        "description": "Verifiable market fact"
    },
    {
        "transcript": "Our team includes engineers from FAANG companies with over 10 years of experience.",
        "expected": "UNVERIFIABLE",
        "description": "Common but unverifiable team claim"
    },
    {
        "transcript": "We've trained our model on 50 trillion tokens, more than any other AI company.",
        "expected": "MISLEADING",
        "description": "Exaggerated training data claim"
    }
]

def send_transcript(text: str, endpoint: str = "http://localhost:5000/transcript"):
    """Send transcript to the detector webhook"""
    try:
        response = requests.post(
            endpoint,
            json={"transcript": text},
            timeout=5
        )
        return response.json()
    except requests.exceptions.ConnectionError:
        console.print("[red]Error: Cannot connect to detector. Is it running?[/red]")
        return None
    except Exception as e:
        console.print(f"[red]Error sending transcript: {e}[/red]")
        return None

async def test_web_search_detection():
    """Test the web search fact-checking capability"""
    console.print("[bold cyan]Testing Bullshit Detector with Web Search[/bold cyan]\n")
    
    # Check if detector is running
    try:
        health = requests.get("http://localhost:5000/health", timeout=2)
        if health.status_code == 200:
            console.print("[green]✓ Detector is running[/green]\n")
        else:
            console.print("[red]Detector health check failed[/red]")
            return
    except:
        console.print("[red]Error: Bullshit detector is not running![/red]")
        console.print("[yellow]Please run 'python bullshit_detector.py' first[/yellow]")
        return
    
    # Test each claim
    for i, test_case in enumerate(TEST_CLAIMS, 1):
        console.print(f"\n[bold]Test {i}/{len(TEST_CLAIMS)}:[/bold] {test_case['description']}")
        console.print(f"[dim]Claim: {test_case['transcript'][:80]}...[/dim]")
        console.print(f"[dim]Expected verdict: {test_case['expected']}[/dim]")
        
        # Send the claim
        result = send_transcript(test_case['transcript'])
        
        if result:
            console.print(f"[green]✓ Sent successfully[/green]")
        else:
            console.print(f"[red]✗ Failed to send[/red]")
        
        # Wait for processing
        console.print("[dim]Waiting for web search and analysis...[/dim]")
        await asyncio.sleep(5)  # Give time for web search
    
    console.print("\n[bold green]Test complete![/bold green]")
    console.print("[yellow]Check the detector output for results and citations[/yellow]")

async def test_rapid_fire():
    """Test with rapid succession of claims"""
    console.print("\n[bold cyan]Rapid Fire Test - Multiple Claims[/bold cyan]\n")
    
    pitch = """
    Let me tell you about our revolutionary startup. We've built an AI that's 10x better than GPT-4.
    In just 3 months, we've acquired 5 million users and generated $100 million in revenue.
    Our technology uses quantum computing to achieve 100% accuracy on all benchmarks.
    We have exclusive partnerships with the Department of Defense and NATO.
    Our founding team previously sold companies to Google for $10 billion each.
    """
    
    console.print("[yellow]Sending complex pitch with multiple claims...[/yellow]")
    result = send_transcript(pitch)
    
    if result:
        console.print("[green]✓ Pitch sent for analysis[/green]")
        console.print("[dim]Check detector for multiple bullshit alerts![/dim]")
    
    await asyncio.sleep(10)

async def test_true_statements():
    """Test with verifiable true statements"""
    console.print("\n[bold cyan]Testing True Statements[/bold cyan]\n")
    
    true_claims = [
        "Microsoft was founded by Bill Gates and Paul Allen in 1975.",
        "The iPhone was first released by Apple in 2007.",
        "Amazon Web Services is a leading cloud computing platform.",
        "Python is one of the most popular programming languages."
    ]
    
    for claim in true_claims:
        console.print(f"[dim]Testing: {claim}[/dim]")
        send_transcript(claim)
        await asyncio.sleep(3)
    
    console.print("[green]True statements sent - should not trigger alerts[/green]")

async def main():
    """Run all tests"""
    console.print("[bold magenta]🔍 Web Search Fact-Checker Test Suite 🔍[/bold magenta]\n")
    
    # Run test suites
    await test_web_search_detection()
    await test_rapid_fire()
    await test_true_statements()
    
    console.print("\n[bold cyan]All tests complete![/bold cyan]")
    console.print("[yellow]Review the detector output and citations file for detailed results[/yellow]")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Tests interrupted[/yellow]")