import fs from 'node:fs';
const faces=[
'long narrow clean-shaven face, high forehead, large gentle almond eyes, small straight nose, pale complexion',
'broad square face, heavy jaw, short thick beard, close-set calm eyes, flat broad nose, bronze complexion',
'rounded full cheeks, short chin, fine mustache, cheerful crescent eyes, small rounded nose, warm medium complexion',
'lean angular diamond face, deep-set narrow eyes, prominent nose, short pointed goatee, olive complexion',
'wide triangular face, high cheekbones, bushy brows, full black beard, broad nose, dark tan complexion',
'soft oval youthful face, widely spaced bright eyes, straight thick brows, clean-shaven, fair complexion',
'long rectangular lined face, drooping eyes, sparse gray chin beard, high hooked nose, warm tan complexion',
'compact round elderly face, heavy white eyebrows, short white boxed beard, broad rounded nose',
'long heart-shaped face, asymmetric thoughtful brows, narrow eyes, thin long mustache, small pointed beard',
'wide rugged face, prominent ears, deep-set steady eyes, coarse black beard, sun-dark complexion',
'powerful broad square clean-shaven face, thick horizontal brows, deep-set clear eyes, medium olive complexion',
'slender youthful angular face, bright narrow eyes, small scar on right brow, thin mustache, light tan complexion',
'round powerful face, full curled short beard, thick eyebrows, broad nose, bronze complexion',
'long hawk-like face, high cheekbones, narrow watchful eyes, hooked nose, neat pointed beard, dark tan complexion',
'wide rectangular face, large steady eyes, coarse gray beard, broken-looking broad nose, veteran sun-dark skin',
'lean oval clean-shaven face, high arched brows, calm almond eyes, straight nose, pale warm complexion',
'broad diamond face, heavy black mustache, angular chin, narrow deep-set eyes, strong neck, olive complexion',
'long lined face, thick gray eyebrows, long divided gray beard, gentle steady eyes, mature bronze complexion',
'compact triangular face, short sparse mustache, small lively eyes, wide cheekbones, medium warm complexion',
'large oval face, bushy black beard, heavy brows, round resolute eyes, broad strong jaw, dark brown tan complexion'
];
const colors=['sage green','slate blue','warm ivory','ochre brown','deep plum','gray green','muted burgundy','indigo','rust brown','pale blue'];
const plan=faces.map((identity,i)=>{const military=i>=10,id=`random-${military?'military':'civil'}-${i%10+1}`;return {id,name:`本朝${military?'武将':'文臣'}模板${i%10+1}`,role:military?'武将':'文职',artRole:military?'military':'civil',age:25+(i*7)%36,identity,clothing:military?`${colors[i%10]} practical surcoat over dark steel historical lamellar armor, ${i%2?'dark military cap':'simple helmet'}, black boots, ${['straight sword','long spear','cavalry bow','command baton','sheathed saber'][i%5]}, restrained natural shoulder armor`:`${colors[i%10]} layered Chinese scholar robe, ${i%2?'soft black scholar headcloth':'folded dark scholar cap'}, black cloth shoes, ${['bamboo scroll','bound manuscript','writing brush and scroll','ivory memorial tablet','folded state papers'][i%5]}`,reviewed:true,status:Object.fromEntries(['full','avatar','court'].map(v=>[v,fs.existsSync(`assets/officials/random/${id}/${v}.png`)]))};});
fs.writeFileSync('docs/official-art/random-characters.json',JSON.stringify(plan,null,2));console.log('20 random templates planned: 10 civil and 10 military');
