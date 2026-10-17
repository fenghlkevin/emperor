"""Unexecuted DOS fixture draft. No import-time RPC or standalone execution.

Parent must pass its EXCLUSIVE live probe module to build(p, case).
Use a fresh owned DOS process/checkpoint per destructive case: loading a save
cannot undo arbitrary low-memory writes, corrupted allocator metadata or frees.
"""
import struct, time

CASES = [
    dict(name=f'{path}-{start}', local=local, winner=winner, reason=reason, start=start)
    for path,local,winner,reason in [
        ('retreat',False,1,1), ('annex',False,2,0),
        ('defeat',False,1,0), ('local-retreat',True,1,1),
        ('local-victory',True,2,0), ('local-loss',True,1,0),
    ] for start in ([254,255,256] if local else [255,256])
]

def put(p,a,n,width=2): p.write(a,(n%(1<<(8*width))).to_bytes(width,'little'))
def get(p,a,width=4): return int.from_bytes(p.read(a,width),'little')
def alloc(p,n): return p.call(0x9ac78,[n])['EAX']

def officials(p):
    rows=[]; n=get(p,p.data(0xc992c)); seen=set()
    while n and n not in seen:
        seen.add(n); person=get(p,n)
        rows.append({'node':n,'person':person,'association':get(p,person,1),
                     'role':get(p,person+1,1),'state':get(p,person+2,1)})
        n=get(p,n+8)
    return rows

def block(p,start,end,frame,timeout=10):
    p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(end):x}')
    p.rpc(f'EXEC SR EBP {frame:x} ESP {frame-0x400:x} EIP {p.code(start):x}')
    p.rpc('EXEC RUN'); deadline=time.time()+timeout
    while time.time()<deadline:
        time.sleep(.03); r=p.regs()
        if r['CS']==0x160 and r['EIP']==p.code(end):return r
    p.rpc('BREAK');raise TimeoutError(r)

def build(p,case):
    """Controlled fields; original allocation and original association writes.
    Caller must have paused valid CS160/DS168 and loaded original save already.
    Do not call 91C87 here: GUI destruction/lifetime belongs to main controller.
    """
    entries=officials(p); assert len(entries)>=3
    # Keep chain head FF as natural unallocated-association collision witness.
    # Actual commanders are subsequent distinct real objects.
    selected=entries[1:3] if case['local'] else entries[1:2]
    assert entries[0]['association']==255
    W=alloc(p,0x200); B=alloc(p,0x800)
    p.write(W,bytes(0x200));p.write(B,bytes(0x800))
    put(p,W+0x5d,B,4);put(p,W+0x80,case['winner'],1);put(p,W+0x81,case['reason'],1)
    put(p,B+0x12,int(case['local']),1);put(p,B+0x5d,10,1)
    put(p,B+0x390,0 if case['local'] else 30,1)
    put(p,B+0x6fe,65535)
    for base in [0x65,0x3ce]:
        for i in range(45):p.write(B+base+18*i+1,b'\xff\xff')
    E=get(p,p.data(0xc98ac));put(p,E+0xe,20,1);put(p,E+0x2e,2,1)
    # Normal nonzero local ownership prevents unrelated state-restoration ambiguity.
    R0=p.data(0xc99ac);put(p,R0+2,1);put(p,R0+4,1)
    if not get(p,p.data(0xcc5f4)):
        H=alloc(p,0x4e);p.write(H,bytes(0x4e));p.call(0x962c8,[H]);put(p,p.data(0xcc5f4),H,4)
    # Existing association blocks write both byte, word, state4, counter++.
    frame=p.STACK-0x100;put(p,p.data(0xcc5dc),case['start'])
    for i,item in enumerate(selected):
        put(p,frame-0x1c,item['node'],4);put(p,frame-0x24,B,4)
        block(p,0x80d2b if i==0 else 0x80d79,
              0x80d59 if i==0 else 0x80da7,frame)
    return {'case':case,'W':W,'B':B,'selected':selected,'witness':entries[0],
            'counter_after':get(p,p.data(0xcc5dc),2),'associations':
            [get(p,B+0x6fc,2),get(p,B+0x6fe,2)],'before':officials(p),
            'low_memory_dword':get(p,0)}

def settle(p,fixture):
    """FULL original function. Destructive; only caller decides execution.
    Install free/node-delete breakpoints instead when tracing stop-by-stop.
    """
    result=p.call(0x6668f,[fixture['W']],timeout=20)
    return {'return':result,'after':officials(p),
            'local_owned':get(p,p.data(0xc99ac)+2,2),
            'target_owned':get(p,p.data(0xc99ac)+10*337+2,2),
            'owned_count':get(p,get(p,p.data(0xc98ac))+0x2e,1),
            'last_flag':get(p,fixture['W']+0x11a,1),
            'low_memory_dword':get(p,0)}
