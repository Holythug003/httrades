/* Signal AI, Bulk Trader, Manual Trader, Copy Trading */

/* ---------- shared statistics ---------- */
const lastDigits=(k,n)=>H[k].slice(-n).map(v=>digit(k,v));
const digitPct=(k,n)=>{const ds=lastDigits(k,n),c=Array(10).fill(0);ds.forEach(d=>c[d]++);return{ds,pct:c.map(v=>ds.length?v/ds.length*100:0)}};
const upPct=(k,n)=>{const s=H[k].slice(-n-1);let u=0;for(let i=1;i<s.length;i++)if(s[i]>s[i-1])u++;return s.length>1?u/(s.length-1)*100:50};
/* Best contract for a strategy on one market, from observed frequencies over n ticks. edge = observed win rate - break-even rate */
function bestFor(strat,k,n){const{pct}=digitPct(k,n),be=t=>TT[t][1](0)*100,c=[];
 if(strat==='eo'){const ev=pct.filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0);c.push({t:'even',w:ev,be:50},{t:'odd',w:100-ev,be:50})}
 else if(strat==='rf'){const u=upPct(k,n);c.push({t:'rise',w:u,be:50},{t:'fall',w:100-u,be:50})}
 else if(strat==='ou'){for(let b=0;b<9;b++)c.push({t:'over',b,w:pct.slice(b+1).reduce((a,x)=>a+x,0),be:(9-b)*10});for(let b=1;b<10;b++)c.push({t:'under',b,w:pct.slice(0,b).reduce((a,x)=>a+x,0),be:b*10})}
 else{const mx=Math.max(...pct),mn=Math.min(...pct);c.push({t:'match',b:pct.indexOf(mx),w:mx,be:10},{t:'differ',b:pct.indexOf(mn),w:100-mn,be:90})}
 c.forEach(x=>{x.k=x.k||k;x.edge=x.w-x.be;x.b=x.b??5});return c.sort((a,b)=>b.edge-a.edge)[0]}
const sigTxt=s=>`${TT[s.t][0]}${HAS_B.includes(s.t)?' '+s.b:''}`;
function tradeSignal(s){Object.assign(BOTS.main.c,{m:s.k,t:s.t,b:s.b,n:1,ct:'both',entry:'always'});if(s.t==='rise'||s.t==='fall')BOTS.main.c.n=5;BOTS.main.name='Signal: '+sigTxt(s);saveBots();toast(`Quick Bot set to ${sigTxt(s)} on ${M[s.k].n}. Review it, then press Run.`);nav('Quick Bot')}

/* ---------- Signal AI ---------- */
const SA={strat:'ou',watch:'off',n:3000,min:60,res:null,busy:false,watching:false,log:[]};
const saLog=(tag,m)=>{SA.log.push(`[${tag}] ${m}`);if(SA.log.length>400)SA.log.shift()};
TICKS.push((k,p)=>{if(page==='Signal AI'&&view==='app'&&Math.random()<.25)saLog('TICK',`${M[k].s} ${p.toFixed(M[k].d)} · last digit ${digit(k,p)}`)});
async function saRun(btn){if(SA.busy)return;SA.busy=true;busy(btn,true,'Analysing…');SA.res=null;
 const mk=SA.watch==='off'?Object.keys(M):[SA.watch];saLog('INFO',`Analysing ${mk.length} market${mk.length>1?'s':''} · ${SA.n} ticks each · strategy ${GR.find(g=>g[0]===SA.strat)[1]}`);
 const all=[];for(const k of mk){await wait(mk.length>1?90:400);const s=bestFor(SA.strat,k,SA.n);all.push(s);saLog('SCAN',`${M[k].n}: best ${sigTxt(s)} · observed ${s.w.toFixed(1)}% · break-even ${s.be}% · edge ${s.edge>=0?'+':''}${s.edge.toFixed(1)}%`)}
 all.sort((a,b)=>b.edge-a.edge);const top=all.filter(s=>s.w>=SA.min);SA.res={top:top[0]||null,list:all.slice(0,5),t:Date.now()};
 saLog(top.length?'OK':'WARN',top.length?`Signal: ${sigTxt(top[0])} on ${M[top[0].k].n} (${top[0].w.toFixed(1)}%)`:`No contract reached ${SA.min}% observed win rate`);
 SA.busy=false;busy(btn,false);render()}
Object.assign(PG,{
'Signal AI':{html:()=>`<div class="sai"><canvas id="sacv" aria-hidden="true"></canvas>
 <div class="saw"><h2>Signal AI</h2>
  <div class="sag"><label>Select Strategy<select id="sa-s">${opt([['ou','Over & Under'],['eo','Even & Odd'],['rf','Rise & Fall'],['md','Matches & Differs']],SA.strat)}</select></label>
  <label>Watch Market<select id="sa-w"><option value="off">— Off (scan all) —</option>${mkOpts(SA.watch)}</select></label>
  <label>Ticks<input id="sa-n" type="number" min="100" max="${HMAX}" step="100" value="${SA.n}"></label>
  <label>Min Confidence %<input id="sa-c" type="number" min="10" max="99" step="1" value="${SA.min}"></label></div>
  <div class="salt" id="salt">Latest Tick: --</div>
  <div class="sab"><button class="btn sago" id="sa-go">Analyse</button><button class="btn saw2" id="sa-wt">Watch live</button></div>
  <div class="sares" id="sares"></div>
  <p class="sanote">Signals are observed frequencies from recent ticks. Deriv's synthetic indices are random, so past ticks do not predict the next one.</p></div></div>`,
 init(){const rd=()=>{SA.strat=$('sa-s').value;SA.watch=$('sa-w').value;SA.n=Math.min(HMAX,Math.max(100,+$('sa-n').value||3000));SA.min=Math.min(99,Math.max(10,+$('sa-c').value||60))};
  $('sacv').parentElement.onchange=rd;$('sa-go').onclick=e=>{rd();saRun(e.currentTarget)};
  $('sa-wt').onclick=()=>{rd();SA.watching=!SA.watching;$('sa-wt').textContent=SA.watching?'Stop watching':'Watch live';saLog('INFO',SA.watching?'Live watch on: re-analysing every 10 seconds':'Live watch off');if(SA.watching)saRun($('sa-go'))};
  $('sares').onclick=e=>{if(e.target.closest('#sa-tr')&&SA.res&&SA.res.top)tradeSignal(SA.res.top)};
  saLog('INFO','Signal AI ready. Market feed: '+(live?'live Deriv ticks':'simulated (Deriv not connected)'));
  const cv=$('sacv');let y=0;const draw=()=>{if(page!=='Signal AI'||!$('sacv'))return;const s=setup(cv);if(s){const{x,w,h}=s;x.fillStyle='#020a04';x.fillRect(0,0,w,h);x.font='15px "JetBrains Mono",Consolas,monospace';const lh=24,rows=Math.ceil(h/lh)+1,L=SA.log;
    for(let r=0;r<rows;r++){let line='',i=r;while(line.length<w/8&&L.length){const t=L[(L.length-1-((i+Math.floor(y))%L.length)+L.length)%L.length];line+=t+'   ';i+=rows}x.fillStyle=/\[(WARN|ERR)/.test(line.slice(0,8))?'#c8a400':'#1fa83a';x.globalAlpha=.75;x.fillText(line,0,r*lh+16)}x.globalAlpha=1}
   y+=.02;requestAnimationFrame(draw)};draw();
  PG['Signal AI'].iv=setInterval(()=>{if(SA.watching&&!SA.busy&&page==='Signal AI')saRun($('sa-go'))},10000)},
 leave(){clearInterval(PG['Signal AI'].iv);SA.watching=false},
 tick(){const k=SA.watch==='off'?(SA.res&&SA.res.top?SA.res.top.k:'V100'):SA.watch,m=M[k];$('salt').innerHTML=`Latest Tick: <b>${m.p.toFixed(m.d)}</b> <small>${m.sh} · digit ${digit(k,m.p)}</small>`;
  const r=SA.res,h=!r?'':r.top?`<div class="sasig"><small>Top signal · ${new Date(r.t).toLocaleTimeString()}</small><b>${sigTxt(r.top)} on ${M[r.top.k].n}</b><div class="sacf"><i style="width:${r.top.w}%"></i></div><span>Observed ${r.top.w.toFixed(1)}% · break-even ${r.top.be}% · edge ${r.top.edge>=0?'+':''}${r.top.edge.toFixed(1)}%</span><button class="btn bg" id="sa-tr">Trade this signal</button></div>`
   :`<div class="sasig none"><b>No signal above ${SA.min}%</b><span>Best seen: ${sigTxt(r.list[0])} on ${M[r.list[0].k].n} at ${r.list[0].w.toFixed(1)}%. Lower Min Confidence or try another strategy.</span></div>`;
  if($('sares').dataset.h!==h){$('sares').innerHTML=h;$('sares').dataset.h=h}}},

/* ---------- Bulk Trader ---------- */
'Bulk Trader':{st:{m:'V100',t:'eo',b:5,n:1000,ticks:1,s:.5,bulk:1,auto:false,th:60,rounds:5,done:0},
 html:()=>{const S=PG['Bulk Trader'].st;return `<div class="bulk">
 <div class="g2s">${LB('Market',`<select id="bk-m">${mkOpts(S.m)}</select>`)}${LB('Trade type',`<select id="bk-t">${opt(GR.map(g=>[g[0],g[1]]),S.t)}</select>`)}</div>
 <div class="g2s">${LB('Number of ticks',`<input id="bk-n" type="number" min="50" max="${HMAX}" step="50" value="${S.n}">`)}<div id="bk-bw">${LB('Prediction',`<select id="bk-b">${opt(DG,S.b)}</select>`)}</div></div>
 <div class="bkh"><div><small>CURRENT TICK</small><div class="bkp" id="bk-p"></div></div><button class="aisc" id="bk-ai">${ICO('M5 4h14v16H5zM9 8h6M9 12h6M9 16h3')}AI SCANNER</button></div>
 <div class="dcs" id="bk-dc"></div><div class="eos" id="bk-eo"></div>
 <div class="g3s">${LB('Ticks',`<input id="bk-tk" type="number" min="1" max="10" value="${S.ticks}">`)}${LB('Stake',`<input id="bk-s" type="number" min=".35" step=".01" value="${S.s}">`)}${LB('No. of bulk trades',`<input id="bk-bk" type="number" min="1" max="20" value="${S.bulk}">`)}</div>
 <div class="bkat"><span id="bk-as"></span><button class="tbn" id="bk-at">${ICO('M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3')}Auto trader</button></div>
 <div class="bkb" id="bk-bb"></div><p class="qsum" id="bk-sum"></p></div>`},
 init(){const S=PG['Bulk Trader'].st,rd=()=>{S.m=$('bk-m').value;S.n=Math.min(HMAX,Math.max(50,+$('bk-n').value||1000));S.b=+$('bk-b').value;S.ticks=Math.min(10,Math.max(1,+$('bk-tk').value||1));S.s=Math.max(.35,+$('bk-s').value||.5);S.bulk=Math.min(20,Math.max(1,+$('bk-bk').value||1))};
  $('pg').onchange=e=>{PGH(e);if(e.target.id==='bk-t'){S.t=e.target.value;$('bk-bb').dataset.h=''}rd();render()};
  $('bk-bb').onclick=e=>{const b=e.target.closest('[data-side]');if(!b)return;rd();PG['Bulk Trader'].buy(b.dataset.side)};
  $('bk-ai').onclick=e=>{const btn=e.currentTarget;busy(btn,true,'Scanning…');setTimeout(()=>{busy(btn,false);const L=Object.keys(M).map(k=>bestFor(S.t,k,S.n)).sort((a,b)=>b.edge-a.edge);
   const d=$('gd');d.innerHTML=`<h3>AI Scanner · ${GR.find(g=>g[0]===S.t)[1]}</h3><p>Best contract on each market over the last ${S.n} ticks, ranked by edge over the break-even rate.</p><div class="scl">${L.map(s=>`<button data-sc="${s.k}" data-t="${s.t}" data-b="${s.b}"><b>${M[s.k].n}</b><span>${sigTxt(s)}</span><span>${s.w.toFixed(1)}%</span><span class="${s.edge>=0?'up':'dn'}">${s.edge>=0?'+':''}${s.edge.toFixed(1)}%</span></button>`).join('')}</div><form method="dialog"><button class="btn bo full">Close</button></form>`;
   d.showModal();d.onclick=ev=>{const x=ev.target.closest('[data-sc]');if(!x)return;S.m=x.dataset.sc;if(HAS_B.includes(x.dataset.t))S.b=+x.dataset.b;d.close();nav('Bulk Trader')}},700)};
  $('bk-at').onclick=()=>{const d=$('gd');d.innerHTML=`<h3>Auto trader</h3><p>Buy automatically when one side reaches a share of the last ${S.n} ticks.</p>${LB('Buy when a side is at least (%)',`<input id="at-th" type="number" min="50" max="95" value="${S.th}">`)}${LB('Rounds (one bulk buy per round)',`<input id="at-r" type="number" min="1" max="100" value="${S.rounds}">`)}<div class="dlgb"><button class="btn bo" id="at-x">Cancel</button><button class="btn ${S.auto?'bd':'bg'}" id="at-go">${S.auto?'Stop auto trader':'Start auto trader'}</button></div>`;
   d.showModal();$('at-x').onclick=()=>d.close();$('at-go').onclick=()=>{S.th=+$('at-th').value||60;S.rounds=+$('at-r').value||5;S.auto=!S.auto;S.done=0;d.close();toast(S.auto?'Bulk auto trader started':'Bulk auto trader stopped')}}},
 buy(side){const S=this.st,bid='b'+Date.now()+Math.random();let n=0;for(let i=0;i<S.bulk;i++)if(place({k:S.m,t:side,b:+S.b,s:+S.s,n:+S.ticks||1,src:'Bulk',bid}))n++;if(n)BULKB[bid]={n,done:0,w:0,l:0,net:0,k:S.m,side,b:+S.b,s:+S.s};if(n)toast(`${n} ${TT[side][0]} contract${n>1?'s':''} ${DV.on()?'sent to Deriv':'placed'}`)},
 sides(S){const{pct}=digitPct(S.m,S.n);if(S.t==='eo'){const e=pct.filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0);return[['even',e],['odd',100-e]]}
  if(S.t==='rf'){const u=upPct(S.m,S.n);return[['rise',u],['fall',100-u]]}
  if(S.t==='ou')return[['over',pct.slice(S.b+1).reduce((a,x)=>a+x,0)],['under',pct.slice(0,S.b).reduce((a,x)=>a+x,0)]];
  return[['match',pct[S.b]],['differ',100-pct[S.b]]]},
 tick(){const S=this.st,m=M[S.m],{ds,pct}=digitPct(S.m,S.n),cd=digit(S.m,m.p),srt=[...pct].sort((a,b)=>b-a),col=v=>v===srt[0]?'#e5484d':v===srt[1]?'#2f6fe4':v===srt[2]?'#f28c28':v===srt[9]?'#22ab94':'';
  $('bk-bw').hidden=!HAS_B.includes(SIDES[S.t][0]);$('bk-p').textContent=m.p.toFixed(m.d);
  $('bk-dc').innerHTML=pct.map((v,i)=>`<div class="dc${i===cd?' cur':''}"><span style="${col(v)?`border-color:${col(v)}`:''}">${i}</span><small>${v.toFixed(2)}%</small></div>`).join('');
  const sd=S.t==='rf'?H[S.m].slice(-13).slice(1).map((v,i,a)=>v>(i?a[i-1]:H[S.m].at(-13))?'R':'F'):ds.slice(-12).map(d=>S.t==='eo'?(d%2?'O':'E'):S.t==='ou'?(d>S.b?'O':d<S.b?'U':'='):(d===S.b?'M':'D'));
  $('bk-eo').innerHTML=sd.map(x=>`<span class="${'EROM'.includes(x)&&x!=='O'?'g':x==='O'&&S.t==='ou'?'g':'r'}">${x}</span>`).join('');
  /* buy buttons are built once per contract and only their numbers change, so clicks never land on a rebuilt button */
  const sides=this.sides(S),key=S.t+S.b;if($('bk-bb').dataset.h!==key){$('bk-bb').innerHTML=sides.map(([t],i)=>`<button class="bkx ${i?'r':'g'}" data-side="${t}"><b>${TT[t][0]}${HAS_B.includes(t)?' '+S.b:''}</b><span data-pv="${t}"></span></button>`).join('');$('bk-bb').dataset.h=key}
  sides.forEach(([t,v])=>{const e=$('bk-bb').querySelector(`[data-pv="${t}"]`);if(e)e.textContent=v.toFixed(2)+'%'});
  $('bk-as').textContent=S.auto?`Auto trader on · buys at ≥ ${S.th}% · round ${S.done}/${S.rounds}`:'';
  const T=trades.filter(t=>t.src==='Bulk'),w=T.filter(t=>t.p>0).length;$('bk-sum').textContent=`Bulk trades: ${T.length} · Wins: ${w} · Losses: ${T.length-w} · Net: ${f(T.reduce((a,t)=>a+t.p,0))} ${curTxt()}`;
  if(S.auto&&!OPEN.some(c=>c.src==='Bulk')){const best=sides.sort((a,b)=>b[1]-a[1])[0];if(best[1]>=S.th){S.done++;this.buy(best[0]);if(S.done>=S.rounds){S.auto=false;toast('Bulk auto trader finished its rounds')}}}}},

/* ---------- Manual Trader (DTrader style) ---------- */
'Manual Trader':{st:{k:'V100s',ty:'accu',g:.03,s:10,tp:false,tpv:5,n:5,b:5,type:'area',n2:300,hover:null,pos:true,pick:false},
 html:()=>{const S=PG['Manual Trader'].st;return `<div class="mt">
 <aside class="mtp${S.pos?'':' shut'}" id="mtp"><div class="mph"><b>Open positions</b><button class="ic2" id="mtpx" aria-label="Collapse">${ICO('M5 12h14')}</button></div><div id="mtpl" class="mtpl"></div></aside>
 <section class="mtc"><div class="mkp"><button class="mkb" id="mkb"><span class="mki" id="mki"></span><span><b id="mkn"></b><small id="mkc"></small></span>${ICO('M6 9l6 6 6-6')}</button><div class="mkd" id="mkd" hidden>${MGRP.map(g=>`<p>${g}</p>${MK.filter(x=>M[x[0]].g===g).map(x=>`<button data-mk="${x[0]}">${x[1]}</button>`).join('')}`).join('')}</div></div>
  <div class="ctl">${[['ct-a','Area chart','M3 17l5-6 4 4 8-9v14H3z'],['ct-c','Candles','M7 4v16M17 4v16M5 8h4v7H5zM15 6h4v6h-4z'],['ct-i','Indicators (SMA, EMA, Bollinger)','M3 17l5-6 4 4 8-9'],['ct-d','Download chart image','M12 4v11M7 10l5 5 5-5M4 20h16']].map(b=>`<button class="ic2" id="${b[0]}" title="${b[1]}" aria-label="${b[1]}">${ICO(b[2])}</button>`).join('')}</div>
  <canvas id="mtcv"></canvas><div class="zm"><button class="ic2" id="z-in" aria-label="Zoom in">+</button><button class="ic2" id="z-rs" aria-label="Reset zoom">${ICO('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3')}</button><button class="ic2" id="z-out" aria-label="Zoom out">−</button></div>
  <div class="mdb" id="mdb" aria-label="Last digit frequency">${[0,1,2,3,4,5,6,7,8,9].map(i=>`<div class="mb" data-d="${i}"><svg viewBox="0 0 48 48" aria-hidden="true"><circle class="tr" cx="24" cy="24" r="21"/><circle class="ar" cx="24" cy="24" r="21"/></svg><b>${i}</b><small>--</small></div>`).join('')}</div>
  <div class="mst" id="mst"></div></section>
 <aside class="mtr" id="mtr"></aside></div>`},
 panel(){const S=this.st,TYPES=[['accu','Accumulators'],['rf','Rise/Fall'],['eo','Even/Odd'],['ou','Over/Under'],['md','Matches/Differs']],nm=TYPES.find(t=>t[0]===S.ty)[1];
  if(S.pick)return`<div class="tpk"><p>Trade types</p>${TYPES.map(t=>`<button data-ty="${t[0]}" class="${t[0]===S.ty?'on':''}">${t[1]}</button>`).join('')}</div>`;
  const stake=`<div class="tbx"><p>Stake</p><div class="stk"><button data-st="-">−</button><input id="mt-s" type="number" min=".35" step="1" value="${S.s}"><button data-st="+">+</button><span>${curTxt()}</span></div></div>`;
  if(S.ty==='accu')return`<button class="tth" id="tth">${ICO('M15 6l-6 6 6 6')}<span class="tti">${ICO('M3 17l5-6 4 4 8-9')}</span>${nm}</button>
   <div class="tbx"><p>Growth rate</p><div class="gr">${[1,2,3,4,5].map(g=>`<button data-g="${g}" class="${Math.round(S.g*100)===g?'on':''}">${g}%</button>`).join('')}</div></div>${stake}
   <button type="button" class="mmb" id="mmb" aria-expanded="${S.more?'true':'false'}"><span>Take profit &amp; limits</span><i>▾</i></button><div class="mmx${S.more?' open':''}">
   <div class="tbx row"><label class="ck"><input type="checkbox" id="mt-tp"${S.tp?' checked':''}> Take profit</label><input id="mt-tpv" type="number" min="0.1" step="1" value="${S.tpv}"${S.tp?'':' disabled'}></div>
   <div class="tbx kv2"><span>Max. payout</span><b id="mt-mp"></b><span>Max. ticks</span><b id="mt-mx"></b></div></div><button class="buy" data-buy="accu">${ICO('M4 17l5-5 4 4 7-7')}Buy</button>`;
  const sides=SIDES[S.ty];return`<button class="tth" id="tth">${ICO('M15 6l-6 6 6 6')}<span class="tti">${ICO('M4 12h16')}</span>${nm}</button>
   <div class="tbx"><p>Duration</p><div class="stk"><button data-n="-">−</button><input id="mt-n" type="number" min="1" max="10" value="${S.n}"><button data-n="+">+</button><span>ticks</span></div></div>
   ${HAS_B.includes(sides[0])?`<div class="tbx"><p>Last digit prediction</p><div class="gr dg">${[0,1,2,3,4,5,6,7,8,9].map(d=>`<button data-b="${d}" class="${S.b===d?'on':''}">${d}</button>`).join('')}</div></div>`:''}${stake}
   ${sides.map((t,i)=>`<button class="buy ${i?'r':''}" data-buy="${t}"><span>${TT[t][0]}${HAS_B.includes(t)?' '+S.b:''}</span><small id="po-${t}"></small></button>`).join('')}`},
 init(){const S=this.st,me=this,cv=$('mtcv'),redraw=()=>me.draw();$('mtr').innerHTML=this.panel();chartUI(cv,{get hover(){return S.hover},set hover(v){S.hover=v},get n(){return S.n2},set n(v){S.n2=v},get type(){return S.type}},redraw);
  cv.onwheel=e=>{e.preventDefault();S.n2=Math.round(Math.min(HMAX,Math.max(40,S.n2*(e.deltaY>0?1.25:.8))));redraw()};
  $('mkb').onclick=()=>$('mkd').hidden=!$('mkd').hidden;$('mkd').onclick=e=>{const b=e.target.closest('[data-mk]');if(b){S.k=b.dataset.mk;$('mkd').hidden=true;redraw();render()}};
  $('ct-a').onclick=()=>{S.type='area';S.ind=null;redraw()};$('ct-c').onclick=()=>{S.type='candle';S.n2=60;redraw()};
  $('ct-i').onclick=()=>{S.ind=S.ind?null:{sma:1,ema:1,bb:1};toast(S.ind?'Indicators on: SMA 20 (orange), EMA 20 (purple), Bollinger (blue)':'Indicators off');redraw()};
  $('ct-d').onclick=()=>{const a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='ht-chart.png';a.click()};
  $('z-in').onclick=()=>{S.n2=Math.max(40,Math.round(S.n2*.8));redraw()};$('z-out').onclick=()=>{S.n2=Math.min(S.type==='candle'?120:HMAX,Math.round(S.n2*1.25));redraw()};$('z-rs').onclick=()=>{S.n2=S.type==='candle'?60:300;redraw()};
  $('mtpx').onclick=()=>{S.pos=!S.pos;$('mtp').classList.toggle('shut',!S.pos);setTimeout(redraw,220)};
  $('mtpl').onclick=e=>{const b=e.target.closest('[data-sell]');if(b){const c=OPEN.find(x=>String(x.id)===b.dataset.sell);if(c){busy(b,true,'Selling');sellNow(c)}}};
  $('mtr').onclick=e=>{const t=e.target;
   if(t.closest('#mmb')){S.more=!S.more}else if(t.closest('#tth')){S.pick=true}else if(t.closest('[data-ty]')){S.ty=t.closest('[data-ty]').dataset.ty;S.pick=false}
   else if(t.closest('[data-g]'))S.g=+t.closest('[data-g]').dataset.g/100;else if(t.closest('[data-b]'))S.b=+t.closest('[data-b]').dataset.b;
   else if(t.closest('[data-st]')){S.s=Math.max(.35,+(S.s+(t.closest('[data-st]').dataset.st==='+'?1:-1)).toFixed(2))}
   else if(t.closest('[data-n]')){S.n=Math.min(10,Math.max(1,S.n+(t.closest('[data-n]').dataset.n==='+'?1:-1)))}
   else if(t.closest('[data-buy]')){const ty=t.closest('[data-buy]').dataset.buy;
    const o=ty==='accu'
      ?{k:S.k,t:'accu',g:+S.g,s:+S.s,tp:S.tp?+S.tpv:0,src:'Manual'}
      :{k:S.k,t:ty,b:+S.b,s:+S.s,n:+S.n||1,src:'Manual'};
    const c=place(o);if(c&&!c.remote)toast(ty==='accu'?`Accumulator bought: ${Math.round(S.g*100)}% growth`:'Contract bought');return}else return;
   $('mtr').innerHTML=me.panel();me.tick()};
  $('mtr').oninput=e=>{if(e.target.id==='mt-s')S.s=Math.max(.35,+e.target.value||.35);if(e.target.id==='mt-n')S.n=Math.min(10,Math.max(1,+e.target.value||1));if(e.target.id==='mt-tpv')S.tpv=+e.target.value||0;if(e.target.id==='mt-tp'){S.tp=e.target.checked;$('mt-tpv').disabled=!S.tp}};
  this.tk=(k)=>{if(k===S.k&&page==='Manual Trader')redraw()};TICKS.push(this.tk);redraw()},
 leave(){const i=TICKS.indexOf(this.tk);if(i>=0)TICKS.splice(i,1)},
 draw(){const S=this.st;if(!$('mtcv'))return;const acc=OPEN.find(c=>c.t==='accu'&&c.k===S.k),d=S.ty==='accu'?(acc?null:accDist(S.k,S.g)):null;
  const marks=OPEN.filter(c=>c.k===S.k&&c.t!=='accu').map(c=>({p:c.e,col:'#2f6fe4',txt:`${label(c)} · entry`}));
  drawChart($('mtcv'),{k:S.k,type:S.type,n:S.n2,band:acc&&acc.hi?[acc.lo,acc.hi]:d?[M[S.k].p-d,M[S.k].p+d]:null,marks,hover:S.hover,ind:S.ind})},
 tick(){const S=this.st,m=M[S.k],c=chg(S.k);$('mkn').textContent=m.n;$('mkc').innerHTML=`${m.p.toFixed(m.d)} <span class="${c>=0?'up':'dn'}">${c>=0?'+':''}${c.toFixed(2)}%</span>`;$('mki').textContent=m.sh.replace('VOL ','');
  if(!live)this.draw();
  const L=OPEN.filter(x=>x.src==='Manual'||x.t==='accu');
  /* positions list is rebuilt only when positions open or close; live numbers update in place */
  const key=L.map(x=>x.id).join('|');if($('mtpl').dataset.h!==key){$('mtpl').dataset.h=key;$('mtpl').innerHTML=L.length?L.map(x=>`<div class="opi" data-op="${x.id}"><div><b>${label(x)}</b><small>${M[x.k].n}</small></div><div class="r"><small>Stake ${f(x.s)}</small>${x.t==='accu'?`<b data-pr></b><small data-tc></small><button class="sellb" data-sell="${x.id}">Sell</button>`:`<small data-tl></small>`}</div></div>`).join(''):`<div class="nop">${ICO('M4 8h16v11H4zM9 8V5h6v3')}<p>You have no open positions.</p></div>`}
  L.forEach(x=>{const r=$('mtpl').querySelector(`[data-op="${x.id}"]`);if(!r)return;if(x.t==='accu'){const pr=(x.val||x.s)-x.s,b=r.querySelector('[data-pr]');b.textContent=(pr>=0?'+':'')+f(pr);b.className=pr>=0?'up':'dn';r.querySelector('[data-tc]').textContent=(x.ticks||0)+' ticks'}else r.querySelector('[data-tl]').textContent=`${x.l} tick${x.l===1?'':'s'} left`});
  if(S.ty==='accu'&&!S.pick&&$('mt-mp')){const mx=ACC_T[Math.round(S.g*100)];$('mt-mp').textContent=f(Math.min(S.s*Math.pow(1+S.g,mx),S.s*6))+' '+curTxt();$('mt-mx').textContent=mx+' ticks'}
  if(S.ty!=='accu'&&!S.pick)SIDES[S.ty].forEach(t=>{const e=$('po-'+t);if(e)e.textContent=`Payout ${f(S.s*payout(t,S.b))} ${curTxt()}${DV.on()?' (est.)':''}`});
  /* digit bubbles: share of each last digit over the last 1000 ticks; most frequent = green, least = red, current digit is enlarged */
  {const dp=digitPct(S.k,Math.min(1000,H[S.k].length)),pc=dp.pct,cd=digit(S.k,m.p),mx=Math.max(...pc),mn=Math.min(...pc),C=2*Math.PI*21,ok=dp.ds.length>=30;
   document.querySelectorAll('#mdb .mb').forEach(el=>{const i=+el.dataset.d,v=pc[i],L=Math.min(1,v/30)*C,a=el.querySelector('.ar'),sm=el.querySelector('small'),t=v.toFixed(1)+'%';
    if(sm.textContent!==t)sm.textContent=t;a.setAttribute('stroke-dasharray',L.toFixed(1)+' '+(C-L).toFixed(1));a.setAttribute('transform','rotate('+(90-L/C*180).toFixed(1)+' 24 24)');
    el.classList.toggle('hi',ok&&v===mx);el.classList.toggle('lo',ok&&v===mn&&mn!==mx);el.classList.toggle('cur',i===cd);el.title='Digit '+i+': '+t+' of the last '+dp.ds.length+' ticks'})}
  /* stats bar: accumulator survival streaks, or last digits */
  let st;if(S.ty==='accu'){const h=H[S.k].slice(-600),dd=accDist(S.k,S.g),runs=[];let r=0;for(let i=1;i<h.length;i++){if(Math.abs(h[i]-h[i-1])>dd){runs.push(r);r=0}else r++}runs.push(r);st=`<b>Stats</b>${runs.slice(-10).reverse().map((v,i)=>`<span class="${i?'':'cur'}">${v}</span>`).join('')}<small>ticks inside the range before each break</small>`}
  else st=`<b>Last digits</b>${lastDigits(S.k,12).map(d=>`<span>${d}</span>`).join('')}`;
  if($('mst').dataset.h!==st){$('mst').innerHTML=st;$('mst').dataset.h=st}}},

/* ---------- Copy Trading ---------- */
'Copy Trading':{html:()=>`<div class="cpw"><div class="cph"><div><h1>Copy trading</h1><p>Add a Deriv API token with Trade permission, or send that token to the trader so they can add it for you.</p></div>
 <div class="cpa"><span><small>ACCOUNT</small><b id="cp-id"></b></span><span><small>BALANCE</small><b id="cp-bal"></b></span><span><small>ROLE</small><b id="cp-role"></b></span></div></div>
 <div class="card cpc"><div class="ch"><b>API token</b><a href="https://app.deriv.com/account/api-token" target="_blank" rel="noopener">Create on Deriv</a></div>
  <div class="steps3"><div><i>1</i>Create a token with the Trade scope.</div><div><i>2</i>Paste it here, or send it to the trader to add for you.</div><div><i>3</i>The master account's trades are copied automatically.</div></div>
  ${LB('Deriv API token',`<div class="tokrow"><input id="cpt" type="password" placeholder="Paste token" autocomplete="off" spellcheck="false"><button class="btn sv" id="cpsv">Save</button><button class="btn bo" id="cpsy">${ICO('M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4')}Sync</button></div>`)}
  <button class="lnk2" id="cphow">${ICO('M3 5h18v14H3zM10 9l5 3-5 3z')}How to create a token</button>
  <ol class="howto" id="howto" hidden><li>Open Deriv → Account settings → API token.</li><li>Tick <b>Read</b> and <b>Trade</b>, name it (for example "HT copy"), and create it.</li><li>Copy the token and paste it above, then press Save.</li></ol></div>
 <div class="card cpc"><div class="ch"><b>Your enrollment</b><span class="pill2" id="cp-st">Not set</span></div><div class="cpe"><small>Account</small><b class="mono" id="cp-acc">Not enrolled</b></div>
  <p class="cpn" id="cp-n">Enrolled accounts on this site: 0</p><p class="cpn">The token is stored securely and used only to place copy trades. It is not shown again after you save.</p>
  <div class="cpbtns" id="cp-ctl" hidden><button class="btn bg" id="cp-start">Start copying</button><button class="btn bd" id="cp-stop">Stop copying</button></div></div></div>`,
 init(){const api=(p,o)=>fetch(CFG.API_BASE+p,{credentials:'include',headers:{'Content-Type':'application/json'},...o}).then(r=>r.ok?r.json():Promise.reject(r));
  const show=d=>{CP.d=d||{};render()},need=()=>{if(!CFG.API_BASE){toast('Copy trading needs the HT TRADES server. Set API_BASE in js/config.js.');return true}};
  $('cphow').onclick=()=>$('howto').hidden=!$('howto').hidden;
  $('cpsv').onclick=async e=>{const t=$('cpt').value.trim();if(!/^[\w-]{8,}$/.test(t))return toast('Paste a valid Deriv API token first.');if(need())return;const b=e.currentTarget;busy(b,true,'Saving');
   try{show(await api('/copy/enroll',{method:'POST',body:JSON.stringify({token:t})}));$('cpt').value='';toast('Token saved. You are enrolled.')}catch(x){toast('Could not save the token. Check it has Trade scope.')}busy(b,false)};
  $('cpsy').onclick=async e=>{if(need())return;const b=e.currentTarget;busy(b,true,'Syncing');try{show(await api('/copy/status'));toast('Enrollment synced')}catch(x){toast('Could not reach the copy trading server.')}busy(b,false)};
  $('cp-start').onclick=async e=>{if(need())return;busy(e.currentTarget,true,'Starting');try{show(await api('/copy/start',{method:'POST'}))}catch(x){toast('Could not start copying.')}busy(e.currentTarget,false)};
  $('cp-stop').onclick=async e=>{if(need())return;busy(e.currentTarget,true,'Stopping');try{show(await api('/copy/stop',{method:'POST'}))}catch(x){toast('Could not stop copying.')}busy(e.currentTarget,false)};
  if(CFG.API_BASE)api('/copy/status').then(show).catch(()=>{})},
 tick(){const d=CP.d||{};$('cp-id').textContent=demoId();$('cp-bal').textContent=balTxt()+' '+curTxt();$('cp-role').textContent=acct==='real'?'Real':'Demo';
  $('cp-st').textContent=d.enrolled?(d.active?'Copying':'Enrolled'):'Not set';$('cp-st').className='pill2'+(d.active?' on':d.enrolled?' en':'');
  $('cp-acc').textContent=d.enrolled?d.account:'Not enrolled';$('cp-n').textContent='Enrolled accounts on this site: '+(d.count||0);$('cp-ctl').hidden=!d.enrolled}}
});
const CP={on:false,d:{}};

/* ---------- Manual Trader: win / lose message ----------
   Called from record() (js/engine.js) every time a contract closes, in demo and on a Deriv account.
   Only contracts bought in the Manual Trader get a message; the card is clickable and pauses while hovered. */
const BULKB={};
/* Bulk Trader: one pop-up per bulk buy, shown when every contract in that buy has closed */
function bulkResult(c,r){
 const B=BULKB[c.bid];if(!B)return;B.done++;B.net=+(B.net+r).toFixed(2);if(r>0)B.w++;else if(r<0)B.l++;
 if(B.done<B.n)return;delete BULKB[c.bid];
 let w=$('tresw');if(!w){w=document.createElement('div');w.id='tresw';w.className='tresw';w.setAttribute('role','status');w.setAttribute('aria-live','polite');document.body.appendChild(w)}
 const win=B.net>0,flat=B.net===0,amt=f(Math.abs(B.net))+' '+curTxt();
 const head=flat?'Bulk trade closed at break-even':win?'Bulk trade won +'+amt:'Bulk trade lost −'+amt;
 const why=B.n===1?(r>0?'Contract won':r<0?'Contract lost':'Stake returned'):`${B.w} won · ${B.l} lost${B.n-B.w-B.l?' · '+(B.n-B.w-B.l)+' flat':''} of ${B.n} contracts`;
 const d=document.createElement('div');d.className='tres '+(flat?'flat':win?'win':'lose');
 d.innerHTML='<span class="tri"></span><div class="trt"><b></b><span></span><small></small></div><button type="button" class="trx" aria-label="Dismiss">×</button><i class="trb"></i>';
 d.querySelector('.tri').textContent=flat?'=':win?'✓':'✕';d.querySelector('b').textContent=head;d.querySelector('.trt>span').textContent=why;
 d.querySelector('small').textContent=`${TT[B.side][0]}${HAS_B.includes(B.side)?' '+B.b:''} · ${M[B.k].n} · Stake ${f(B.s)} each`;
 if(win&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const cf=document.createElement('div');cf.className='trcf';for(let i=0;i<16;i++){const p=document.createElement('u'),a=i/16*Math.PI*2,r2=40+Math.random()*50;p.style.cssText=`--x:${(Math.cos(a)*r2).toFixed(0)}px;--y:${(Math.sin(a)*r2*.7-10).toFixed(0)}px;background:${['#f6c33a','#22c08a','#f28c28','#4f8ff7'][i%4]};animation-delay:${(Math.random()*.15).toFixed(2)}s`;cf.appendChild(p)}d.appendChild(cf)}
 let tm;const kill=()=>{clearTimeout(tm);d.classList.add('out');setTimeout(()=>d.remove(),220)},arm=()=>{clearTimeout(tm);tm=setTimeout(kill,6500);d.classList.remove('hold')};
 d.onclick=kill;d.onmouseenter=()=>{clearTimeout(tm);d.classList.add('hold')};d.onmouseleave=arm;
 w.appendChild(d);while(w.children.length>3)w.firstChild.remove();arm()}
function tradeResult(c,r){
 if(c.src==='Bulk'){bulkResult(c,r);return}
 if((c.src||'Manual')!=='Manual')return;
 let w=$('tresw');if(!w){w=document.createElement('div');w.id='tresw';w.className='tresw';w.setAttribute('role','status');w.setAttribute('aria-live','polite');document.body.appendChild(w)}
 const win=r>0,flat=r===0,acc=c.t==='accu',amt=f(Math.abs(r))+' '+curTxt();
 const head=flat?'Contract closed at break-even':win?'You won +'+amt:'You lost −'+amt;
 const why=acc?(win?`Accumulator cashed out after ${c.ticks||0} tick${c.ticks===1?'':'s'}`:flat?'Accumulator closed':`Price left the range${c.ticks!=null?' after '+c.ticks+' tick'+(c.ticks===1?'':'s'):''}`):(win?`Payout ${f(c.s+r)} ${curTxt()}`:flat?'Stake returned':'Stake lost');
 const d=document.createElement('div');d.className='tres '+(flat?'flat':win?'win':'lose');
 d.innerHTML='<span class="tri"></span><div class="trt"><b></b><span></span><small></small></div><button type="button" class="trx" aria-label="Dismiss">×</button><i class="trb"></i>';
 d.querySelector('.tri').textContent=flat?'=':win?'✓':'✕';d.querySelector('b').textContent=head;d.querySelector('.trt>span').textContent=why;
 d.querySelector('small').textContent=`${label(c)} · ${M[c.k].n} · Stake ${f(c.s)} ${curTxt()}`;
 if(win&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const cf=document.createElement('div');cf.className='trcf';for(let i=0;i<16;i++){const p=document.createElement('u'),a=i/16*Math.PI*2,r2=40+Math.random()*50;p.style.cssText=`--x:${(Math.cos(a)*r2).toFixed(0)}px;--y:${(Math.sin(a)*r2*.7-10).toFixed(0)}px;background:${['#f6c33a','#22c08a','#f28c28','#4f8ff7'][i%4]};animation-delay:${(Math.random()*.15).toFixed(2)}s`;cf.appendChild(p)}d.appendChild(cf)}
 let tm;const kill=()=>{clearTimeout(tm);d.classList.add('out');setTimeout(()=>d.remove(),220)},arm=()=>{clearTimeout(tm);tm=setTimeout(kill,6500);d.classList.remove('hold')};
 d.onclick=kill;d.onmouseenter=()=>{clearTimeout(tm);d.classList.add('hold')};d.onmouseleave=arm;
 w.appendChild(d);while(w.children.length>3)w.firstChild.remove();arm();
 const mc=document.querySelector('.mtc');if(mc&&page==='Manual Trader'){mc.classList.remove('fw','fl');void mc.offsetWidth;if(!flat){mc.classList.add(win?'fw':'fl');setTimeout(()=>mc.classList.remove('fw','fl'),1300)}}
}
