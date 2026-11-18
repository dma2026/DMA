"""Refresh the page's inline JS, CSS and CSP hashes after editing assets/."""
import base64
import hashlib
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
page = root / "index.html"
html = page.read_text()
assets = root / "assets"
styles = (assets / "fonts/fonts.css").read_text().replace("url(font-", "url(assets/fonts/font-")
styles += (assets / "style.css").read_text() + (assets / "hero-palettes.css").read_text()
for tag, element, source in [
    ("script", "page-app", (assets / "app.js").read_text()),
    ("style", "page-style", styles),
]:
    pattern = f'(<{tag} id="{element}">).*?(</{tag}>)'
    html, count = re.subn(pattern, lambda match: match[1] + source + match[2], html, flags=re.S)
    if count != 1:
        raise ValueError(f"Expected one {element} block")

for tag, directive in [("script", "script-src"), ("style", "style-src")]:
    hashes = []
    for attrs, content in re.findall(fr"<{tag}\b([^>]*)>(.*?)</{tag}>", html, re.S):
        if 'type="application/octet-stream"' in attrs or 'src="' in attrs:
            continue
        digest = hashlib.sha256(content.encode()).digest()
        hashes.append("'sha256-" + base64.b64encode(digest).decode() + "'")
    html = re.sub(directive + r" [^;]+;", directive + " 'self' " + " ".join(hashes) + ";", html)
page.write_text(html)
