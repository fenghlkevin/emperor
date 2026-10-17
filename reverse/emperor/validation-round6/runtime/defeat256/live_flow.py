import probe as p,json,time,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'checks';OUT.mkdir(exist_ok=True)
def put(a,n,w=2):p.write(a,(n%(1<<(8*w))).to_bytes(w,'little'))
def get(a,w=2,s=True):return int.from_bytes(p.read(a,w),'little',signed=s)
def stop_main():
 p.rpc('BREAK');p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(0x10202):x}');p.rpc('EXEC RUN')
 deadline=time.time()+10
 while time.time()<deadline:
  time.sleep(.03);r=p.regs()
  if r['CS']==0x160 and r['EIP']==p.code(0x10202):return r
 p.rpc('BREAK');raise TimeoutError(r)
def resume(ctx):
 p.rpc('EXEC BPDEL *');p.rpc('EXEC SR '+' '.join(f'{k} {v:x}' for k,v in ctx.items() if k not in ['CS','DS','ES','SS']));p.rpc('EXEC RUN')
def snapshot(name):
 C=p.u32(p.data(0xc9920));E=p.u32(p.data(0xc98ac));A=p.u32(p.data(0xc98d8));S=A+8;r={'A':A,'C':C,'E':E,'scene_state':get(A+2),'scene_object':p.u32(S+0x3c),'battle_head':p.u32(p.data(0xcc5e0)),'current_battle':p.u32(p.data(0xcc5e8)),'association_counter':get(p.data(0xcc5dc),2,False)};(OUT/(name+'.json')).write_text(json.dumps(r,indent=2));p.dump_log(name+'-protocol.json');return r
if __name__=='__main__':
 ctx=stop_main();(ROOT/'main-context.json').write_text(json.dumps(ctx));print(snapshot('before-menu-load'));p.call(0x2bd6f,[0,0]);resume(ctx);time.sleep(.5);ctx=stop_main();(ROOT/'main-context.json').write_text(json.dumps(ctx));print(snapshot('after-menu-load'));resume(ctx)
