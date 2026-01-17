"""
AI Structure Learner - Dynamic HTML Parsing with LLM
Uses Google Gemini API to automatically learn webpage structures
"""

import os
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, Optional
from dotenv import load_dotenv
from google import genai

from crawler.config import EnvironmentConfig
from crawler.db_manager.MongoDbManager import MongoDBManager

load_dotenv()

db_manager = MongoDBManager()


class AIStructureLearner:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY not found in environment variables")
            self.client = None
        else:
            # Initialize Gemini client with new SDK
            self.client = genai.Client(api_key=self.api_key)

        self.model_name = "gemini-2.5-flash"  # Use latest stable model
        self.source_templates_collection = "source_templates"

        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

    def _get_template_from_db(self, source_name: str) -> Optional[Dict]:
        """Get existing template from MongoDB"""
        query = {"source_name": source_name, "is_active": True}
        template = db_manager.find_one(self.source_templates_collection, query)

        if template:
            print(f"✅ Found existing template for {source_name}")
            return template

        return None

    def _save_template_to_db(self, source_name: str, url: str, template: Dict):
        """Save learned template to MongoDB"""
        document = {
            "source_name": source_name,
            "base_url": url,
            "template": template,
            "is_active": True,
            "learned_at": datetime.now(),
            "success_count": 0,
            "fail_count": 0,
        }

        # Deactivate old templates
        db_manager.update_many(
            self.source_templates_collection,
            {"source_name": source_name},
            {"$set": {"is_active": False}},
        )

        # Save new template
        db_manager.save_data(self.source_templates_collection, document)
        print(f"✅ Saved new template for {source_name}")

    def _fetch_html(self, url: str) -> Optional[str]:
        """Fetch raw HTML from URL"""
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"❌ Error fetching {url}: {e}")
            return None

    def _clean_html_for_llm(self, html: str) -> str:
        """Clean and simplify HTML for LLM processing"""
        soup = BeautifulSoup(html, "html.parser")

        # Remove scripts, styles, comments, but keep structure
        for tag in soup(["script", "style", "noscript", "iframe", "svg", "path"]):
            tag.decompose()

        # Focus on main content areas - try to find article/main section
        main_content = soup.find("article") or soup.find("main") or soup.find("body")
        if main_content:
            soup = main_content

        # Get text structure with preserved hierarchy
        clean_html = soup.prettify()

        # Truncate if too long (Gemini has ~1M token limit but we keep it reasonable)
        if len(clean_html) > 50000:
            clean_html = clean_html[:50000] + "\n... (truncated)"

        return clean_html

    def _call_gemini_api(self, prompt: str) -> Optional[str]:
        """Call Gemini API with prompt using new SDK"""
        if not self.client:
            print("❌ Gemini client not initialized (missing API key)")
            return None

        try:
            response = self.client.models.generate_content(
                model=self.model_name, contents=prompt
            )
            return response.text

        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            return None

    def _parse_llm_response(self, response: str) -> Optional[Dict]:
        """Parse LLM response to extract selectors"""
        try:
            # Try to extract JSON from response (LLM might wrap it in markdown)
            json_start = response.find("{")
            json_end = response.rfind("}") + 1

            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                template = json.loads(json_str)

                # Validate required fields
                required_fields = [
                    "title_selector",
                    "content_selector",
                    "date_selector",
                ]
                if all(field in template for field in required_fields):
                    return template

            print("❌ LLM response missing required fields")
            return None

        except Exception as e:
            print(f"❌ Error parsing LLM response: {e}")
            return None

    def learn_structure(
        self, url: str, source_name: str, force_relearn: bool = False
    ) -> Optional[Dict]:
        """
        Learn webpage structure using LLM

        Args:
            url: Sample URL from the news source
            source_name: Name identifier for the source
            force_relearn: Force learning even if template exists

        Returns:
            {
                'title_selector': 'CSS selector for title',
                'content_selector': 'CSS selector for main content',
                'date_selector': 'CSS selector for publish date',
                'author_selector': 'CSS selector for author (optional)',
                'summary_selector': 'CSS selector for summary (optional)'
            }
        """
        print(f"\n{'='*60}")
        print(f"🤖 AI Structure Learner: {source_name}")
        print(f"{'='*60}")

        # Check if template exists
        if not force_relearn:
            existing_template = self._get_template_from_db(source_name)
            if existing_template:
                return existing_template.get("template")

        # Fetch HTML
        print(f"📥 Fetching HTML from {url}...")
        raw_html = self._fetch_html(url)
        if not raw_html:
            return None
        print(f"📊 Fetched HTML length: {len(raw_html)} characters")

        # Clean HTML
        print("🧹 Cleaning HTML...")
        clean_html = self._clean_html_for_llm(raw_html)
        print(f"📊 Cleaned HTML length: {len(clean_html)} characters")

        # Debug: Save first 1500 chars to see what LLM receives
        debug_preview = clean_html[:1500]
        print(f"\n🔍 HTML Preview (first 1500 chars):\n{debug_preview}\n...")

        # Prepare enhanced prompt for LLM
        prompt = f"""You are an expert web scraper. Analyze this HTML from a news article website and identify CSS selectors.

URL: {url}
Source: {source_name}

HTML Sample:
```html
{clean_html[:15000]}
```

TASK: Analyze the HTML structure and provide CSS selectors to extract:
1. **title_selector**: Main article headline (usually h1, h2, or div with class containing 'title', 'headline')
2. **content_selector**: Article body paragraphs (look for divs/sections with 'content', 'body', 'article-text')
3. **date_selector**: Publication date (time tags, spans with 'date', 'published', 'time')
4. **author_selector**: Author name (links or spans with 'author', 'byline', 'writer')
5. **summary_selector**: Article summary/excerpt (optional, divs with 'summary', 'description', 'excerpt')

GUIDELINES:
- Look for semantic HTML5 tags: <article>, <time>, <header>
- Check data-* attributes (e.g., data-testid, data-component)
- Prefer class-based selectors for stability
- Use attribute selectors if needed: [data-testid="article-title"]
- If you can't find a selector, use null

IMPORTANT: Return ONLY valid JSON (no markdown code blocks, no explanation).

Example format:
{{
    "title_selector": "h1[data-testid='headline']",
    "content_selector": "article.post-content p",
    "date_selector": "time[datetime]",
    "author_selector": "a.author-link",
    "summary_selector": "div.article-excerpt"
}}

JSON Output:"""

        # Call Gemini API
        print("🤖 Calling Gemini AI...")
        llm_response = self._call_gemini_api(prompt)
        if not llm_response:
            print("❌ LLM call failed")
            return None

        # Debug: print raw response
        print(f"\n🔍 DEBUG - Raw LLM Response:\n{llm_response}\n")

        # Parse response
        print("📝 Parsing LLM response...")
        template = self._parse_llm_response(llm_response)
        if not template:
            return None

        # Save template
        self._save_template_to_db(source_name, url, template)

        print(f"✅ Successfully learned structure for {source_name}")
        print(f"Template: {json.dumps(template, indent=2)}")

        return template

    def validate_template(self, url: str, template: Dict) -> bool:
        """
        Validate if template works on a sample URL

        Returns:
            True if template successfully extracts data
        """
        try:
            html = self._fetch_html(url)
            if not html:
                return False

            soup = BeautifulSoup(html, "html.parser")

            # Try to extract title
            title_elem = soup.select_one(template.get("title_selector", ""))
            if not title_elem:
                print("❌ Title selector failed")
                return False

            # Try to extract content
            content_elems = soup.select(template.get("content_selector", ""))
            if not content_elems:
                print("❌ Content selector failed")
                return False

            print("✅ Template validation passed")
            return True

        except Exception as e:
            print(f"❌ Validation error: {e}")
            return False

    def update_template_stats(self, source_name: str, success: bool):
        """Update template success/fail counters"""
        field = "success_count" if success else "fail_count"
        db_manager.update_one(
            self.source_templates_collection,
            {"source_name": source_name, "is_active": True},
            {"$inc": {field: 1}},
        )


# CLI Testing
if __name__ == "__main__":
    learner = AIStructureLearner()

    # Test with multiple real sources (static HTML preferred)
    test_cases = [
        # CoinTelegraph - typically has better static HTML
        (
            "https://cointelegraph.com/news/bitcoin-traders-predict-strong-run-up-classic-chart-113k",
            "cointelegraph",
        ),
        # CoinDesk - React/Next.js heavy
        (
            "https://www.coindesk.com/business/2025/01/16/trump-coin-surges-18-billion-amid-legal-concerns-over-celebrity-memecoins",
            "coindesk",
        ),
    ]

    for test_url, source_name in test_cases:
        print(f"\n{'='*60}")
        print(f"Testing: {source_name}")
        print(f"{'='*60}")

        template = learner.learn_structure(test_url, source_name, force_relearn=True)

        if template:
            print("\n✅ Template learned successfully!")
            print(json.dumps(template, indent=2))

            # Validate
            is_valid = learner.validate_template(test_url, template)
            print(f"\nValidation: {'PASS' if is_valid else 'FAIL'}")

            # If validation passes, stop testing
            if is_valid:
                print(f"\n🎉 Success with {source_name}!")
                break
        else:
            print(f"\n❌ Failed to learn template for {source_name}")

        print(f"\nTrying next source...\n")
    else:
        print("\n❌ Failed to learn template")
