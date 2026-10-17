// Runs in the renderer: court actors and the office roster mount after art loads.
// Waiting for DOM readiness avoids treating asynchronous entry as a missing UI.
async function waitForSelector(selector,timeout=20000){
 if(document.querySelector(selector))return;
 await new Promise((resolve,reject)=>{
  const observer=new MutationObserver(()=>{if(document.querySelector(selector)){clearTimeout(timer);observer.disconnect();resolve();}});
  const timer=setTimeout(()=>{observer.disconnect();reject(Error(`界面等待超时：${selector}`));},timeout);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true});
 });
}
module.exports={waitForSelector};
