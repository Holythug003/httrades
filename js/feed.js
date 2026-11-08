/* Deriv market data over the public WebSocket (ticks + 1-minute candles); simulated fallback when offline */
let live=false,ws;const seenC={};
const SYM={};for(const k in M)SYM[M[k].s]=k;
const C={},G=60,bucket=t=>Math.floor(t/G)*G;
function seed(k){const m=M[k],a=[];let c=m.p,t=bucket(Date.now()/1000);for(let i=0;i<120;i++){const o=c*(1+(Math.random()-.5)*m.v*3);a.unshift({t:t-i*G,o,h:Math.max(o,c)*(1+Math.random()*m.v),l:Math.min(o,c)*(1-Math.random()*m.v),c});c=o}return a}
for(const k in M)C[k]=seed(k);
/* simulated history so charts and analysis have data offline */
{const now=Date.now()/1000;for(const k in M){const m=M[k],a=new Array(HMAX),t=new Array(HMAX);let p=m.p;for(let i=HMAX-1;i>=0;i--){a[i]=p;t[i]=now-(HMAX-1-i);p/=1+(Math.random()+Math.random()-1)*m.v}H[k]=a;TS[k]=t}}
function onTick(k,p,t){M[k].p=p;H[k].push(p);TS[k].push(t);if(H[k].length>HMAX){H[k].shift();TS[k].shift()}
 const a=C[k],b=bucket(t),l=a.at(-1);
 if(l.t===b){l.c=p;l.h=Math.max(l.h,p);l.l=Math.min(l.l,p)}else{a.push({t:b,o:l.c,h:Math.max(l.c,p),l:Math.min(l.c,p),c:p});if(a.length>240)a.shift()}
 engineTick(k,p);TICKS.forEach(fn=>fn(k,p))}

function sim(){if(live)return;const t=Date.now()/1000;for(const k in M)onTick(k,M[k].p*(1+(Math.random()+Math.random()-1)*M[k].v),t)}
function connect(){
 try{ws=new WebSocket('wss://api.derivws.com/trading/v1/options/ws/public')}catch(e){return}
 ws.onopen=()=>{for(const k in M){ws.send(JSON.stringify({ticks:M[k].s,subscribe:1}));ws.send(JSON.stringify({ticks_history:M[k].s,end:'latest',count:120,style:'candles',granularity:G}));ws.send(JSON.stringify({ticks_history:M[k].s,end:'latest',count:HMAX,style:'ticks'}))}};
 ws.onmessage=e=>{const d=JSON.parse(e.data),k=d.tick?SYM[d.tick.symbol]:d.echo_req&&SYM[d.echo_req.ticks_history];if(!k)return;
  if(d.tick){const p=+d.tick.quote;if(!isFinite(p)||p<=0)return;live=true;if(d.tick.pip_size!=null)M[k].d=+d.tick.pip_size;if(!seen[k]){seen[k]=1;H[k]=[];TS[k]=[]}if(!seenC[k]){seenC[k]=1;C[k]=[{t:bucket(d.tick.epoch),o:p,h:p,l:p,c:p}]}onTick(k,p,d.tick.epoch)}
  else if(d.candles){if(!d.candles.length)return;seenC[k]=1;C[k]=d.candles.map(x=>({t:x.epoch,o:x.open,h:x.high,l:x.low,c:x.close}))}
  else if(d.history){const pr=(d.history.prices||[]).map(Number);if(!pr.length||!pr.every(v=>isFinite(v)&&v>0))return;seen[k]=1;H[k]=pr;const tm=(d.history.times||[]).map(Number);TS[k]=tm.length===pr.length?tm:pr.map((_,i)=>Date.now()/1000-(pr.length-1-i));if(d.pip_size!=null)M[k].d=+d.pip_size}};
 ws.onerror=()=>{};ws.onclose=()=>{live=false;setTimeout(connect,5000)}}
connect();
setInterval(()=>{sim();tickUI();render()},1000);
/* Back from Deriv's login page */
if(dvFresh===true){overlay('Signing you in…','Connecting to your Deriv account.');go('app');toast('Logged in with Deriv. You are on '+(DV.virt()?'your demo account ':'account ')+DV.id+'.')}
else if(dvFresh==='fail')toast('Deriv login was cancelled or did not return an account. Please try again.');
