from PIL import Image,ImageDraw
from pathlib import Path
import json,subprocess
root=Path(__file__).resolve().parents[1]
rows=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {RANDOM_BEAUTY_ART} from './src/random-beauties-data.mjs'; console.log(JSON.stringify(RANDOM_BEAUTY_ART))"],cwd=root,text=True))
sheet=Image.new('RGB',(1500,1640),'#e8e2d5');draw=ImageDraw.Draw(sheet)
for i,r in enumerate(rows):
 x=(i%5)*300;y=(i//5)*410
 for xx in range(0,300,20):
  for yy in range(0,380,20):
   if (xx//20+yy//20)%2==0:draw.rectangle((x+xx,y+yy,x+xx+19,y+yy+19),fill='#f9f7f0')
 im=Image.open(root/r['asset']).convert('RGBA');im.thumbnail((284,375));sheet.paste(im,(x+(300-im.width)//2,y+(380-im.height)//2),im);draw.text((x+8,y+390),f'{i+1:02} {r["id"]}',fill='#302818')
sheet.save(root/'outputs/random-beauties/contact-sheet.jpg')
