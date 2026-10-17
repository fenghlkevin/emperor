from live_flow import *
exec((ROOT/'menus_continue.py').read_text().split('C=p.u32(W+0x28);')[0])
C=p.u32(W+0x14);p.call(0x23c34,[C,p.u32(C+0xa)],20);record('normal-no-more-units-button')
message();record('normal-commander-instructions-close')
C=p.u32(W+0x3e);assert get(C+0xb2,2,False)>0;p.call(0x71e07,[C,p.u32(C+0x4a)],20);record('normal-first-eligible-commander-button')
message();record('normal-final-deployment-message-close')
message();record('normal-return-message-close')
M=p.u32(W+0x10);assert M;p.call(0x86468,[M,p.u32(M+0x26)],20);record('normal-war-menu-exit-button')
p.dump_log('finish-menu-protocol.json')
