#!/usr/bin/env python3
"""Gate verifier for gta6-trophy-guide-01 entry. Run: verify_gate.py [outdir]"""
import json, os, re, struct, sys, pathlib

OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/tg-output"
APP = os.path.join(OUT, "app")
ok = True
def check(name, cond, detail=""):
    global ok
    print(("PASS " if cond else "FAIL ") + name + (" — " + detail if detail else ""))
    if not cond: ok = False

# app files
n = 0; total = 0
for root, dirs, files in os.walk(APP, followlinks=False):
    for d in dirs:
        p = os.path.join(root, d)
        if os.path.islink(p): check("no-symlink", False, p); ok = False
        n += 1; total += os.path.getsize(os.path.join(root,d)) if os.path.isfile(os.path.join(root,d)) else 0
    for f in files:
        p = os.path.join(root, f)
        if os.path.islink(p): check("no-symlink", False, p); ok = False
        n += 1
        total += os.path.getsize(p)
        if len(p.encode()) > 1000: check("path-len", False, p)
check("app_files<=993", n <= 993, str(n))
check("app<=48MiB", total <= 48*1024*1024, str(total))
ih = os.path.join(APP, "index.html")
check("index<=1MiB", os.path.isfile(ih) and os.path.getsize(ih) <= 1024*1024)

# network refs in loaded resources
pat = re.compile(r"""(src|href|data|poster|srcset)\s*=\s*["'](https?:|//|data:)""", re.I)
bad = []
for root, dirs, files in os.walk(APP):
    for f in files:
        p = os.path.join(root, f)
        if f.endswith((".html",".htm",".css",".js",".mjs",".svg")):
            try: t = open(p, encoding="utf-8", errors="replace").read()
            except Exception: continue
            if f.endswith((".js",".mjs")):
                for m in re.finditer(r"""(?:import\s+[^'"]*?from\s*|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]""", t):
                    s = m.group(1)
                    if re.match(r"(https?:|//|data:)", s): bad.append((p, s))
            else:
                for m in pat.finditer(t):
                    bad.append((p, m.group(0)))
                for m in re.finditer(r"""url\(\s*['"]?(https?:|//|data:)""", t, re.I):
                    bad.append((p, m.group(0)))
# ignore links inside JSON/text guide content
check("no-network-refs", not bad, "; ".join(f"{a}:{b}" for a,b in bad[:5]))

# screenshots
ss = sorted(os.listdir(os.path.join(OUT, "screenshots")))
check("screenshots 3-4", 3 <= len(ss) <= 4, str(ss))
for f in ss:
    p = os.path.join(OUT, "screenshots", f)
    d = open(p, "rb").read()
    check("shot<=256KiB", len(d) <= 256*1024, f"{f} {len(d)}")
    if d[:8] == b"\x89PNG\r\n\x1a\n":
        w, h = struct.unpack(">II", d[16:24])
    elif d[:3] == b"\xff\xd8\xff":
        # crude JPEG size scan
        i = 2; w = h = 0
        while i < len(d) - 9:
            if d[i] == 0xFF and d[i+1] in (0xC0, 0xC2):
                h, w = struct.unpack(">HH", d[i+5:i+9]); break
            i += 1
    else:
        check("img-format", False, f); continue
    check("shot-dims", max(w,h) <= 1280 and min(w,h) >= 480, f"{f} {w}x{h}")
    check("shot-name", re.fullmatch(r"[A-Za-z0-9._ -]{1,128}", f) and not f.startswith((".", "-")), f)

# trophies
tj = os.path.join(APP, "data", "trophies.json")
d = json.load(open(tj, encoding="utf-8"))
tt = d["trophies"] if isinstance(d, dict) else d
check("trophies 55", len(tt) == 55, str(len(tt)))
noname = [t.get("name") for t in tt if not (t.get("guide") or "").strip()]
check("all guides nonblank", not noname, str(noname[:3]))
cited = sum(1 for t in tt if len(re.findall(r"(PSNProfiles|PowerPyx|PlayStationTrophies|GameFAQs|Exophase|GTA Forums|GTA Wiki)", t.get("guide",""), re.I)) >= 2)
print(f"INFO trophies with 2+ cited sources: {cited}/55")
if cited < 55: ok = False; check("citations-2plus", False, f"only {cited}/55")
# official names vs starter
starter = json.load(open("/tmp/trophy-guide-kit/gta6-trophy-guide-01-kit/starter/app/data/trophies.json", encoding="utf-8"))
st = starter["trophies"] if isinstance(starter, dict) else starter
def norm(s): return re.sub(r"\s+", " ", s.replace("’","'").replace("‘","'").replace("“",'"').replace("”",'"').replace("—","-").replace("–","-").replace("−","-").replace("…","...")).strip().lower()
sn = {norm(t["name"]) for t in st}; rn = {norm(t["name"]) for t in tt}
check("names match official", sn <= rn, f"missing: {sorted(sn-rn)[:5]}")

# text cap: source files that appear in dossier text
SRC_EXT = (".html",".htm",".js",".mjs",".css",".json",".ts")
src_bytes = 0
for root, dirs, files in os.walk(APP):
    dirs[:] = [x for x in dirs if x != "vendor"]
    for f in files:
        if f.endswith(SRC_EXT) and not re.search(r"\.min\.(js|mjs|css)$", f):
            src_bytes += os.path.getsize(os.path.join(root, f))
# main.ts is source too (entrypoint) — it shows in dossier text
mt = os.path.join(OUT, "..")  # not in output; approximate from repo
print(f"INFO app source text bytes (excl vendor): {src_bytes} / 163840 (main.ts extra)")
check("text-budget", src_bytes < 163840, str(src_bytes))

# dossier
dp = os.path.join(OUT, "dossier.json")
check("dossier exists", os.path.isfile(dp))
if os.path.isfile(dp):
    check("dossier<=1.5MiB", os.path.getsize(dp) <= int(1.5*1024*1024), str(os.path.getsize(dp)))

print("GATE:", "ALL PASS" if ok else "FAILURES PRESENT")
sys.exit(0 if ok else 1)
