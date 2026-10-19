#!/usr/bin/env python3
"""Check physical TS line limits, local documentation links and criterion inventory."""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
errors = []
limits = {'aqours-api': 200, 'aqours-web': 250, 'aqours-app': 300}
ignored = {'node_modules', 'dist', 'android', 'ios', '.expo', 'coverage', '.cache', '.local'}
counts = {}
for project, maximum in limits.items():
    files = []
    for path in (ROOT / project).rglob('*'):
        if any(part in ignored for part in path.relative_to(ROOT).parts):
            continue
        if path.suffix in {'.ts', '.tsx'} and path.is_file():
            lines = len(path.read_text().splitlines())
            files.append((lines, path))
            if lines > maximum:
                errors.append(f'{path.relative_to(ROOT)}: {lines} lines exceeds {maximum}')
    counts[project] = len(files)

markdown = [ROOT/'README.md', ROOT/'PROGRESS.md', *list((ROOT/'docs').rglob('*.md'))]
for path in markdown:
    if not path.exists():
        errors.append(f'Missing documentation: {path.relative_to(ROOT)}')
        continue
    for target in re.findall(r'\]\(([^)]+)\)', path.read_text()):
        target = target.split('#')[0].strip('<>')
        if not target or re.match(r'[a-z][a-z0-9+.-]*:', target, re.I):
            continue
        if not (path.parent / unquote(target)).exists():
            errors.append(f'{path.relative_to(ROOT)}: missing link {target}')

req_text = (ROOT/'docs/requirements.md').read_text()
reqs = re.findall(r'^\| (REQ-[A-Z]+-[A-Z]?\d+) \|', req_text, re.M)
spec_ids = []
for path in (ROOT/'docs/features').rglob('spec.md'):
    spec_ids.extend(re.findall(r'^- \[[ x]\] ([A-Z]+(?:-[A-Z]+)*-\d+):', path.read_text(), re.M))
if len(reqs) != 84 or len(set(reqs)) != 84:
    errors.append(f'Expected 84 unique original requirements, found {len(reqs)}')
if len(spec_ids) != 126 or len(set(spec_ids)) != 126:
    errors.append(f'Expected 126 unique original feature criteria, found {len(spec_ids)}')
trace = ROOT/'docs/traceability.md'
if trace.exists():
    text = trace.read_text()
    for identifier in reqs + spec_ids + [f'DEMO-{i:03d}' for i in range(1,11)]:
        matches = re.findall(rf'^\| {re.escape(identifier)} \|', text, re.M)
        if len(matches) != 1:
            errors.append(f'Traceability needs exactly one {identifier} row, found {len(matches)}')
    evidence = re.findall(r'^\| ([HUWC]-[A-Z]+\d+) \| \[[^\]]+\]\(([^)]+)\) \| ([^|]+) \|$', text, re.M)
    if len(evidence) != 86 or len({row[0] for row in evidence}) != 86:
        errors.append(f'Expected 86 unique named executable test keys, found {len(evidence)}')
    for identifier, target, title in evidence:
        source = trace.parent / target
        if source.exists() and title not in source.read_text():
            errors.append(f'{identifier}: test title does not match {target}')
else:
    errors.append('Missing docs/traceability.md')
if len((ROOT/'PROGRESS.md').read_text().splitlines()) > 150:
    errors.append('PROGRESS exceeds 150 lines; archive before completion')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'PASS: {sum(counts.values())} application TS files within limits; docs links and 84 requirements/126 criteria/10 demos inventoried.')
