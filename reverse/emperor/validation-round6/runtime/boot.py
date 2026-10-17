from pathlib import Path
import subprocess,json,sys,time,os,signal,pty,select
R=Path(__file__).resolve().parent
if sys.argv[1]=='start':
 tag=sys.argv[2];port=int(sys.argv[3]);D=R/tag;D.mkdir(exist_ok=True)
 for name in ['probe.py','live_flow.py']:(D/name).write_text((R/name).read_text())
 (D/'bridge.py').write_text((R/'bridge.py').read_text().replace('59006',str(port)))
 (D/'test.conf').write_text((R/'test.conf').read_text().replace('59006',str(port)).replace(str(R),str(D)))
 b=subprocess.Popen([sys.executable,str(D/'bridge.py')],stdout=(D/'bridge.log').open('w'),stderr=subprocess.STDOUT)
 time.sleep(.2)
 exe=R.parents[1]/'validation-round3/runtime/dosbox-x/dosbox-x-sdl2/dosbox-x.app/Contents/MacOS/dosbox-x'
 master,slave=pty.openpty();e=subprocess.Popen([str(exe),'-conf',str(D/'test.conf')],cwd=D,stdin=slave,stdout=slave,stderr=slave);os.close(slave)
 (D/'processes.json').write_text(json.dumps({'bridge':b.pid,'emulator':e.pid}));print(D,flush=True)
 with (D/'dosbox.log').open('wb') as log:
  while e.poll() is None:
   if select.select([master],[],[],.2)[0]:
    try:chunk=os.read(master,65536)
    except OSError:break
    if not chunk:break
    
    if log.tell()<10*1024*1024:log.write(chunk);log.flush()
 os.close(master);b.terminate()
else:
 D=R/sys.argv[2];j=json.loads((D/'processes.json').read_text())
 for pid in j.values():
  try:os.kill(pid,signal.SIGTERM)
  except ProcessLookupError:pass
 print('stopped',D)
