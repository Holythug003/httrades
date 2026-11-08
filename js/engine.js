/* Contract engine: contract types, open contracts, bots.
   Logged in with Deriv -> contracts are bought on the user's Deriv account from this page (js/deriv.js).
   Guests -> contracts are simulated and settled on the next ticks. */
const TT={rise:['Rise',()=>.5,(e,x)=>x>e],fall:['Fall',()=>.5,(e,x)=>x<e],even:['Even',()=>.5,(e,x,d)=>d%2===0],odd:['Odd',()=>.5,(e,x,d)=>d%2===1],
 over:['Over',b=>(9-b)/10,(e,x,d,b)=>d>b],under:['Under',b=>b/10,(e,x,d,b)=>d<b],match:['Matches',()=>.1,(e,x,d,b)=>d===b],differ:['Differs',()=>.9,(e,x,d,b)=>d!==b]};
const GR=[['rf','Rise/Fall'],['eo','Even/Odd'],['ou','Over/Under'],['md','Matches/Differs']];
const SIDES={rf:['rise','fall'],eo:['even','odd'],ou:['over','under'],md:['match','differ']};
const grp=t=>Object.keys(SIDES).find(g=>SIDES[g].includes(t))||'rf';
const HAS_B=['over','under','match','differ'],OPEN=[];let acct='demo';
const JOURNAL=[];function journal(m){JOURNAL.unshift({t:Date.now(),m});if(JOURNAL.length>300)JOURNAL.length=300}
const digit=(k,p)=>+p.toFixed(M[k].d).slice(-1);
const payout=(t,b)=>{const p=TT[t][1](b);return p>0&&p<1?0.95/p:0}; /* simulated payout: 5% margin over the win probability */
const label=c=>c.t==='accu'?`Accumulator ${Math.round(c.g*100)}%`:TT[c.t][0]+(HAS_B.includes(c.t)?' '+c.b:'');
/* Execution speed (dock toggle): slow waits for each contract to finish, fast allows up to 3 at once */
let EXEC=store.get('exec','slow');
/* Accumulators (simulated): barrier distance and tick cap by growth rate */
const ACC_T={1:230,2:120,3:85,4:65,5:50};
/* range half-width from recent tick moves, so roughly growth-rate × 1.2 of ticks break out (simulation only; Deriv sets the real barriers) */
const accDist=(k,g)=>{const h=H[k].slice(-501),a=[];for(let i=1;i<h.length;i++)a.push(Math.abs(h[i]-h[i-1]));a.sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*(1-1.2*g)))]||M[k].p*M[k].v};
function place(o){
 if(!o||!o.k||!M[o.k]){toast('Unknown market. Re-select the symbol.');return null}
 o.s=+(+o.s).toFixed(2);
 if(o.t==='accu'){o.g=+o.g;o.tp=+o.tp||0;if(!(o.g>0&&o.g<=0.05)){toast('Growth rate must be between 1% and 5%.');return null}}
 else{o.n=Math.max(1,Math.min(10,+o.n||1));if(HAS_B.includes(o.t))o.b=+o.b;if(!payout(o.t,o.b)){toast('That barrier is not valid for this contract.');return null}}
 if(!(o.s>=.35)){toast('The minimum stake is 0.35.');return null}
 if(DV.on()){if(!DV.ready()){toast('Still connecting to your Deriv account. Try again in a moment.');return null}
  if(DV.bal!=null&&o.s>DV.bal){toast('Stake is higher than your balance.');return null}return DV.buy(o)}
 if(o.s+OPEN.reduce((a,c)=>a+c.s,0)>bal){toast('Stake must be within your balance.');return null}
 const c={...o,e:M[o.k].p,l:o.n,id:Date.now()+Math.random(),t0:Date.now()};
 if(o.t==='accu'){c.val=o.s;c.ticks=0;c.max=ACC_T[Math.round(o.g*100)]||85;c.dist=accDist(o.k,o.g);c.lo=c.e-c.dist;c.hi=c.e+c.dist}
 OPEN.push(c);return c}
function record(c,r){trades.unshift({t:Date.now(),m:M[c.k].n,d:label(c),s:c.s,p:r,src:c.src||'Manual'});if(trades.length>500)trades.length=500;
 pl=+(pl+r).toFixed(2);saveDemo();if(typeof tradeResult==='function'){try{tradeResult(c,r)}catch(e){}}c.cb&&c.cb(r)}
function settle(c,p,early){let r;
 if(c.t==='accu')r=+(c.val-c.s).toFixed(2);
 else if(early!=null)r=early;
 else{const win=TT[c.t][2](c.e,p,digit(c.k,p),c.b);r=win?+(c.s*(payout(c.t,c.b)-1)).toFixed(2):-c.s}
 bal=+(bal+r).toFixed(2);record(c,r)}
/* Close a contract now: accumulators (both modes) and Rise/Fall sell conditions */
function sellNow(c){if(c.remote)return DV.sell(c);const i=OPEN.indexOf(c);if(i<0)return;OPEN.splice(i,1);
 if(c.t==='accu')settle(c,M[c.k].p);else settle(c,M[c.k].p,simValue(c))}
const simValue=c=>{const win=TT[c.t][2](c.e,M[c.k].p,digit(c.k,M[c.k].p),c.b),done=(c.n-c.l)/c.n;return win?+(c.s*(payout(c.t,c.b)-1)*done).toFixed(2):+(-c.s*Math.max(.2,1-done)).toFixed(2)};
function engineTick(k,p){
 for(let i=OPEN.length-1;i>=0;i--){const c=OPEN[i];if(c.remote||c.k!==k)continue;
  if(c.t==='accu'){if(p<c.lo||p>c.hi){c.val=0;OPEN.splice(i,1);settle(c,p);continue}
   c.ticks++;c.val=+(c.val*(1+c.g)).toFixed(2);c.lo=p-c.dist;c.hi=p+c.dist;
   if((c.tp&&c.val-c.s>=c.tp)||c.ticks>=c.max){OPEN.splice(i,1);settle(c,p)}continue}
  if(--c.l<=0){OPEN.splice(i,1);settle(c,p);continue}
  if(c.sellAt&&(c.t==='rise'||c.t==='fall')&&simValue(c)>=c.sellAt){OPEN.splice(i,1);settle(c,p,simValue(c))}}
 for(const id in BOTS)botTick(BOTS[id],k)}
const BOTS={},DEF={m:'V10',t:'rise',b:5,s:1,n:5,entry:'always',k:3,tp:0,sl:0,mart:2,max:0,mo:false,rec:false,hedge:false,ct:'both',maxStake:0,rerr:true,sellAt:0,cint:60,fid:'',sm:'fixed',runFor:0};
/* stake modes: fixed | mart (x multiplier after a loss) | dal (+1 unit after a loss, -1 after a win) | rev (x multiplier after a win, reset after 3) */
const stakeOf=(b,c)=>{const m=c.sm||(c.mo?'mart':'fixed');let s=c.s;if(m==='mart'||(c.mo&&m==='fixed'))s=c.s*Math.pow(c.mart,b.loss);else if(m==='dal')s=c.s*(1+b.dl);else if(m==='rev')s=c.s*Math.pow(c.mart,b.ws);return +s.toFixed(2)};
const newBot=(id,c,name)=>BOTS[id]={id,c,name,on:false,hold:0,loss:0,dl:0,ws:0,n:0,w:0,pl:0,rr:0,run:0};
newBot('main',{...DEF},'My bot');
/* Auto Trader cards plug their own conditions in here: COND[fid]() -> true when the card should trade */
const COND={};
function rsi(k,n=14){const h=H[k].slice(-(n+1));if(h.length<n+1)return null;let g=0,l=0;for(let i=1;i<h.length;i++){const d=h[i]-h[i-1];d>0?g+=d:l-=d}return l===0?100:100-100/(1+g/l)}
function entryOK(c){const h=H[c.m];switch(c.entry){
 case'up':case'down':{const s=h.slice(-c.k-1);return s.length>c.k&&s.every((v,i)=>!i||(c.entry==='up'?v>s[i-1]:v<s[i-1]))}
 case'rsiLow':{const r=rsi(c.m);return r!==null&&r<30}
 case'rsiHigh':{const r=rsi(c.m);return r!==null&&r>70}
 case'fn':return !!(COND[c.fid]&&COND[c.fid]());
 default:return true}}
const OPP={rise:'fall',fall:'rise',even:'odd',odd:'even',over:'under',under:'over',match:'differ',differ:'match'};
function botTick(b,k){const fast=EXEC==='fast'&&!b.c.hedge;if(!b.on||b.c.m!==k||(b.hold&&!(fast&&b.hold<3))||!entryOK(b.c))return;
 const c=b.c,rn=b.run;let t=c.t;if(c.rec&&b.loss%2)t=OPP[t];
 let s=c.hedge?c.s:stakeOf(b,c);if(c.maxStake>0)s=Math.min(s,c.maxStake);
 for(const x of c.hedge?[t,OPP[t]]:[t]){
  const o=place({k,t:x,b:c.b,s,n:c.n,src:b.name,sellAt:c.sellAt||0,
   onErr:()=>{if(rn!==b.run||!b.on)return;if(b.hold>0)b.hold--;if(!c.rerr){setBot(b.id,false);toast(b.name+' stopped: Deriv did not accept the trade.')}},
   cb:r=>{if(rn!==b.run)return;b.rr+=r;b.pl=+(b.pl+r).toFixed(2);b.n++;if(r>0)b.w++;
    journal(`${b.name}: ${r>0?'Won':'Lost'} ${f(Math.abs(r))} ${curTxt()} on ${M[k].n}`);
    if(--b.hold<=0){b.hold=0;const won=b.rr>0;b.loss=won?0:b.loss+1;b.dl=won?Math.max(0,b.dl-1):b.dl+1;b.ws=won?(b.ws+1)%3:0;b.rr=0}
    if((c.tp&&b.pl>=c.tp)||(c.sl&&b.pl<=-c.sl)||(c.max&&b.n>=c.max)){setBot(b.id,false);journal(b.name+': stopped, limit reached');toast(`${b.name} stopped: ${c.tp&&b.pl>=c.tp?'take profit reached':c.max&&b.n>=c.max?'trade limit reached':'stop loss reached'}.`)}}});
  if(o)b.hold++;else{if(!c.rerr)b.on=false;break}}}
function setBot(id,on){const b=BOTS[id];if(on&&DV.on()&&!DV.ready()){toast('Still connecting to your Deriv account. Try again in a moment.');return}if(on&&acct==='real'&&!confirmReal())return;
 b.on=on;b.hold=0;b.run++;if(on){b.t0=Date.now();b.n=b.w=b.loss=b.dl=b.ws=0;b.pl=b.rr=0}journal((on?'Started: ':'Stopped: ')+b.name+(on?(DV.on()?' on '+DV.id:' (guest demo)'):''));render()}
