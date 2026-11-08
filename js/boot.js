/* Boot loader: candles draw in as the workspace initialises */
/* A workspace link (#/quick-bot etc.) skips the landing page */
const startView=()=>DV.on()||/^#\/./.test(location.hash)?'app':'landing';
/* backdrop ticker on the loading screen */
$('btk').innerHTML=[0,1].map(()=>Object.keys(M).map(k=>`<span><b style="color:${M[k].c}">${M[k].sh}</b> ${M[k].p.toFixed(M[k].d)} ${Math.random()>.5?'<em class="u">▲</em>':'<em class="d">▼</em>'}</span>`).join('')).join('');
const steps=['Initialising workspace','Connecting to market data','Loading bot engine','Applying demo-account safeguards','Ready'];
const bc=(()=>{const a=[];let c=100;for(let i=0;i<48;i++){const o=c;c=o*(1+Math.sin(i/5)*.004+(Math.random()-.42)*.012);a.push({o,c,h:Math.max(o,c)*(1+Math.random()*.005),l:Math.min(o,c)*(1-Math.random()*.005)})}return a})();
const bR=[Math.min(...bc.map(x=>x.l)),Math.max(...bc.map(x=>x.h))];
const t0=performance.now();let raf=requestAnimationFrame(function boot(now){
 if(view!=='boot')return;const p=Math.min(Math.max((now-t0)/3600,0),1);
 $('bp').style.width=p*100+'%';$('bpc').textContent=Math.round(p*100)+'%';$('bst').textContent=steps[Math.min(Math.floor(p*steps.length),steps.length-1)];
 $('bpx').textContent=(642.1+bc[Math.max(0,Math.ceil(p*bc.length)-1)].c*0.012).toFixed(2);candles($('bcv'),bc.slice(0,Math.max(1,Math.ceil(p*bc.length))),{axis:false,n:bc.length,r:bR});
 if(p<1)raf=requestAnimationFrame(boot);else setTimeout(()=>view==='boot'&&go(startView()),450)});
$('skip').onclick=()=>{cancelAnimationFrame(raf);go(startView())};
