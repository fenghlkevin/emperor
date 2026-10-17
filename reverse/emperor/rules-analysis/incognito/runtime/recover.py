from live_flow import *
p.rpc('BREAK');p.rpc('EXEC BPDEL *');p.rpc('EXEC RUN');time.sleep(.2)
ctx=stop_main();p.call(0x2bd6f,[0,0]);resume(ctx);time.sleep(.5);ctx=stop_main();print(snapshot('ready'))
