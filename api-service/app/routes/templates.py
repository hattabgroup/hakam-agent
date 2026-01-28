from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from .. import database, models, security

router = APIRouter(prefix="/policy/templates", tags=["policy_templates"])

class TemplateRule(BaseModel):
    name: str
    severity: int
    rule_text: str
    enabled: bool = True

class PolicyTemplate(BaseModel):
    id: str
    name: str
    description: str
    rules: List[TemplateRule]

class ImportTemplateRequest(BaseModel):
    template_ids: List[str]

# --- Template Definitions ---

TEMPLATES = [
    PolicyTemplate(
        id="security",
        name="Security (OWASP Top 10)",
        description="Critical security rules covering Injection, Broken Access Control, Cryptographic Failures, and more.",
        rules=[
            TemplateRule(name="Hardcoded Secrets", severity=5, rule_text="Identify hardcoded keys, passwords, tokens, or credentials in the code."),
            TemplateRule(name="SQL Injection", severity=5, rule_text="Detect raw SQL queries constructed using string concatenation instead of parameterized queries."),
            TemplateRule(name="XSS Vulnerabilities", severity=5, rule_text="Detect unescaped user input rendered in HTML or unsafe usage of innerHTML/dangerouslySetInnerHTML."),
            TemplateRule(name="Insecure Randomness", severity=4, rule_text="Detect use of weak random number generators (e.g., Math.random) for cryptographic purposes."),
            TemplateRule(name="Disabled SSL/TLS", severity=5, rule_text="Detect code that disables SSL/TLS certificate verification (e.g., verify=False, rejectUnauthorized=false)."),
            TemplateRule(name="Weak Hashing", severity=4, rule_text="Detect usage of weak hashing algorithms like MD5 or SHA1."),
            TemplateRule(name="Insecure Direct Object References", severity=4, rule_text="Identify patterns where internal object IDs are exposed and used without authorization checks."),
            TemplateRule(name="Missing Auth Checks", severity=4, rule_text="Detect API endpoints or sensitive functions missing authorization decorators or checks."),
            TemplateRule(name="Cleartext Logging", severity=3, rule_text="Detect logging of potential PII, passwords, or sensitive data in cleartext."),
            TemplateRule(name="XML External Entities (XXE)", severity=4, rule_text="Detect unsafe XML parsing configurations that allow external entity resolution.")
        ]
    ),
    PolicyTemplate(
        id="privacy_compliance",
        name="Data Privacy & Compliance",
        description="Rules for GDPR, CCPA, and HIPAA compliance, focusing on PII protection and data handling.",
        rules=[
            TemplateRule(name="PII Leakage", severity=5, rule_text="Detect logging or exposure of PII such as email addresses, phone numbers, SSNs, or credit card numbers."),
            TemplateRule(name="Unencrypted Sensitive Data", severity=5, rule_text="Detect storage or transmission of sensitive data (passwords, health data) without encryption."),
            TemplateRule(name="Missing Consent Check", severity=4, rule_text="Detect data collection points that lack associated consent verification flags (GDPR)."),
            TemplateRule(name="Insecure Data Transmission", severity=5, rule_text="Detect data being sent over unencrypted HTTP channels instead of HTTPS."),
            TemplateRule(name="Weak Access Controls", severity=4, rule_text="Detect insufficient or missing permission checks on endpoints accessing sensitive user data."),
            TemplateRule(name="PHI in Logs", severity=5, rule_text="Detect logging of Protected Health Information (PHI) or health-related terms (HIPAA)."),
            TemplateRule(name="Data Retention Policy", severity=3, rule_text="Check for code or comments related to data deletion, retention periods, or archival logic."),
            TemplateRule(name="Third-Party Data Sharing", severity=4, rule_text="Detect data sharing with unregistered or unknown external APIs/services.")
        ]
    ),
    PolicyTemplate(
        id="performance",
        name="Performance Optimization",
        description="Rules to identify common performance bottlenecks like N+1 queries and memory leaks.",
        rules=[
            TemplateRule(name="N+1 Query Problem", severity=4, rule_text="Detect database queries executed inside loops."),
            TemplateRule(name="Unbounded Queries/Loops", severity=3, rule_text="Detect loops or queries without limits or exit conditions that could cause timeouts."),
            TemplateRule(name="Large Object Allocation", severity=3, rule_text="Detect large object allocations or heavy computations inside hot paths or loops."),
            TemplateRule(name="Inefficient String Concatenation", severity=2, rule_text="Detect inefficient string concatenation in loops (suggest using a builder/buffer)."),
            TemplateRule(name="Missing Database Indexes", severity=4, rule_text="Detect schema definitions or queries that suggest missing indexes on filtered columns."),
            TemplateRule(name="Synchronous I/O in Async", severity=4, rule_text="Detect blocking synchronous I/O calls within asynchronous functions."),
            TemplateRule(name="Redundant API Calls", severity=3, rule_text="Detect multiple identical API calls made in sequence or short duration."),
            TemplateRule(name="Resource Leaks", severity=4, rule_text="Detect unclosed resources like file handles, database connections, or network sockets.")
        ]
    ),
    PolicyTemplate(
        id="best_practices",
        name="Code Quality & Best Practices",
        description="General best practices for maintainability, readability, and clean code.",
        rules=[
            TemplateRule(name="God Functions", severity=3, rule_text="Detect functions that are too long (>50 lines) or have high cyclomatic complexity."),
            TemplateRule(name="Magic Numbers", severity=2, rule_text="Detect the use of hardcoded numeric literals without explanation (excluding 0, 1, -1)."),
            TemplateRule(name="Code Duplication", severity=3, rule_text="Detect identical blocks of code (more than 5 lines) repeated multiple times."),
            TemplateRule(name="Inconsistent Naming", severity=2, rule_text="Detect naming convention violations (e.g., camelCase vs snake_case inconsistency)."),
            TemplateRule(name="Missing Docstrings", severity=1, rule_text="Ensure public methods and classes have documentation strings."),
            TemplateRule(name="Dead Code", severity=2, rule_text="Detect unused variables, imports, or unreachable code segments."),
            TemplateRule(name="Deep Nesting", severity=2, rule_text="Detect control flow structures nested deeper than 3 or 4 levels."),
            TemplateRule(name="Empty Catch Blocks", severity=3, rule_text="Detect catch/except blocks that swallow exceptions without logging or handling them.")
        ]
    )
]

@router.get("/", response_model=List[PolicyTemplate])
def list_templates(
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    return TEMPLATES

@router.post("/import")
def import_templates(
    request: ImportTemplateRequest,
    db: Session = Depends(database.get_db),
    current_user: models.UserLocal = Depends(security.get_current_user)
):
    imported_count = 0
    
    for template_id in request.template_ids:
        # Find template
        template = next((t for t in TEMPLATES if t.id == template_id), None)
        if not template:
            continue
            
        # Check if category exists, if not create
        category = db.query(models.PolicyCategory).filter(
            models.PolicyCategory.user_id == current_user.id,
            models.PolicyCategory.name == template.name
        ).first()
        
        if not category:
            category = models.PolicyCategory(
                user_id=current_user.id,
                name=template.name,
                description=template.description
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            
        # Add Rules
        for rule_tmpl in template.rules:
            # Check if rule exists in category to avoid dupes
            existing_rule = db.query(models.PolicyRule).filter(
                models.PolicyRule.category_id == category.id,
                models.PolicyRule.name == rule_tmpl.name
            ).first()
            
            if not existing_rule:
                new_rule = models.PolicyRule(
                    category_id=category.id,
                    name=rule_tmpl.name,
                    severity=rule_tmpl.severity,
                    rule_text=rule_tmpl.rule_text,
                    enabled=rule_tmpl.enabled
                )
                db.add(new_rule)
                imported_count += 1
                
    db.commit()
    return {"message": f"Successfully imported {imported_count} rules from {len(request.template_ids)} templates."}
