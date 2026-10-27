#!/usr/bin/env bash
# Agent Repo Benchmark scan. Runs OSV-Scanner, Gitleaks and Semgrep on a repository under hard
# time limits, and lists the file and line candidates each code check reads. It reads the
# repository and runs none of its code.
# Usage: bash scan.sh <repository directory> <output directory>
set -u
REPO=$(cd "${1:-.}" && pwd)
OUT=${2:-/tmp/agent-repo-benchmark}
mkdir -p "$OUT/bin"
cd "$OUT" || exit 1
export PATH="$OUT/bin:$HOME/.local/bin:$PATH"
case "$(uname -m)" in aarch64|arm64) OSV_ARCH=arm64; GL_ARCH=arm64 ;; *) OSV_ARCH=amd64; GL_ARCH=x64 ;; esac
latest() { curl -fsSIL -o /dev/null -w '%{url_effective}' "https://github.com/$1/releases/latest" | sed 's#.*/tag/##'; }
SKIP=(-g '!.git' -g '!node_modules' -g '!vendor' -g '!dist' -g '!build' -g '!**/test/**' -g '!**/tests/**' -g '!**/docs/**' -g '!**/examples/**' -g '!*.md' -g '!*.lock' -g '!*-lock.json')

# Candidate lines for each code check: where tools are declared, where they run commands,
# and the words a sandbox, a confirmation, a destructive action or a shared key leaves behind.
cand() { rg -n -i --no-heading -M 220 "${SKIP[@]}" -e "$2" "$REPO" 2>/dev/null | sed "s#^$REPO/##" | head -40 > "cand-$1.txt"; }
cand tools '(@tool\b|\.tool\(|registerTool|server\.tool|inputSchema|def tool_|tools\s*=\s*\[|function_tool|ToolDefinition)'
cand exec '(subprocess\.|os\.system|os\.popen|shell\s*=\s*True|child_process|execSync|spawnSync|\bexecFile\(|\beval\(|Popen\()'
cand sandbox '(docker|podman|firejail|bubblewrap|bwrap|seccomp|gvisor|nsjail|e2b|sandbox|allowlist|allow_list)'
cand confirm '(approv|confirm|consent|human.in.the.loop|ask_user|require_approval|yolo)'
cand destructive '(def (delete|remove|send|publish|pay|transfer|refund)_|"(delete|remove|send|publish|pay|transfer)_[a-z_]+"|rm -rf|rmtree\(|unlink\()'
cand credentials '((os\.environ|getenv|process\.env)[^\n]{0,40}(key|token|secret|password))'
cand scope '(allowed_tools|allowedtools|disallowed|denylist|deny_list|permission|scopes?\b)'

# Semgrep reads the five folders with the most tool and command lines, never the whole tree.
DIRS=$(cat cand-tools.txt cand-exec.txt | cut -d: -f1 | xargs -r -n1 dirname | sort | uniq -c | sort -rn | head -5 | awk -v r="$REPO" '{print r"/"$2}')
[ -n "$DIRS" ] || DIRS="$REPO"

(
  V=$(latest google/osv-scanner)
  curl -fsSL -o bin/osv-scanner "https://github.com/google/osv-scanner/releases/download/$V/osv-scanner_linux_$OSV_ARCH" && chmod +x bin/osv-scanner \
    && echo "OSV-Scanner $V" > osv.version \
    && timeout 150 osv-scanner scan source --recursive --format json "$REPO" > osv.json 2> osv.err
  echo $? > osv.exit
) &
(
  V=$(latest gitleaks/gitleaks)
  curl -fsSL "https://github.com/gitleaks/gitleaks/releases/download/$V/gitleaks_${V#v}_linux_$GL_ARCH.tar.gz" | tar -xz -C bin gitleaks \
    && echo "Gitleaks $V" > gitleaks.version \
    && timeout 120 gitleaks dir --redact --no-banner --report-format json --report-path gitleaks.json "$REPO" 2> gitleaks.err
  echo $? > gitleaks.exit
) &
(
  timeout 100 uv tool install -q semgrep > semgrep.install 2>&1 || timeout 100 python3 -m pip install -q --user semgrep >> semgrep.install 2>&1
  if command -v semgrep > /dev/null; then
    echo "Semgrep $(semgrep --version)" > semgrep.version
    # shellcheck disable=SC2086
    timeout 120 semgrep scan --config p/default --metrics=off --json --jobs 4 --timeout 5 --max-target-bytes 200000 $DIRS > semgrep.json 2> semgrep.err
  fi
  echo $? > semgrep.exit
) &
wait

python3 - "$OUT" "$REPO" <<'PY'
import json, os, sys
out, repo = sys.argv[1], sys.argv[2].rstrip("/") + "/"
rel = lambda p: str(p or "").replace(repo, "", 1)
def load(name):
    try:
        with open(os.path.join(out, name)) as f:
            return json.load(f)
    except Exception:
        return None
def text(name):
    try:
        with open(os.path.join(out, name)) as f:
            return f.read().strip()
    except Exception:
        return None
summary = {"versions": [v for v in (text("osv.version"), text("gitleaks.version"), text("semgrep.version")) if v]}
osv = load("osv.json")
if osv is None:
    summary["osv"] = {"ran": False, "exit": text("osv.exit"), "error": (text("osv.err") or "")[-300:]}
else:
    rows = []
    for result in osv.get("results", []):
        for pkg in result.get("packages", []):
            vulns = {v.get("id"): v for v in pkg.get("vulnerabilities", [])}
            for group in pkg.get("groups", []):
                try:
                    score = float(group.get("max_severity") or 0)
                except ValueError:
                    score = 0
                fixed = any(e.get("fixed") for vid in group.get("ids", []) for a in vulns.get(vid, {}).get("affected", []) for r in a.get("ranges", []) for e in r.get("events", []))
                p = pkg.get("package", {})
                rows.append({"package": f'{p.get("name")}@{p.get("version")}', "ids": group.get("ids", [])[:3], "score": score, "fixed": fixed, "source": result.get("source", {}).get("path", "").replace(os.sep, "/").split("/")[-1]})
    high = [r for r in rows if r["score"] >= 7 and r["fixed"]]
    summary["osv"] = {"ran": True, "vulnerabilities": len(rows), "highOrCriticalWithFix": len(high), "worst": sorted(high, key=lambda r: -r["score"])[:10]}
gl = load("gitleaks.json")
summary["gitleaks"] = {"ran": gl is not None, "exit": text("gitleaks.exit"), "findings": [{"rule": g.get("RuleID"), "file": rel(g.get("File")), "line": g.get("StartLine")} for g in (gl or [])][:25]}
sg = load("semgrep.json")
if sg is None:
    summary["semgrep"] = {"ran": False, "exit": text("semgrep.exit"), "install": (text("semgrep.install") or "")[-300:]}
else:
    errors = [r for r in sg.get("results", []) if r.get("extra", {}).get("severity") == "ERROR"]
    summary["semgrep"] = {"ran": True, "results": len(sg.get("results", [])), "errors": [{"rule": r.get("check_id", "").split(".")[-1], "file": rel(r.get("path")), "line": r.get("start", {}).get("line")} for r in errors][:25]}
summary["candidates"] = {}
for name in ("tools", "exec", "sandbox", "confirm", "destructive", "credentials", "scope"):
    lines = (text(f"cand-{name}.txt") or "").splitlines()
    summary["candidates"][name] = lines[:15]
print(json.dumps(summary, indent=1))
PY
