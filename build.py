"""Build the single-file app from editable local sources. Standard library only."""
from pathlib import Path
import json
p = Path(__file__).resolve().parent
data=json.loads((p/"content.json").read_text(encoding="utf-8"))
css=(p/"styles.css").read_text(encoding="utf-8")
js=(p/"app.js").read_text(encoding="utf-8")
template=(p/"template.html").read_text(encoding="utf-8")
html=template.replace("/* APP_STYLES */",css).replace("/* APP_SCRIPT */",js).replace('{"APP_DATA":true}',json.dumps(data,ensure_ascii=False).replace("</","<\\/"))
(p/"index.html").write_text(html,encoding="utf-8")
print("Built",p/"index.html")
