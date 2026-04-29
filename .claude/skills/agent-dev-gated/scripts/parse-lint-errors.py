#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
"""
Parse ESLint output into structured JSON for agent consumption.

Receives raw lint command output, extracts errors and warnings,
returns JSON with rule_id, line, message, file for each issue.

Usage:
    python parse-lint-errors.py <lint-output-file>
    python parse-lint-errors.py --stdin  # Read from stdin
    pnpm lint 2>&1 | python parse-lint-errors.py --stdin

Output JSON format:
{
  "errors": [
    {"rule_id": "string", "line": int, "message": "string", "file": "string"}
  ],
  "warnings": [
    {"rule_id": "string", "line": int, "message": "string", "file": "string"}
  ],
  "command_failed": false,
  "command_error": null
}
"""

import sys
import re
import json
from pathlib import Path


def parse_eslint_output(text: str) -> dict:
    """Parse ESLint CLI output into structured JSON."""
    result = {
        "errors": [],
        "warnings": [],
        "command_failed": False,
        "command_error": None
    }

    # Check for command failure (not lint errors)
    # ESLint command fails with non-zero exit when errors exist
    # But actual failures (config missing, module not found) have different patterns

    failure_patterns = [
        r"Cannot find module",
        r"Configuration file not found",
        r"eslint.config\.(js|mjs|cjs) not found",
        r"Command failed with exit code",
        r"ENOENT: no such file",
        r"TypeError:",
        r"ReferenceError:",
    ]

    for pattern in failure_patterns:
        if re.search(pattern, text):
            # This is a command failure, not lint errors
            result["command_failed"] = True
            result["command_error"] = re.search(pattern, text).group(0)
            return result

    # Parse lint errors/warnings
    # ESLint output format:
    #   /path/to/file.js
    #     10:5  error  'x' is not defined    no-undef
    #     20:1  warning  Missing semicolon    semi

    lines = text.split('\n')
    current_file = None

    for line in lines:
        # File path line (starts with / or . and has no leading spaces)
        if line and not line.startswith(' ') and not line.startswith('\t'):
            # Check if it looks like a file path
            if re.match(r'^[/\.].*\.(js|ts|tsx|jsx|mjs|cjs)$', line.strip()) or \
               re.match(r'^[A-Za-z]:\\.*\.(js|ts|tsx|jsx|mjs|cjs)$', line.strip()) or \
               line.strip().endswith('.md') or line.strip().endswith('.json'):
                current_file = line.strip()

        # Error/warning line
        # Format: "  10:5  error/warning  message  rule-id"
        match = re.match(r'^\s+(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+(\S+)$', line)
        if match and current_file:
            line_num = int(match.group(1))
            col_num = int(match.group(2))
            severity = match.group(3)
            message = match.group(4).strip()
            rule_id = match.group(5)

            item = {
                "rule_id": rule_id,
                "line": line_num,
                "column": col_num,
                "message": message,
                "file": current_file
            }

            if severity == "error":
                result["errors"].append(item)
            else:
                result["warnings"].append(item)

    return result


def main():
    use_stdin = "--stdin" in sys.argv or len(sys.argv) == 1

    if use_stdin:
        text = sys.stdin.read()
    else:
        # Read from file
        input_file = sys.argv[1]
        if input_file == "--stdin":
            text = sys.stdin.read()
        else:
            text = Path(input_file).read_text(encoding='utf-8', errors='replace')

    result = parse_eslint_output(text)

    # Output JSON
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()