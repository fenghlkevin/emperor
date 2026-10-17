from pathlib import Path
import socket,json,time,traceback
ROOT=Path(__file__).resolve().parent;Q=ROOT/'queue2';Q.mkdir(exist_ok=True)
s=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(('127.0.0.1',59013));s.listen(1)
print('listening 127.0.0.1:59013',flush=True)
c,addr=s.accept();c.settimeout(40);f=c.makefile('rb');print('DOSBox connected',addr,flush=True)
(ROOT/'connected.json').write_text(json.dumps({'connected':True,'time':time.time()}))
seq=0
while True:
 pending=sorted(p for p in Q.glob('*.request.json') if not p.with_name(p.name.replace('.request.json','.response.json')).exists())
 if not pending:time.sleep(.05);continue
 p=pending[0];seq+=1;request=json.loads(p.read_text());command=request['command'];requestid=str(seq)
 try:
  c.sendall(f'REQ {requestid} {command}\n'.encode());lines=[]
  while True:
   line=f.readline().decode('utf-8',errors='replace').rstrip('\r\n')
   if not line:raise RuntimeError('closed control channel')
   if line==f'END {requestid}':break
   lines.append(line)
  result={'command':command,'lines':lines,'time':time.time()}
 except Exception as e:result={'command':command,'error':repr(e),'time':time.time()}
 out=p.with_name(p.name.replace('.request.json','.response.json'));out.write_text(json.dumps(result,indent=2));print(seq,command,lines[:2] if 'lines' in result else result,flush=True)
