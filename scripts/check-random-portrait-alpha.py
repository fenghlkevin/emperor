"""Check real transparency, edge clearance and silhouette occupancy of active art."""
from pathlib import Path
from PIL import Image
import json,subprocess
root=Path(__file__).resolve().parents[1]
raw=subprocess.check_output(['node','--input-type=module','-e',"import {RANDOM_BEAUTY_ART} from './src/random-beauties-data.mjs'; console.log(JSON.stringify(RANDOM_BEAUTY_ART))"],cwd=root,text=True)
rows=json.loads(raw);report=[]
for row in rows:
 im=Image.open(root/row['asset']);alpha=im.getchannel('A') if im.mode=='RGBA' else None
 if alpha is None:raise ValueError(row['id']+' missing alpha')
 hist=alpha.histogram();zero=hist[0]/(im.width*im.height)
 border=[alpha.getpixel((x,y)) for x in range(im.width) for y in (0,im.height-1)]+[alpha.getpixel((x,y)) for y in range(im.height) for x in (0,im.width-1)]
 r={'id':row['id'],'size':im.size,'transparentFraction':round(zero,3),'opaqueBorderPixels':sum(a>10 for a in border),'bounds':alpha.point(lambda a:255 if a>20 else 0).getbbox()};report.append(r)
 if zero<.15 or r['opaqueBorderPixels']>len(border)*.02:raise ValueError(str(r))
(root/'outputs/random-beauties/alpha-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('20 PNG alpha channels passed')
