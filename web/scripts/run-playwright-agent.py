"""Run a Playwright agent installed by `playwright init-agents --loop=codex`.

Usage: python3 scripts/run-playwright-agent.py planner path/to/prompt.txt
The installed agent supplies its instructions and MCP server configuration.
"""

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tomllib


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("role", choices=["planner", "generator", "healer"])
    parser.add_argument("prompt", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    definition = tomllib.loads(
        (root / ".codex" / "agents" / f"playwright_test_{args.role}.toml").read_text()
    )
    codex = shutil.which("codex")
    if not codex:
        parser.error("Codex CLI must be installed and signed in")
    # La revisión automática permite evaluar las acciones MCP; el modo exec por
    # defecto las rechaza si requieren aprobación. No se desactiva el sandbox.
    command = [
        codex, "exec", "--ignore-user-config", "--ephemeral",
        "--skip-git-repo-check", "--approve-for-me", "--json", "-C", str(root),
        "-c", "sandbox_workspace_write.network_access=true",
        "-c", "developer_instructions=" + json.dumps(definition["developer_instructions"]),
    ]
    for server, settings in definition["mcp_servers"].items():
        for key, value in settings.items():
            command.extend(["-c", f"mcp_servers.{server}.{key}=" + json.dumps(value)])
    command.append(args.prompt.read_text())
    raise SystemExit(subprocess.call(command, cwd=root, stdin=subprocess.DEVNULL))


if __name__ == "__main__":
    main()
