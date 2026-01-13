from typing import List, Optional
import json
from openai import OpenAI
import google.generativeai as genai
from .. import schemas, models

class LLMService:
    def __init__(self, settings: List[models.Settings]):
        self.settings_map = {s.key: s.value for s in settings}
        self.provider = self.settings_map.get('llm_provider', 'openai')
        self.api_key = self.settings_map.get('llm_api_key')
        self.model = self.settings_map.get('llm_model', 'gpt-4o')
        
        self.client = None
        if self.provider == 'openai' and self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        elif self.provider == 'gemini' and self.api_key:
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(self.model)

    def analyze_code(self, diff: str, policies: List[models.PolicyCategory]) -> List[schemas.ReviewViolationCreate]:
        if not self.client and not (self.provider == 'gemini' and self.api_key): # Gemini client is the model object itself
             raise ValueError("LLM Provider is not configured or API Key is missing.")
        
        # Construct the prompt
        system_prompt = self._build_system_prompt(policies)
        user_prompt = f"Here is the git diff to analyze:\n\n{diff}"

        try:
            content = ""
            if self.provider == 'openai':
                if not self.client:
                     raise ValueError("OpenAI client not initialized.")
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content
            
            elif self.provider == 'gemini':
                # Gemini Pro/Flash usually supports JSON mode via config or prompt engineering
                # For 1.5/2.0/3.0 models, we can use generation_config
                generation_config = genai.GenerationConfig(
                    response_mime_type="application/json"
                )
                
                # Combine system and user prompt for Gemini as it sometimes prefers single context or system instruction
                # standard way:
                model = genai.GenerativeModel(
                    self.model,
                    system_instruction=system_prompt
                )
                try:
                    response = model.generate_content(
                        user_prompt,
                        generation_config=generation_config
                    )
                    content = response.text
                except Exception as e:
                    if "404" in str(e) or "not found" in str(e).lower():
                        print(f"Gemini Model '{self.model}' not found. Listing available models:")
                        for m in genai.list_models():
                            if 'generateContent' in m.supported_generation_methods:
                                print(f"- {m.name}")
                    raise e

            if not content:
                return []
            
            # Clean content (remove markdown if present)
            content = self._clean_json_response(content)

            try:
                result = json.loads(content)
            except json.JSONDecodeError:
                print(f"JSON Parse Error. Raw Content: {content}")
                return []

            violations_data = result.get("violations", [])
            
            violations = []
            for v in violations_data:
                violations.append(schemas.ReviewViolationCreate(
                    category=v.get("category"),
                    rule_name=v.get("rule_name"),
                    severity=str(v.get("severity", "MEDIUM")), 
                    file_path=v.get("file_path"),
                    line_start=v.get("line_start"),
                    line_end=v.get("line_end"),
                    message=v.get("message")
                ))
            
            return violations

        except Exception as e:
            print(f"LLM Analysis Failed: {e}")
            raise e

    def _clean_json_response(self, content: str) -> str:
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        
        if content.endswith("```"):
            content = content[:-3]
        return content.strip()

    def _build_system_prompt(self, policies: List[models.PolicyCategory]) -> str:
        prompt = """You are an expert Senior Software Engineer performing a code review.
Your goal is to analyze the provided git diff and identify issues based STRICTLY and EXCLUSIVELY on the following policies.
Do NOT report generic best practices, potential bugs, or style issues unless they explicitly violate one of the rules listed below.
If a piece of code does not violate a specific rule, ignore it.

Policies:
"""
        for category in policies:
            prompt += f"\nCategory: {category.name}\n"
            
            # In models.py: PolicyCategory has rules
            for rule in category.rules:
                 if rule.enabled:
                     prompt += f"- Rule: {rule.name} (Severity: {rule.severity})\n  Description: {rule.rule_text}\n"

        prompt += """
Output Format:
You must respond with a valid JSON object containing a "violations" array.
Each violation must have:
- category: (string) The name of the policy category.
- rule_name: (string) The name of the violated rule.
- severity: (string) One of ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]. Match the rule's severity.
- file_path: (string) The file path where the issue occurs.
- line_start: (integer) Start line number (in the new file).
- line_end: (integer) End line number.
- message: (string) A clear, actionable explanation of the issue.

IMPORTANT: 
- Return ONLY valid JSON.
- Ensure all strings are properly escaped (e.g., use "\\\\" for backslashes, "\\n" for newlines).
- Do not include markdown formatting (like ```json ... ```) in your response if possible.

Scan the code carefully. If no violations are found, return {"violations": []}.
"""
        return prompt
