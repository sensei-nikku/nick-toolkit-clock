from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

REQUIRED_FILES = {
    "index.html",
    "404.html",
    "app.css",
    "app.js",
    "time.js",
    ".nojekyll",
}

FORBIDDEN_JS_PATTERNS = {
    "innerHTML": r"\binnerHTML\b",
    "outerHTML": r"\bouterHTML\b",
    "insertAdjacentHTML": r"\binsertAdjacentHTML\b",
    "document.write": r"\bdocument\.write\b",
    "eval": r"\beval\s*\(",
    "Function constructor": r"\bnew\s+Function\b|\bFunction\s*\(",
    "dynamic script creation": r'createElement\s*\(\s*["\']script["\']\s*\)',
}

CSP_REQUIRED = {
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "connect-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
}

class IndexInspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inline_scripts = 0
        self.inline_styles = 0
        self.script_sources = []
        self.stylesheets = []
        self.csp = None
        self.remote_urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)

        for value in attrs.values():
            if isinstance(value, str) and re.match(r"(?i)^https?://", value):
                self.remote_urls.append(value)

        if tag == "script":
            src = attrs.get("src")
            if src:
                self.script_sources.append(src)
            else:
                self.inline_scripts += 1

        if tag == "style":
            self.inline_styles += 1

        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.stylesheets.append(attrs.get("href", ""))

        if (
            tag == "meta"
            and attrs.get("http-equiv", "").lower() == "content-security-policy"
        ):
            self.csp = attrs.get("content", "")

def fail(message):
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)

actual = {path.name for path in SITE.iterdir() if path.is_file()}
missing = REQUIRED_FILES - actual
if missing:
    fail(f"missing required site files: {sorted(missing)}")

index_text = (SITE / "index.html").read_text(encoding="utf-8")
inspector = IndexInspector()
inspector.feed(index_text)

if inspector.inline_scripts:
    fail("index.html contains inline JavaScript")

if inspector.inline_styles:
    fail("index.html contains inline CSS")

if inspector.remote_urls:
    fail(f"index.html contains remote URLs: {inspector.remote_urls}")

if inspector.script_sources != ["./app.js"]:
    fail(f"unexpected script sources: {inspector.script_sources}")

if inspector.stylesheets != ["./app.css"]:
    fail(f"unexpected stylesheets: {inspector.stylesheets}")

if not inspector.csp:
    fail("index.html is missing a Content Security Policy")

for directive in CSP_REQUIRED:
    if directive not in inspector.csp:
        fail(f"CSP is missing required directive: {directive}")

if "'unsafe-inline'" in inspector.csp or "'unsafe-eval'" in inspector.csp:
    fail("CSP contains unsafe-inline or unsafe-eval")

js_text = "\n".join(
    (SITE / filename).read_text(encoding="utf-8")
    for filename in ("app.js", "time.js")
)

for name, pattern in FORBIDDEN_JS_PATTERNS.items():
    if re.search(pattern, js_text):
        fail(f"forbidden JavaScript sink found: {name}")

for filename in ("index.html", "404.html", "app.css", "app.js", "time.js"):
    text = (SITE / filename).read_text(encoding="utf-8")
    if re.search(r"(?i)\bhttp://", text):
        fail(f"insecure http:// reference found in {filename}")

print("Static security validation passed.")
