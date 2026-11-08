/* Charts, Analysis Tools (6 tools), Auto Trader, Signals, Risk Calculator */
const mkPicker=(id,k)=>`<div class="mkp"><button class="mkb" data-mkb="${id}"><span class="mki">${M[k].sh.replace('VOL ','')}</span><span><b>${M[k].n}</b><small id="${id}-c"></small></span>${ICO('M6 9l6 6 6-6')}</button><div class="mkd" data-mkd="${id}" hidden>${MGRP.map(g=>`<p>${g}</p>${MK.filter(x=>M[x[0]].g===g).map(x=>`<button data-mk="${x[0]}">${x[1]}</button>`).join('')}`).join('')}</div></div>`;
function mkPickerWire(id,set){const b=document.querySelector(`[data-mkb="${id}"]`),d=document.querySelector(`[data-mkd="${id}"]`);b.onclick=()=>d.hidden=!d.hidden;d.onclick=e=>{const x=e.target.closest('[data-mk]');if(x){d.hidden=true;set(x.dataset.mk)}}}

/* ---------- Charts ---------- */
const CH={k:'V100',type:'area',n:300,hover:null,ind:null};
Object.assign(PG,{
'Charts':{html:()=>`<div class="chw"><section class="chc">${mkPicker('ch',CH.k)}
  <div class="ctl">${[['cc-a','Area chart','M3 17l5-6 4 4 8-9v14H3z'],['cc-c','1-minute candles','M7 4v16M17 4v16M5 8h4v7H5zM15 6h4v6h-4z'],['cc-i','Indicators','M3 17l5-6 4 4 8-9'],['cc-d','Download chart image','M12 4v11M7 10l5 5 5-5M4 20h16']].map(b=>`<button class="ic2" id="${b[0]}" title="${b[1]}" aria-label="${b[1]}">${ICO(b[2])}</button>`).join('')}</div>
  <canvas id="chcv"></canvas><div class="zm"><button class="ic2" id="cz-in" aria-label="Zoom in">+</button><button class="ic2" id="cz-rs" aria-label="Reset zoom">${ICO('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3')}</button><button class="ic2" id="cz-out" aria-label="Zoom out">−</button></div></section>${rpHTML()}</div>`,
 init(){const cv=$('chcv'),rd=()=>drawChart(cv,{...CH});rpInit();chartUI(cv,CH,rd);mkPickerWire('ch',k=>{CH.k=k;nav('Charts')});
  $('cc-a').onclick=()=>{CH.type='area';CH.n=300;rd()};$('cc-c').onclick=()=>{CH.type='candle';CH.n=60;rd()};$('cc-i').onclick=()=>{CH.ind=CH.ind?null:{sma:1,ema:1,bb:1};toast(CH.ind?'Indicators on: SMA 20, EMA 20, Bollinger bands':'Indicators off');rd()};
  $('cc-d').onclick=()=>{const a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='ht-chart.png';a.click()};
  $('cz-in').onclick=()=>{zoomChart(CH,-1);rd()};$('cz-out').onclick=()=>{zoomChart(CH,1);rd()};$('cz-rs').onclick=()=>{CH.n=CH.type==='candle'?60:300;rd()};
  this.tk=k=>{if(k===CH.k&&page==='Charts')rd()};TICKS.push(this.tk);rd()},
 leave(){const i=TICKS.indexOf(this.tk);if(i>=0)TICKS.splice(i,1)},
 tick(){const m=M[CH.k],c=chg(CH.k);$('ch-c').innerHTML=`${m.p.toFixed(m.d)} <span class="${c>=0?'up':'dn'}">${c>=0?'+':''}${c.toFixed(2)}%</span>`;rpTick();if(!live)drawChart($('chcv'),{...CH})}},

/* ---------- Analysis Tools ---------- */
'Analysis Tools':{html:()=>`<div class="atw"><nav class="subt" id="att">${[['at','Analysis Tools'],['tv','Trading View'],['dp','DP Tool'],['se','Smart Edge'],['xt','Xenon Tick'],['ba','Bot Analysis']].map(t=>`<button data-at="${t[0]}" class="${AT.tab===t[0]?'on':''}">${t[1]}</button>`).join('')}</nav><div id="atb" class="atb"></div></div>`,
 init(){$('att').onclick=e=>{const b=e.target.closest('[data-at]');if(!b)return;AT.tab=b.dataset.at;$('att').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));this.open()};this.open()},
 open(){$('atb').innerHTML=`<div class="pload">${SPIN}<span>Loading…</span></div>`;setTimeout(()=>{const t=ATT[AT.tab];$('atb').innerHTML=t.html();t.init&&t.init();t.tick&&t.tick()},180)},
 leave(){ATT.tv.leave()},
 tick(){const t=ATT[AT.tab];if(t.tick&&!$('atb').querySelector('.pload'))t.tick()}},
});
const AT={tab:'at',k:'V10',t:'eo',n:120,b:5,tvk:'V75',tvn:60,ind:{sma:1}};
const ring=(v,mx,col)=>`conic-gradient(${col} ${Math.min(v/mx,1)*360}deg, var(--line) 0)`;
const ATT={
 at:{html:()=>`<div class="atc"><div class="card">${'<div class="g2s">'+LB('Synthetic Market',`<select id="a-k">${mkOpts(AT.k)}</select>`)+LB('Trade Type',`<select id="a-t">${opt(GR,AT.t)}</select>`)+'</div><div class="g2s">'+LB('Number of Ticks to Analyze',`<input id="a-n" type="number" min="20" max="${HMAX}" value="${AT.n}">`)+`<div id="a-bw">${LB('Prediction digit',`<select id="a-b">${opt(DG,AT.b)}</select>`)}</div></div>`}</div>
  <div class="card ac"><div class="abig" id="a-p"></div><div class="arings" id="a-r"></div><div class="astrm" id="a-s"></div></div>
  <div class="card"><div class="abars" id="a-bars"></div></div>
  <div class="card"><h3 class="h3i">${ICO('M4 4h16v16H4zM4 9h16M9 4v16')}Trading Probability Guide <small>observed over your tick window · theoretical in brackets</small></h3>
   <div class="g2s"><div><p class="tl2">Over probabilities</p><div class="ptab" id="a-ov"></div></div><div><p class="tl2">Under probabilities</p><div class="ptab" id="a-un"></div></div></div>
   <p class="tl2">Signal Strength Guide</p><table class="sg"><thead><tr><th>Pattern</th><th>Even/Odd</th><th>Rise/Fall</th></tr></thead><tbody><tr><td>Strong Signal</td><td>Above 65%</td><td>Above 65%</td></tr><tr><td>Moderate Signal</td><td>55–65%</td><td>55–65%</td></tr><tr><td>Weak Signal</td><td>Below 55%</td><td>Below 55%</td></tr></tbody></table>
   <div class="tip">${ICO('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01')}<span><b>Tip:</b> combine pattern analysis with probability indicators, and size stakes with the Risk Calculator. Past ticks do not predict the next one.</span></div></div></div>`,
  init(){$('atb').onchange=()=>{AT.k=$('a-k').value;AT.t=$('a-t').value;AT.n=Math.min(HMAX,Math.max(20,+$('a-n').value||120));AT.b=+$('a-b').value;ATT.at.tick()}},
  tick(){const k=AT.k,m=M[k],{ds,pct}=digitPct(k,AT.n),cd=digit(k,m.p),srt=[...pct].sort((a,b)=>b-a),col=v=>v===srt[0]?'#22ab94':v===srt[9]?'#e5484d':v===srt[1]?'#2f6fe4':'#f28c28';
   $('a-bw').hidden=!['ou','md'].includes(AT.t);$('a-p').textContent=m.p.toFixed(m.d);
   $('a-r').innerHTML=pct.map((v,i)=>`<div class="ar${i===cd?' cur':''}"><span style="background:${ring(v,srt[0]||1,col(v))}"><i><b>${i}</b><small>${v.toFixed(2)}%</small></i></span></div>`).join('');
   const lab=d=>AT.t==='eo'?(d%2?'O':'E'):AT.t==='ou'?(d>AT.b?'O':d<AT.b?'U':'='):AT.t==='md'?(d===AT.b?'M':'D'):'';
   const s=AT.t==='rf'?H[k].slice(-21).slice(1).map((v,i,a)=>v>=(i?a[i-1]:H[k].at(-21))?'R':'F'):ds.slice(-20).map(lab);
   $('a-s').innerHTML=s.map(x=>`<span class="${'ERUM'.includes(x)?'b':'r'}">${x}</span>`).join('');
   const sides=PG['Bulk Trader'].sides({m:k,n:AT.n,t:AT.t,b:AT.b});
   $('a-bars').innerHTML=sides.map(([t,v],i)=>`<div class="abr"><span>${TT[t][0]}</span><div><i class="${i?'r':'g'}" style="width:${Math.max(v,2)}%">${v.toFixed(0)}%</i></div></div>`).join('');
   const tb=(arr,th)=>`<table>${[0,1].map(r=>`<tr>${arr.slice(r*4,r*4+4).map(b=>`<th>${b}</th>`).join('')}</tr><tr>${arr.slice(r*4,r*4+4).map(b=>`<td>${th(b)}</td>`).join('')}</tr>`).join('')}</table>`;
   $('a-ov').innerHTML=tb([1,2,3,4,5,6,7,8],b=>`${pct.slice(b+1).reduce((a,x)=>a+x,0).toFixed(0)}% <small>(${(9-b)*10}%)</small>`);
   $('a-un').innerHTML=tb([1,2,3,4,5,6,7,8],b=>`${pct.slice(0,b).reduce((a,x)=>a+x,0).toFixed(0)}% <small>(${b*10}%)</small>`)}},
 tv:{html:()=>`<div class="card tvw"><div class="tvh">${LB('Market',`<select id="tv-k">${mkOpts(AT.tvk)}</select>`)}<div class="tvi">${[['sma','SMA 20'],['ema','EMA 20'],['bb','Bollinger']].map(x=>`<label class="ck"><input type="checkbox" data-ind="${x[0]}"${AT.ind[x[0]]?' checked':''}> ${x[1]}</label>`).join('')}</div><div class="tvz"><button class="ic2" id="tv-o">−</button><button class="ic2" id="tv-i">+</button></div></div><canvas id="tvcv"></canvas><p class="hint">1-minute candles. Scroll on the chart to zoom, hover for prices.</p></div>`,
  init(){const st={type:'candle',get n(){return AT.tvn},set n(v){AT.tvn=v},hover:null},cv=$('tvcv'),rd=()=>drawChart(cv,{k:AT.tvk,type:'candle',n:AT.tvn,hover:st.hover,ind:AT.ind});chartUI(cv,st,rd);
   $('tv-k').onchange=e=>{AT.tvk=e.target.value;rd()};$('atb').onchange=e=>{if(e.target.dataset.ind){AT.ind[e.target.dataset.ind]=e.target.checked?1:0;rd()}};
   $('tv-i').onclick=()=>{AT.tvn=Math.max(20,Math.round(AT.tvn*.8));rd()};$('tv-o').onclick=()=>{AT.tvn=Math.min(120,Math.round(AT.tvn*1.25));rd()};
   ATT.tv.tk=k=>{if(k===AT.tvk&&AT.tab==='tv'&&$('tvcv'))rd()};TICKS.push(ATT.tv.tk);rd()},
  leave(){const i=TICKS.indexOf(ATT.tv.tk);if(i>=0)TICKS.splice(i,1)},tick(){}},
 dp:{html:()=>`<div class="card"><div class="dph"><h3>Digit percentages across all markets</h3>${LB('Ticks per market',`<input id="dp-n" type="number" min="50" max="${HMAX}" step="50" value="${AT.dpn||500}">`)}</div><div class="tw"><table class="dpt" id="dp-t"></table></div><p class="hint">Green is each market's most frequent last digit, red the least. Every digit's expected share is 10%.</p></div>`,
  init(){$('dp-n').onchange=e=>{AT.dpn=Math.min(HMAX,Math.max(50,+e.target.value||500));ATT.dp.tick()}},
  tick(){const n=AT.dpn||500;$('dp-t').innerHTML=`<thead><tr><th>Market</th>${[0,1,2,3,4,5,6,7,8,9].map(d=>`<th>${d}</th>`).join('')}<th>Even</th></tr></thead><tbody>${Object.keys(M).map(k=>{const{pct}=digitPct(k,n),mx=Math.max(...pct),mn=Math.min(...pct),ev=pct.filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0);
   return`<tr><td>${M[k].n}</td>${pct.map(v=>`<td class="${v===mx?'hx':v===mn?'lx':''}" style="--h:${Math.abs(v-10)*8}%">${v.toFixed(1)}</td>`).join('')}<td>${ev.toFixed(1)}%</td></tr>`}).join('')}</tbody>`}},
 se:{html:()=>`<div class="card"><div class="dph"><h3>Smart Edge</h3><div class="g2s">${LB('Market',`<select id="se-k">${mkOpts(AT.k)}</select>`)}${LB('Ticks',`<input id="se-n" type="number" min="50" max="${HMAX}" step="50" value="${AT.sen||1000}">`)}</div></div><div class="tw"><table id="se-t"></table></div><p class="hint">Edge = how often the contract won in the window minus the rate it needs to break even. A positive edge is a past observation, not a forecast.</p></div>`,
  init(){$('atb').onchange=()=>{AT.k=$('se-k').value;AT.sen=Math.min(HMAX,Math.max(50,+$('se-n').value||1000));ATT.se.tick()};$('atb').onclick=e=>{const b=e.target.closest('[data-tr]');if(b){const[t,bb]=b.dataset.tr.split(':');tradeSignal({k:AT.k,t,b:+bb})}}},
  tick(){const k=AT.k,n=AT.sen||1000,{pct}=digitPct(k,n),u=upPct(k,n),ev=pct.filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0),R=[['rise',5,u,50],['fall',5,100-u,50],['even',5,ev,50],['odd',5,100-ev,50]];
   for(let b=0;b<9;b++)R.push(['over',b,pct.slice(b+1).reduce((a,x)=>a+x,0),(9-b)*10]);for(let b=1;b<10;b++)R.push(['under',b,pct.slice(0,b).reduce((a,x)=>a+x,0),b*10]);for(let b=0;b<10;b++){R.push(['match',b,pct[b],10]);R.push(['differ',b,100-pct[b],90])}
   R.sort((a,b)=>(b[2]-b[3])-(a[2]-a[3]));const h=`<thead><tr><th>Contract</th><th>Observed win</th><th>Break-even</th><th>Edge</th><th></th></tr></thead><tbody>${R.slice(0,16).map(r=>`<tr><td>${TT[r[0]][0]}${HAS_B.includes(r[0])?' '+r[1]:''}</td><td>${r[2].toFixed(1)}%</td><td>${r[3]}%</td><td class="${r[2]-r[3]>=0?'up':'dn'}">${r[2]-r[3]>=0?'+':''}${(r[2]-r[3]).toFixed(1)}%</td><td><button class="tbn sm" data-tr="${r[0]}:${r[1]}">Trade</button></td></tr>`).join('')}</tbody>`;
   if($('se-t').dataset.h!==h){$('se-t').innerHTML=h;$('se-t').dataset.h=h}}},
 xt:{html:()=>`<div class="xtw"><div class="card"><div class="dph"><h3>Xenon Tick</h3>${LB('Market',`<select id="xt-k">${mkOpts(AT.k)}</select>`)}</div><div class="xtk" id="xt-k2"></div><p class="tl2">Ticks since each digit last appeared</p><div class="xsince" id="xt-s"></div></div>
  <div class="card"><div class="tw"><table class="xtt" id="xt-t"></table></div></div></div>`,
  init(){$('xt-k').onchange=e=>{AT.k=e.target.value;ATT.xt.tick()}},
  tick(){const k=AT.k,h=H[k],ts=TS[k],ds=h.slice(-200).map(v=>digit(k,v)),str=(arr,fn)=>{let n=1;for(let i=arr.length-1;i>0&&fn(arr[i])===fn(arr[i-1]);i--)n++;return n};
   const eo=str(ds,d=>d%2),rf=(()=>{let n=1;const s=h.slice(-60);const dir=s.at(-1)>s.at(-2);for(let i=s.length-2;i>0&&(s[i]>s[i-1])===dir;i--)n++;return[n,dir]})();
   $('xt-k2').innerHTML=[['Price',M[k].p.toFixed(M[k].d)],['Last digit',ds.at(-1)],[ds.at(-1)%2?'Odd streak':'Even streak',eo],[rf[1]?'Rise streak':'Fall streak',rf[0]],['Digit streak',str(ds,d=>d)]].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
   $('xt-s').innerHTML=[0,1,2,3,4,5,6,7,8,9].map(d=>{const i=ds.lastIndexOf(d),n=i<0?'200+':ds.length-1-i;return`<span class="${n>=20||n==='200+'?'hot':''}"><b>${d}</b>${n}</span>`}).join('');
   $('xt-t').innerHTML=`<thead><tr><th>Time</th><th>Price</th><th>Change</th><th>Digit</th><th>E/O</th></tr></thead><tbody>${h.slice(-30).map((p,i,a)=>{const j=h.length-30+i,ch=p-h[j-1],d=digit(k,p);return`<tr><td>${ts[j]?new Date(ts[j]*1000).toLocaleTimeString():''}</td><td>${p.toFixed(M[k].d)}</td><td class="${ch>=0?'up':'dn'}">${ch>=0?'▲':'▼'} ${Math.abs(ch).toFixed(M[k].d)}</td><td><b>${d}</b></td><td>${d%2?'Odd':'Even'}</td></tr>`}).reverse().join('')}</tbody>`}},
 ba:{html:()=>`<div class="bag"><div class="card"><h3>Profit/loss over time</h3><canvas id="ba-cv"></canvas></div><div class="card"><h3>By source</h3><div class="tw"><table id="ba-t"></table></div></div><div class="card"><h3>Streaks</h3><div class="kv" id="ba-k"></div></div></div>`,
  tick(){const T=[...trades].reverse();let cum=0;const pts=[0,...T.map(t=>cum+=t.p)];line($('ba-cv'),pts,cum>=0?'#22ab94':'#e5484d',pts.length);
   const by={};T.forEach(t=>{const b=by[t.src]=by[t.src]||{n:0,w:0,p:0,s:0};b.n++;if(t.p>0)b.w++;b.p+=t.p;b.s+=t.s});
   $('ba-t').innerHTML=`<thead><tr><th>Source</th><th>Trades</th><th>Win rate</th><th>Staked</th><th>Net</th></tr></thead><tbody>${Object.keys(by).length?Object.entries(by).map(([k,b])=>`<tr><td>${esc(k)}</td><td>${b.n}</td><td>${(b.w/b.n*100).toFixed(1)}%</td><td>${f(b.s)}</td><td class="${b.p>=0?'up':'dn'}">${b.p>=0?'+':''}${f(b.p)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No trades yet. Run a bot to see its analysis here.</td></tr>'}</tbody>`;
   let lw=0,ll=0,cw=0,cl=0;T.forEach(t=>{if(t.p>0){cw++;cl=0;lw=Math.max(lw,cw)}else{cl++;cw=0;ll=Math.max(ll,cl)}});
   $('ba-k').innerHTML=[['Longest win streak',lw],['Longest loss streak',ll],['Current',cw?cw+' wins':cl?cl+' losses':'—'],['Best trade',T.length?'+'+f(Math.max(...T.map(t=>t.p))):'—'],['Worst trade',T.length?f(Math.min(...T.map(t=>t.p))):'—'],['Average result',T.length?f(cum/T.length):'—']].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}}};

/* ---------- Auto Trader: six condition cards ---------- */
const ACD=[{id:'eod',ty:'Even/Odd (Digits)',col:'#22c55e',m:'V100',c:[{n:5,is:'even',then:'even'}]},{id:'eop',ty:'Even/Odd (Percentages)',col:'#22c55e',m:'V100',c:[{side:'even',op:'ge',v:60,then:'even'}]},
 {id:'oud',ty:'Over/Under (Digits)',col:'#2f6fe4',m:'V50',pred:5,c:[{n:3,is:'gt',x:5,then:'over'}]},{id:'oup',ty:'Over/Under (Percentages)',col:'#2f6fe4',m:'V50',pred:5,c:[{side:'over',op:'ge',v:60,then:'over'}]},
 {id:'rf',ty:'Rise / Fall',col:'#8b5cf6',m:'V25',c:[{n:5,is:'rise',then:'rise'}]},{id:'md',ty:'Matches / Differs',col:'#f97316',m:'V25',pred:4,c:[{n:5,is:'differ',then:'differ'}]}];
const AC={cards:store.get('ac_cards',null)||ACD.map(x=>({...x,c:x.c.map(r=>({...r})),re:'trade',ticks:1,s:.5,tp:0,sl:0,mo:false,mart:2,win:100,more:false,show:true,pin:false}))};
const acSave=()=>store.set('ac_cards',AC.cards.map(c=>({...c,more:false})));
const acBot=c=>BOTS['ac-'+c.id]||newBot('ac-'+c.id,{...DEF},c.ty);
function acRowMet(c,r){const k=c.m,ds=lastDigits(k,Math.max(r.n||1,1));
 switch(c.id){case'eod':return ds.length>=r.n&&ds.every(d=>(d%2===0)===(r.is==='even'));
  case'eop':case'oup':{const{pct}=digitPct(k,c.win||100),v=c.id==='eop'?(r.side==='even'?pct.filter((_,i)=>i%2===0):pct.filter((_,i)=>i%2)).reduce((a,b)=>a+b,0):(r.side==='over'?pct.slice(c.pred+1):pct.slice(0,c.pred)).reduce((a,b)=>a+b,0);r.cur=v;return r.op==='ge'?v>=r.v:v<=r.v}
  case'oud':return ds.length>=r.n&&ds.every(d=>r.is==='gt'?d>r.x:r.is==='lt'?d<r.x:d===r.x);
  case'rf':{const s=H[k].slice(-r.n-1);return s.length>r.n&&s.slice(1).every((v,i)=>r.is==='rise'?v>s[i]:v<s[i])}
  case'md':return ds.length>=r.n&&ds.every(d=>r.is==='match'?d===c.pred:d!==c.pred)}}
function acSync(c){const b=acBot(c),r0=c.c[0];Object.assign(b.c,{m:c.m,t:r0.then,b:c.pred??5,n:c.id==='rf'?Math.max(c.ticks,1):c.ticks,s:c.s,tp:c.tp,sl:c.sl,mo:c.mo,mart:c.mart,sm:c.mo?'mart':'fixed',entry:'fn',fid:'ac-'+c.id});b.name='Auto: '+c.ty;
 COND['ac-'+c.id]=()=>{if(c.re!=='trade'){const w=+c.re;if(b._last&&H[c.m].length-b._lastLen<w)return false}const ok=c.c.every(r=>acRowMet(c,r));if(ok){b._last=Date.now();b._lastLen=H[c.m].length}return ok}}
const acRow=(c,r,i)=>{const S=(k,a,v)=>`<select data-r="${i}" data-k="${k}">${opt(a,v)}</select>`,N=(k,v,mn,mx)=>`<input type="number" data-r="${i}" data-k="${k}" min="${mn}" max="${mx}" value="${v}">`,del=c.c.length>1?`<button class="rx" data-del="${i}" aria-label="Remove condition">×</button>`:'';
 const met=`<span class="met" data-met="${i}"></span>`;
 switch(c.id){case'eod':return`<div class="cr">If the last ${N('n',r.n,1,20)} digits are ${S('is',[['even','Even'],['odd','Odd']],r.is)} Then trade ${S('then',[['even','Even'],['odd','Odd']],r.then)}${met}${del}</div>`;
  case'eop':return`<div class="cr">If ${S('side',[['even','Even%'],['odd','Odd%']],r.side)} ${S('op',[['ge','≥'],['le','≤']],r.op)} ${N('v',r.v,1,99)} % Then trade ${S('then',[['even','Even'],['odd','Odd']],r.then)}${met}${del}</div>`;
  case'oud':return`<div class="cr">If the last ${N('n',r.n,1,20)} digits are ${S('is',[['gt','Greater than'],['lt','Less than'],['eq','Equal to']],r.is)} ${N('x',r.x,0,9)} Then trade ${S('then',[['over','Over'],['under','Under']],r.then)} prediction <b>${c.pred}</b>${met}${del}</div>`;
  case'oup':return`<div class="cr">If ${S('side',[['over','Over%'],['under','Under%']],r.side)} ${S('op',[['ge','≥'],['le','≤']],r.op)} ${N('v',r.v,1,99)} % Then trade ${S('then',[['over','Over'],['under','Under']],r.then)} prediction <b>${c.pred}</b>${met}${del}</div>`;
  case'rf':return`<div class="cr">If the last ${N('n',r.n,1,20)} ticks are ${S('is',[['rise','Rise'],['fall','Fall']],r.is)} Then trade ${S('then',[['rise','Rise'],['fall','Fall']],r.then)}${met}${del}</div>`;
  case'md':return`<div class="cr">If the last ${N('n',r.n,1,20)} digits ${S('is',[['differ','Differ from'],['match','Match']],r.is)} <b>${c.pred}</b> Then trade ${S('then',[['differ','Differ'],['match','Match']],r.then)}${met}${del}</div>`}};
const acCard=(c,i)=>`<article class="acd" data-card="${i}" style="--ac:${c.col}"><header><span class="dots">⁘</span><b>${c.ty}</b><button class="pin${c.pin?' on':''}" data-pin="${i}" title="${c.pin?'Unpin':'Pin to top'}" aria-label="Pin card">${ICO('M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z')}</button></header>
 <p class="lbl">SELECT MARKET</p><div class="acm"><select data-f="m">${mkOpts(c.m)}</select><span class="acld" data-ld="${i}"></span></div>
 ${c.pred!=null?`<div class="acp">${[0,1,2,3,4,5,6,7,8,9].map(d=>`<button data-pred="${d}" class="${c.pred===d?'on':''}">${d}</button>`).join('')}</div>`:''}
 <div class="acs"><span data-strm="${i}"></span><button data-more="${i}">${c.more?'Show less':'Show more'}</button></div>
 <div class="acc"><p class="lbl">CONDITION</p>${c.c.map((r,j)=>acRow(c,r,j)).join('')}<button class="addc" data-add="${i}">+ Add condition</button></div>
 <div class="acr">Re-Analyze after: <select data-f="re">${opt([['trade','On every trade'],['5','Every 5 ticks'],['10','Every 10 ticks'],['30','Every 30 ticks']],c.re)}</select></div>
 <div class="acf"><label><span class="lbl">TICKS</span><input type="number" data-f="ticks" min="1" max="10" value="${c.ticks}"></label><label><span class="lbl">STAKE</span><input type="number" data-f="s" min=".35" step=".01" value="${c.s}"></label><label><span class="lbl">SETTINGS</span><button class="ic2" data-set="${i}" aria-label="Card settings">${ICO('M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1')}</button></label></div>
 <button class="acgo" data-go2="${i}"></button><small class="acst" data-st="${i}"></small></article>`;
Object.assign(PG,{
'Auto Trader':{html:()=>{const L=AC.cards.map((c,i)=>[c,i]).filter(x=>x[0].show).sort((a,b)=>b[0].pin-a[0].pin);return`<div class="ath"><div><h1>Auto Trader cards</h1><small>${L.length} of ${AC.cards.length} visible</small></div><div class="ha"><button class="tbn" id="ac-set">${ICO('M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3')}Settings</button><button class="tbn" id="ac-dl">${ICO('M12 4v11M7 10l5 5 5-5M4 20h16')}Download bot</button><button class="tbn" id="ac-ul">${ICO('M12 20V9M7 14l5-5 5 5M4 4h16')}Upload bot</button></div></div>
 <div class="acg" id="acg">${L.map(([c,i])=>acCard(c,i)).join('')}</div>`},
 init(){AC.cards.forEach(acSync);const g=$('acg'),C2=i=>AC.cards[i],re=()=>{acSave();AC.cards.forEach(acSync);nav('Auto Trader')};
  g.onchange=g.oninput=e=>{const card=e.target.closest('[data-card]');if(!card)return;const c=C2(+card.dataset.card),t=e.target;
   if(t.dataset.f){c[t.dataset.f]=t.type==='number'?+t.value:t.value;if(t.dataset.f==='s')c.s=Math.max(.35,c.s)}
   if(t.dataset.r!=null){const r=c.c[+t.dataset.r];r[t.dataset.k]=t.type==='number'?+t.value:t.value}
   acSync(c);if(e.type==='change'){acSave();if(t.dataset.f==='m')PG['Auto Trader'].tick()}};
  g.onclick=e=>{const t=e.target,n=x=>+t.closest(`[data-${x}]`).dataset[x];
   if(t.closest('[data-pred]')){const c=C2(+t.closest('[data-card]').dataset.card);c.pred=+t.closest('[data-pred]').dataset.pred;return re()}
   if(t.closest('[data-more]')){const c=C2(n('more'));c.more=!c.more;t.closest('[data-more]').textContent=c.more?'Show less':'Show more';return}
   if(t.closest('[data-add]')){const c=C2(n('add'));c.c.push({...c.c.at(-1)});return re()}
   if(t.closest('[data-del]')){const c=C2(+t.closest('[data-card]').dataset.card);c.c.splice(n('del'),1);return re()}
   if(t.closest('[data-pin]')){const c=C2(n('pin'));c.pin=!c.pin;return re()}
   if(t.closest('[data-set]')){const c=C2(n('set')),d=$('gd');d.innerHTML=`<h3>${c.ty} settings</h3><div class="g2s">${LB('Take profit (USD)',`<input id="cs-tp" type="number" min="0" value="${c.tp}">`)}${LB('Stop loss (USD)',`<input id="cs-sl" type="number" min="0" value="${c.sl}">`)}</div><div class="g2s">${LB('Martingale',`<label class="tg"><input type="checkbox" id="cs-mo"${c.mo?' checked':''}><i></i></label>`)}${LB('Multiplier',`<input id="cs-x" type="number" min="1.1" step=".1" value="${c.mart}">`)}</div>${['eop','oup'].includes(c.id)?LB('Percentage window (ticks)',`<input id="cs-w" type="number" min="20" max="${HMAX}" value="${c.win}">`):''}<div class="dlgb"><button class="btn bo" id="cs-x2">Cancel</button><button class="btn b-or" id="cs-ok">Save</button></div>`;
    d.showModal();$('cs-x2').onclick=()=>d.close();$('cs-ok').onclick=()=>{c.tp=+$('cs-tp').value||0;c.sl=+$('cs-sl').value||0;c.mo=$('cs-mo').checked;c.mart=Math.max(1.1,+$('cs-x').value||2);if($('cs-w'))c.win=+$('cs-w').value||100;d.close();re();toast('Card settings saved')};return}
   if(t.closest('[data-go2]')){const c=C2(n('go2'));acSync(c);setBot('ac-'+c.id,!acBot(c).on)}};
  $('ac-set').onclick=()=>{const d=$('gd');d.innerHTML=`<h3>Auto Trader settings</h3><p>Choose which cards to show.</p>${AC.cards.map((c,i)=>`<label class="ck row2"><input type="checkbox" data-vis="${i}"${c.show?' checked':''}> ${c.ty}</label>`).join('')}<div class="dlgb"><button class="btn bo" id="as-r">Reset all cards</button><button class="btn b-or" id="as-ok">Done</button></div>`;d.showModal();
   $('as-ok').onclick=()=>{d.querySelectorAll('[data-vis]').forEach(x=>AC.cards[+x.dataset.vis].show=x.checked);d.close();re()};$('as-r').onclick=()=>{if(!confirm('Reset all six cards to their defaults?'))return;store.set('ac_cards',null);AC.cards=ACD.map(x=>({...x,c:x.c.map(r=>({...r})),re:'trade',ticks:1,s:.5,tp:0,sl:0,mo:false,mart:2,win:100,more:false,show:true,pin:false}));d.close();re()}};
  $('ac-dl').onclick=()=>download('ht-auto-trader.json',JSON.stringify({app:'ht-trades',kind:'auto',cards:AC.cards},null,1));
  $('ac-ul').onclick=()=>pickFile(fi=>{const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(d.kind!=='auto'||!Array.isArray(d.cards))throw 0;AC.cards=ACD.map((x,i)=>{const u=d.cards.find(c=>c&&c.id===x.id)||{};const n=v=>typeof v==='number'&&isFinite(v)&&v>=0;
    return{...x,c:Array.isArray(u.c)&&u.c.length?u.c.slice(0,5).map(r=>{const o={...x.c[0]};for(const k in o)if(typeof r[k]===typeof o[k])o[k]=typeof o[k]==='string'?String(r[k]).replace(/[^a-z]/g,''):r[k];return o}):x.c.map(r=>({...r})),m:M[u.m]?u.m:x.m,pred:x.pred!=null?Math.min(9,Math.round(n(u.pred)?u.pred:x.pred)):undefined,re:['trade','5','10','30'].includes(u.re)?u.re:'trade',ticks:n(u.ticks)?Math.min(10,Math.max(1,u.ticks)):1,s:n(u.s)?Math.max(.35,u.s):.5,tp:n(u.tp)?u.tp:0,sl:n(u.sl)?u.sl:0,mo:u.mo===true,mart:n(u.mart)?u.mart:2,win:n(u.win)?u.win:100,more:false,show:u.show!==false,pin:u.pin===true}});re();toast('Auto Trader cards loaded')}catch(e){toast('Unsupported file. Upload a .json saved from Auto Trader.')}};r.readAsText(fi)})},
 tick(){AC.cards.forEach((c,i)=>{const card=document.querySelector(`[data-card="${i}"]`);if(!card)return;const b=acBot(c),d=digit(c.m,M[c.m].p);
  card.querySelector(`[data-ld="${i}"]`).textContent=d;card.querySelector(`[data-strm="${i}"]`).textContent=(c.id==='rf'?H[c.m].slice(-(c.more?31:13)).slice(1).map((v,j,a)=>j&&v<a[j-1]?'F':'R'):lastDigits(c.m,c.more?30:12)).join(' ');
  c.c.forEach((r,j)=>{const ok=acRowMet(c,r),e=card.querySelector(`[data-met="${j}"]`);if(e){e.textContent=ok?'Met':'Not met'+(r.cur!=null?` · ${r.cur.toFixed(0)}%`:'');e.className='met'+(ok?' ok':'')}});
  const g=card.querySelector(`[data-go2="${i}"]`),h=b.on?'Stop Auto Trading':'Start Auto Trading';if(g.textContent!==h){g.textContent=h;g.classList.toggle('stop',b.on)}
  card.querySelector(`[data-st="${i}"]`).textContent=b.n||b.on?sumTxt(b):''})}},

/* ---------- Signals ---------- */
'Signals':{st:{f:'all',n:500,next:0,L:[]},html:()=>`<div class="pghead"><div><h1>Signals</h1><p>Live scan of every market and contract type, refreshed every 10 seconds. Strength follows the Signal Strength Guide.</p></div><div class="ha"><select id="sg-f">${opt([['all','All strategies'],...GR],PG.Signals.st.f)}</select><select id="sg-n">${opt([[200,'Last 200 ticks'],[500,'Last 500 ticks'],[1000,'Last 1000 ticks']],PG.Signals.st.n)}</select><button class="tbn" id="sg-r">${ICO('M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5')}Refresh</button></div></div>
 <p class="sgn" id="sg-c"></p><div class="sgg" id="sg-g"></div>`,
 init(){const S=this.st;$('sg-f').onchange=e=>{S.f=e.target.value;S.next=0};$('sg-n').onchange=e=>{S.n=+e.target.value;S.next=0};$('sg-r').onclick=e=>{const b=e.currentTarget;busy(b,true,'Scanning');setTimeout(()=>{S.next=0;busy(b,false);this.tick()},500)};
  $('sg-g').onclick=e=>{const b=e.target.closest('[data-sig]');if(b)tradeSignal(S.L[+b.dataset.sig])};S.next=0},
 tick(){const S=this.st,now=Date.now();if(now>=S.next){S.next=now+10000;const g=S.f==='all'?GR.map(x=>x[0]):[S.f];S.L=[];Object.keys(M).forEach(k=>g.forEach(s=>S.L.push({...bestFor(s,k,S.n),s})));S.L.sort((a,b)=>b.edge-a.edge);S.L=S.L.slice(0,18);S.at=now;
   const st=x=>{const half=x.be===50;const v=half?x.w:50+x.edge*3;return v>65?['Strong','s3']:v>=55?['Moderate','s2']:['Weak','s1']};
   $('sg-g').innerHTML=S.L.map((x,i)=>{const[sn,sc]=st(x);return`<article class="sgc"><div class="sgh"><span class="sgm">${M[x.k].sh}</span><span class="str ${sc}">${sn}</span></div><h3>${sigTxt(x)}</h3><p>${M[x.k].n}</p><div class="sacf"><i style="width:${x.w}%"></i></div><div class="sgk"><span>Observed <b>${x.w.toFixed(1)}%</b></span><span>Break-even <b>${x.be}%</b></span><span>Edge <b class="${x.edge>=0?'up':'dn'}">${x.edge>=0?'+':''}${x.edge.toFixed(1)}%</b></span></div><button class="btn lb" data-sig="${i}">Trade</button></article>`}).join('')}
  $('sg-c').textContent=`Scanned ${new Date(S.at).toLocaleTimeString()} · next scan in ${Math.max(0,Math.ceil((S.next-now)/1000))}s · ${live?'live Deriv ticks':'simulated ticks'}. Signals describe the past, not the next tick.`}},

/* ---------- Risk Calculator ---------- */
'Risk Calculator':{st:store.get('risk',{cap:null,prof:'bal',mode:'fixed',wr:55,po:.95,ls:5}),
 html:()=>{const S=PG['Risk Calculator'].st;if(S.cap==null)S.cap=+curBal().toFixed(2);return `<div class="rcw"><header class="rch"><div><small>RISK MANAGEMENT</small><h1>Risk Calculator</h1><p>Enter your capital to get a safe stake size, session limits, and a clear plan for how to run your bot.</p></div><div class="ha"><button class="tbn inv" id="rc-r">${ICO('M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5')}Reset</button><button class="tbn wh" id="rc-ub">${ICO('M3 6h18v12H3zM16 12h.01')}Use balance · <span id="rc-bal"></span></button></div></header>
 <div class="rcg"><section class="card rcs"><h3>Your setup</h3>
  <p class="lbl">TRADING CAPITAL</p><div class="rccap"><span>${curTxt()}</span><input id="rc-cap" type="number" min="1" step="1" value="${S.cap}"></div><div class="rcq">${[50,100,250,500,1000,2500].map(v=>`<button data-cap="${v}">${v}</button>`).join('')}</div>
  <p class="lbl">RISK PROFILE</p><div class="rco">${[['con','Conservative','1% risk · longer sessions'],['bal','Balanced','2% risk · steady growth'],['agg','Aggressive','3.5% risk · faster targets']].map(x=>`<button data-prof="${x[0]}" class="${S.prof===x[0]?'on':''}"><b>${x[1]}</b><small>${x[2]}</small></button>`).join('')}</div>
  <p class="lbl">STAKE MODE</p><div class="rco">${[['fixed','Fixed','Same stake every trade'],['mart','Martingale','Multiply after losses'],['dal',"D'Alembert",'Step up one unit after loss']].map(x=>`<button data-mode="${x[0]}" class="${S.mode===x[0]?'on':''}"><b>${x[1]}</b><small>${x[2]}</small></button>`).join('')}</div>
  <div class="rsl"><label>Assumed win rate <b id="rc-wrv"></b></label><input id="rc-wr" type="range" min="10" max="95" value="${S.wr}"></div>
  <div class="rsl"><label>Payout ratio <b id="rc-pov"></b></label><input id="rc-po" type="range" min="0.1" max="9" step="0.05" value="${S.po}"></div>
  <div class="rsl"><label>Max loss streak to plan for <b id="rc-lsv"></b></label><input id="rc-ls" type="range" min="1" max="15" value="${S.ls}"></div></section>
 <section class="card rcp"><h3>Your plan</h3><div class="rcrec"><small>${ICO('M13 2L4 14h7l-1 8 9-12h-7z')}RECOMMENDED STAKE</small><b id="rc-st"></b><span id="rc-sts"></span></div>
  <div class="rcsc"><span class="ringv" id="rc-ring"><i id="rc-scn"></i></span><div><b id="rc-scl"></b><small id="rc-scd"></small></div></div>
  <div class="rcm" id="rc-m"></div><h4>${ICO('M4 6h16M4 12h16M4 18h16')}Stake ladder</h4><table class="rct"><thead><tr><th>STEP</th><th>STAKE</th><th>TOTAL AT RISK</th></tr></thead><tbody id="rc-l"></tbody></table>
  <h4>${ICO('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6')}How to run it</h4><ol class="rch2" id="rc-h"></ol><button class="btn b-or" id="rc-ap">Apply to Quick Bot</button></section></div></div>`},
 init(){const S=this.st,me=this,sv=()=>{store.set('risk',S);me.tick()};
  $('pg').oninput=e=>{PGH(e);const id=e.target.id;if(id==='rc-cap')S.cap=Math.max(0,+e.target.value||0);if(id==='rc-wr')S.wr=+e.target.value;if(id==='rc-po')S.po=+e.target.value;if(id==='rc-ls')S.ls=+e.target.value;sv()};
  $('pg').onclick=e=>{const t=e.target.closest('[data-cap],[data-prof],[data-mode]');if(!t)return;if(t.dataset.cap){S.cap=+t.dataset.cap;$('rc-cap').value=S.cap}
   if(t.dataset.prof){S.prof=t.dataset.prof;t.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t))}if(t.dataset.mode){S.mode=t.dataset.mode;t.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t))}sv()};
  $('rc-ub').onclick=()=>{S.cap=+curBal().toFixed(2);$('rc-cap').value=S.cap;sv()};
  $('rc-r').onclick=()=>{Object.assign(S,{cap:+curBal().toFixed(2),prof:'bal',mode:'fixed',wr:55,po:.95,ls:5});store.set('risk',S);nav('Risk Calculator')};
  $('rc-ap').onclick=()=>{const p=me.plan(),c=BOTS.main.c;Object.assign(c,{s:Math.max(.35,+p.stake.toFixed(2)),sl:+p.sl.toFixed(2),tp:+p.tp.toFixed(2),max:p.maxT,sm:S.mode==='mart'?'mart':S.mode==='dal'?'dal':'fixed',mo:false,mart:2});saveBots();toast(`Quick Bot set: stake ${f(c.s)}, stop loss ${f(c.sl)}, take profit ${f(c.tp)}`);nav('Quick Bot')}},
 plan(){const S=this.st,r={con:.01,bal:.02,agg:.035}[S.prof],cap=S.cap||0,p=S.wr/100,b=S.po,kelly=Math.max(0,(b*p-(1-p))/b);
  const base=cap*r,ladder=[];let tot=0;for(let i=1;i<=S.ls;i++){const st=S.mode==='mart'?base*Math.pow(2,i-1):S.mode==='dal'?base*i:base;tot+=st;ladder.push([i,st,tot])}
  let stake=base;if(S.mode!=='fixed'&&tot>cap*.25)stake=base*(cap*.25)/tot;
  const scale=stake/base,L2=ladder.map(x=>[x[0],x[1]*scale,x[2]*scale]),sl=cap*r*4,tp=sl*.875,ev=stake*(p*b-(1-p)),buf=Math.floor(sl/Math.max(stake,.01));
  const score=Math.min(100,Math.round(r*1000+(S.mode==='mart'?30:S.mode==='dal'?15:0)+(p*b-(1-p)<0?20:0)+(S.ls>8?5:0)));
  return{r,cap,stake,kelly,L2,sl,tp,maxT:Math.round(30/r/50)*5||60,ev,buf,score}},
 tick(){const S=this.st,P=this.plan(),cu=curTxt(),$m=v=>(v<0?'−':'')+'$'+f(Math.abs(v));
  $('rc-bal').textContent=$m(curBal());$('rc-wrv').textContent=S.wr+'%';$('rc-pov').textContent=S.po.toFixed(2)+'x';$('rc-lsv').textContent=S.ls;
  $('rc-st').textContent=$m(P.stake);$('rc-sts').textContent=`${(P.stake/(P.cap||1)*100).toFixed(1)}% of capital per trade · Kelly ${(P.kelly*100).toFixed(1)}%`;
  const lvl=P.score<30?['Low','Sized for longevity. Stick to the stop-loss and take-profit.']:P.score<55?['Moderate','Sized for longevity. Stick to the stop-loss and take-profit.']:['High','Losses can stack quickly. Consider a smaller profile or fixed staking.'];
  $('rc-scn').textContent=P.score;$('rc-ring').style.background=ring(P.score,100,P.score<30?'#22ab94':P.score<55?'#1e3a8a':'#e5484d');$('rc-scl').textContent='Risk score · '+lvl[0];$('rc-scd').textContent=lvl[1];
  $('rc-m').innerHTML=[['SESSION STOP-LOSS',$m(P.sl),'dn'],['TAKE-PROFIT',$m(P.tp),'up'],['MAX TRADES',P.maxT,''],['LOSS STREAK BUFFER',P.buf,''],['EV / TRADE',(P.ev>=0?'+':'')+$m(P.ev),P.ev>=0?'up':'dn'],['CAPITAL',$m(P.cap),'']].map(x=>`<div><small>${x[0]}</small><b class="${x[2]}">${x[1]}</b></div>`).join('');
  $('rc-l').innerHTML=P.L2.map(x=>`<tr><td>#${x[0]}</td><td>${$m(x[1])}</td><td>${$m(x[2])}</td></tr>`).join('');
  $('rc-h').innerHTML=[`Start with a base stake of ${f(P.stake)} (${(P.stake/(P.cap||1)*100).toFixed(1)}% of capital).`,`Use ${{fixed:'Fixed',mart:'Martingale',dal:"D'Alembert"}[S.mode]} stake sizing and stop the session if you reach −${f(P.sl)} loss.`,`Lock profits when you hit +${f(P.tp)}. Do not chase after the target.`,`Plan for up to ${P.maxT} trades this session; take a break after every ${Math.max(5,Math.round(P.maxT/4))} trades.`,`You can survive about ${P.buf} consecutive losses before the stop-loss triggers. Reset emotionally after any streak of ${Math.max(2,P.buf-1)} losses.`,`At ${S.wr}% win rate and ${S.po.toFixed(2)}x payout, expected value per trade is about ${P.ev>=0?'+':''}${f(P.ev)}${P.ev<0?'. That is negative: this setup loses money over time.':'.'}`,'Never raise risk mid-session to recover losses. Recalculate only with fresh capital tomorrow.'].map(x=>`<li>${x}</li>`).join('')}}
});
/* Restore bot settings saved in this browser (after every bot exists) */
{const sb=store.get('bots',{});for(const id in sb)if(BOTS[id]&&sb[id]&&typeof sb[id]==='object'&&!id.startsWith('ac-'))BOTS[id].c=cleanCfg({...BOTS[id].c,...sb[id]})}
AC.cards.forEach(acSync);
