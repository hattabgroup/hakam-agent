import re

import re

def evaluate_diff(diff_content: str, rules: list) -> list:
    violations = []
    
    current_file = "unknown"
    current_line = 0
    
    # Pre-compiled security patterns
    security_patterns = {
        "AKIA[0-9A-Z]{16}": "AWS Access Key",
        "BEGIN PRIVATE KEY": "Private Key",
        "password\s*=": "Potential hardcoded password"
    }

    lines = diff_content.split('\n')
    for line in lines:
        if line.startswith('+++ b/'):
            # Filename can be followed by a tab or space and a timestamp
            path_part = line[6:].strip()
            # Split by tab or multiple spaces and take the first part
            current_file = re.split(r'[\t\s]{2,}', path_part)[0].split('\t')[0].strip()
            continue
        
        if line.startswith('@@'):
            # Parse hunk header: @@ -start,len +start,len @@
            match = re.search(r'\+(\d+)', line)
            if match:
                current_line = int(match.group(1)) - 1 # Prep for first increment
            continue

        if line.startswith(' '):
            current_line += 1
            continue
            
        if line.startswith('+') and not line.startswith('+++'):
            current_line += 1
            content = line[1:]
            
            # 1. Custom Rules
            for rule in rules:
                pattern = rule['rule_text']
                if re.search(pattern, content):
                    violations.append({
                        "category": "Custom",
                        "rule_name": rule['name'],
                        "severity": rule['severity'],
                        "file_path": current_file,
                        "line_start": current_line,
                        "line_end": current_line,
                        "message": f"Found forbidden pattern: {pattern}"
                    })
            
            # 2. Hardcoded Security Checks
            for pat, msg in security_patterns.items():
                if re.search(pat, content):
                    violations.append({
                        "category": "Security",
                        "rule_name": "Secret Detection",
                        "severity": "critical",
                        "file_path": current_file,
                        "line_start": current_line,
                        "line_end": current_line,
                        "message": f"{msg} detected"
                    })
        
        if line.startswith('-'):
            # Deletions don't affect target file line numbers
            continue
                    
    return violations
