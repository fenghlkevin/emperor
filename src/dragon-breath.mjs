// Deform only the sleeping figure: the face, bed frame and room stay still.
export function animateDragonBreath(canvas, image, duration=3000){
 const x=744,y=357,width=262,height=95;
 canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');
 ctx.drawImage(image,x,y,width,height,0,0,width,height);
 const original=ctx.getImageData(0,0,width,height),frame=ctx.createImageData(width,height);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return ()=>{};
 const start=performance.now();let request;
 const draw=now=>{
  const elapsed=Math.min(duration,now-start);
  // One slow, complete breath with a relaxed, longer exhalation.
  const t=elapsed/duration;
  const lift=t<.42?(1-Math.cos(Math.PI*t/.42))/2:(1+Math.cos(Math.PI*(t-.42)/.58))/2;
  for(let row=0;row<height;row++)for(let col=0;col<width;col++){
   const edge=Math.sin(Math.PI*col/(width-1))**2*Math.sin(Math.PI*row/(height-1))**2;
   const chest=Math.exp(-(((col-54)/38)**2+((row-38)/28)**2));
   const quilt=Math.exp(-(((col-121)/76)**2+((row-51)/33)**2));
   const sourceY=Math.min(height-1,row+lift*edge*(2.4*chest+4*quilt));
   const low=Math.floor(sourceY),high=Math.min(height-1,low+1),mix=sourceY-low;
   const dest=(row*width+col)*4,a=(low*width+col)*4,b=(high*width+col)*4;
   for(let k=0;k<4;k++)frame.data[dest+k]=original.data[a+k]*(1-mix)+original.data[b+k]*mix;
  }
  ctx.putImageData(frame,0,0);
  if(elapsed<duration)request=requestAnimationFrame(draw);
 };
 request=requestAnimationFrame(draw);
 return ()=>{cancelAnimationFrame(request);ctx.putImageData(original,0,0);};
}
