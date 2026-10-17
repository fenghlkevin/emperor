from live_flow import *
W=3091748;rows=json.loads((ROOT/'menus.json').read_text())
exec((ROOT/'menus_continue.py').read_text().split('C=p.u32(W+0x28);')[0].split('W=3091748;rows=json.loads((ROOT/\'menus.json\').read_text())\n')[1])
M=p.u32(W+8);child=p.u32(M+0x16);assert child;p.call(0x30207,[M,child],20);record('normal-final-prompt-child-event')
M=p.u32(W+8);put(M+6,3);p.call(0x3039c,[M],20);record('normal-return-prompt-event')
M=p.u32(W+0x10);assert M;p.call(0x86468,[M,p.u32(M+0x26)],20);record('normal-war-menu-exit-button')
p.dump_log('finish-message-protocol.json')
