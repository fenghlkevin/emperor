#!/usr/bin/env python3
"""Reproduce static save-tail evidence without executing or modifying the game."""
from pathlib import Path
import importlib.util, json, re, struct, hashlib

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('parse_saves', ROOT/'save-analysis/parse_saves.py')
parser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parser)

def instructions(version):
    rows = []
    for line in (ROOT/f'code-analysis/{version}/object1.relocated.asm').read_text().splitlines():
        m = re.match(r'\s*([0-9a-f]+):.*?\t(.*)', line)
        if m: rows.append((int(m[1],16), m[2]))
    return rows

def write_calls(rows, start, end, target):
    selected = [(pc,ins) for pc,ins in rows if start <= pc <= end]
    calls = []
    previous = 0
    for i,(pc,ins) in enumerate(selected):
        if not ins.startswith(f'call\t0x{target:x} '): continue
        chunk = selected[previous:i]
        lengths = [(j,re.match(r'push\s+0x([0-9a-f]+)$',s)) for j,(_,s) in enumerate(chunk)]
        lengths = [(j,m) for j,m in lengths if m]
        j,m = lengths[-1]
        source = [re.match(r'mov\s+eax, 0x([0-9a-f]+)$',s) for _,s in chunk[j:]]
        source = [m for m in source if m]
        calls.append({'write_pc':hex(pc),'length':int(m[1],16),
                      'absolute_source':hex(int(source[-1][1],16)) if source else None})
        previous = i+1
    return calls

result = {'method':'Static assembly and byte comparison; no runtime execution', 'versions':{}, 'saves':[]}
for version,start,end,target in [('KING',0x957df,0x95b27,0x9b8ec),
                                 ('EMPEROR',0x9593c,0x95c47,0x9bafc),
                                 ('QUICK',0x959a0,0x95cab,0x9bc3c)]:
    rows = instructions(version)
    calls = write_calls(rows,start,end,target)
    assert [c['length'] for c in calls[-2:]] == [13,20]
    assert calls[-1]['absolute_source'] == calls[-2]['absolute_source']
    same = [c for c in calls if c['absolute_source']==calls[-1]['absolute_source']]
    assert [c['length'] for c in same] == [20,13,20]
    # First three calls run 1, 8, 30, 20 times; all subsequent calls once.
    total = sum(c['length'] * ([1,8,30,20][j] if j<4 else 1) for j,c in enumerate(calls))
    assert total == 1556
    result['versions'][version] = {'function_start':hex(start),'function_end':hex(end),
        'write_function':hex(target),'tail_total_bytes':total,'consumed_by_loader':1523,
        'redundant_bytes':total-1523,'same_source_writes':same,'calls':calls}
    (OUT/f'{version}_save_tail.asm').write_text('\n'.join(f'{pc:08x}: {ins}' for pc,ins in rows if start<=pc<=end)+'\n')

for p in sorted((ROOT/'extracted/皇帝完美版/games/EMPEROR').glob('KING*.SAV')):
    r = parser.parse(p)
    if r['status']=='empty-slot-marker': continue
    b = p.read_bytes()
    expected_size = 14605 + 47*r['official_count'] + 21*r['children_count'] + 1793*r['other_count'] + 5*r['list_a_count']
    assert len(b) == expected_size
    source = next(s for s in r['tail_sections'] if s.get('runtime_address')==0xcc4d8)
    flags = bytes.fromhex(source['raw_hex'])
    trailing = b[r['parsed_end']:]
    assert len(flags)==20 and len(trailing)==33
    assert trailing == flags[:13]+flags
    result['saves'].append({'file':p.name,'sha256':hashlib.sha256(b).hexdigest(),
        'expected_size':expected_size,'actual_size':len(b),
        'flags_offset':source['offset'],'flags_hex':flags.hex(),'flags':list(flags),
        'redundant_offset':r['parsed_end'],'redundant_hex':trailing.hex(),
        'first13_equal':trailing[:13]==flags[:13],'last20_equal':trailing[13:]==flags})

data = (ROOT/'code-analysis/KING/object2.relocated.bin').read_bytes()
result['portrait_table'] = []
for j in range(24):
    pointer = struct.unpack_from('<I',data,0xc8b4c-0xb0000+j*4)[0]
    name = data[pointer-0xb0000:].split(b'\0',1)[0].decode('ascii')
    result['portrait_table'].append({'id':j,'pointer':hex(pointer),'file':name})
(OUT/'evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'versions':{k:v['tail_total_bytes'] for k,v in result['versions'].items()},
                  'saves':result['saves']},ensure_ascii=False,indent=2))
