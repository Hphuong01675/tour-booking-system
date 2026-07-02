from pathlib import Path
import runpy
import sys
import tempfile


workspace_tmp = Path("target/tmp").resolve()
workspace_tmp.mkdir(parents=True, exist_ok=True)
tempfile.tempdir = str(workspace_tmp)

renderer = Path(
    "C:/Users/ADMIN/.codex/plugins/cache/openai-primary-runtime/documents/26.623.12021/skills/documents/render_docx.py"
)

sys.argv = [str(renderer), *sys.argv[1:]]
runpy.run_path(str(renderer), run_name="__main__")
