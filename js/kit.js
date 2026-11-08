/* Shared building blocks for the pages: form controls, bot files, presets */
const opt=(a,v)=>a.map(x=>`<option value="${x[0]}"${String(x[0])===String(v)?' selected':''}>${x[1]}</option>`).join('');
const MK=Object.keys(M).map(k=>[k,M[k].n]),TY=Object.keys(TT).map(t=>[t,TT[t][0]]),DG=[0,1,2,3,4,5,6,7,8,9].map(d=>[d,d]);
const MGRP=[...new Set(Object.values(M).map(m=>m.g))];
const mkOpts=v=>MGRP.map(g=>`<optgroup label="${g}">${opt(MK.filter(x=>M[x[0]].g===g),v)}</optgroup>`).join('');
const ENT=[['always','Every tick (no condition)'],['up','After N rising ticks'],['down','After N falling ticks'],['rsiLow','RSI(14) below 30'],['rsiHigh','RSI(14) above 70']];
const sel=(id,k,a)=>`<select data-bot="${id}" data-c="${k}">${opt(a,BOTS[id].c[k])}</select>`;
const mkSel=(id,k='m')=>`<select data-bot="${id}" data-c="${k}">${mkOpts(BOTS[id].c[k])}</select>`;
const num=(id,k,min,step,max)=>`<input type="number" data-bot="${id}" data-c="${k}" min="${min}" step="${step}"${max!=null?` max="${max}"`:''} value="${BOTS[id].c[k]}">`;
const tog=(id,k,lbl)=>`<label class="tg"><input type="checkbox" data-bot="${id}" data-c="${k}"${BOTS[id].c[k]?' checked':''}><i></i>${lbl?`<span>${lbl}</span>`:''}</label>`;
const ig=(id,k,min,step,u)=>`<div class="ig">${num(id,k,min,step)}<span>${u||'USD'}</span></div>`;
const LB=(t,h,cls)=>`<div class="fld${cls?' '+cls:''}"><span class="fl">${t}</span>${h}</div>`;
const ICO=p=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
/* Every input with data-bot/data-c writes straight into that bot's config */
const saveBots=()=>{const o={};for(const id in BOTS)o[id]=BOTS[id].c;store.set('bots',o)};
const UNDO=[],REDO=[];let bbLast='';
const PGH=e=>{const t=e.target,b=t.dataset.bot;if(!b||!BOTS[b])return;
 if(t.type==='checkbox')BOTS[b].c[t.dataset.c]=t.checked;
 else{if(t.value==='')return;BOTS[b].c[t.dataset.c]=/^-?\d+(\.\d+)?$/.test(t.value)?+t.value:t.value}
 if(e.type!=='change')return;saveBots();
 if(b==='main'&&page==='Bot Builder'){const s=JSON.stringify(BOTS.main.c);if(bbLast&&s!==bbLast){UNDO.push(bbLast);if(UNDO.length>50)UNDO.shift();REDO.length=0}bbLast=s}
 PG[page]&&PG[page].change&&PG[page].change(t)};
$('pg').oninput=$('pg').onchange=PGH;
const runBtn=(el,on,a,cls)=>{if(!el)return;const h=(on?ICO('M7 7h10v10H7z'):ICO('M8 5v14l11-7z'))+(on?'Stop':a);if(el.dataset.h!==h){el.innerHTML=h;el.dataset.h=h}el.className=(cls||'run')+(on?' stop':'')};
const sumTxt=b=>`Trades: ${b.n} · Wins: ${b.w} · Losses: ${b.n-b.w} · Net: ${b.pl>=0?'+':''}${f(b.pl)} ${curTxt()}`;
const download=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)};
function saveBot(id='main'){download('ht-bot-'+slug(BOTS[id].name)+'.json',JSON.stringify({app:'ht-trades',v:2,name:BOTS[id].name,cfg:BOTS[id].c},null,1));toast('Bot downloaded')}
/* Bot files come from outside: accept only known settings with the right types, and plain-text names */
const ENT_IDS=['always','up','down','rsiLow','rsiHigh'];
const cleanName=n=>String(n||'My bot').replace(/[^\w .:+\-()\/]/g,'').trim().slice(0,40)||'My bot';
function cleanCfg(x){const c={...DEF};if(!x||typeof x!=='object')return c;for(const k in DEF){const v=x[k];
 if(typeof DEF[k]==='number'&&typeof v==='number'&&isFinite(v)&&v>=0)c[k]=v;else if(typeof DEF[k]==='boolean'&&typeof v==='boolean')c[k]=v;
 else if(k==='m'&&M[v])c[k]=v;else if(k==='t'&&TT[v])c[k]=v;else if(k==='entry'&&ENT_IDS.includes(v))c[k]=v;else if(k==='ct'&&(v==='both'||TT[v]))c[k]=v;else if(k==='sm'&&['fixed','mart','dal','rev'].includes(v))c[k]=v}
 c.b=Math.min(9,Math.round(c.b));c.s=Math.max(.35,c.s);c.n=Math.min(10,Math.max(1,Math.round(c.n)));c.fid='';return c}
function pickFile(cb){const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=()=>i.files[0]&&cb(i.files[0]);i.click()}
function loadBotFile(fi,go2='Bot Builder'){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(d.app!=='ht-trades')throw 0;BOTS.main.c=cleanCfg(d.cfg);BOTS.main.name=cleanName(d.name);saveBots();toast('Bot loaded: '+BOTS.main.name);nav(go2)}catch(e){toast('Unsupported file. Load a .json bot saved from HT TRADES.')}};r.readAsText(fi)}
/* ---------- Dashboard import: several bot file types ----------
   .json (HT TRADES bots and other platforms' JSON), .xml (Deriv Bot / Blockly), .txt, .bot, .dbot.
   The type is read from the content, so a renamed file still loads. Only trade settings can be converted:
   a bot's own block logic (conditions, recovery rules) is not run by HT TRADES, and the import summary says so. */
const IMP_ACCEPT='.json,.xml,.txt,.bot,.dbot,application/json,text/xml,application/xml';
const IMP_SYM=()=>{const o={};for(const k in M){o[M[k].s.toLowerCase()]=k;o[k.toLowerCase()]=k;o[M[k].n.toLowerCase()]=k}return o};
const IMP_CT={call:'rise',rise:'rise',put:'fall',fall:'fall',digiteven:'even',even:'even',digitodd:'odd',odd:'odd',digitover:'over',over:'over',digitunder:'under',under:'under',digitmatch:'match',match:'match',matches:'match',digitdiff:'differ',differ:'differ',differs:'differ'};
const IMP_TT={callput:'rise',risefall:'rise',evenodd:'even',overunder:'over',matchesdiffers:'match'};
const impNum=v=>{const n=typeof v==='string'?parseFloat(v):v;return typeof n==='number'&&isFinite(n)?n:null};
function pickBotFile(cb){const i=document.createElement('input');i.type='file';i.accept=IMP_ACCEPT;i.onchange=()=>i.files[0]&&cb(i.files[0]);i.click()}
/* Deriv Bot (Blockly) XML -> HT TRADES settings */
function impXml(txt){
 const doc=new DOMParser().parseFromString(txt,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw 0;
 const all=[...doc.getElementsByTagName('block')],by=t=>all.filter(b=>b.getAttribute('type')===t),
  own=(el,n)=>{const f=el&&[...el.children].find(x=>x.tagName==='field'&&x.getAttribute('name')===n);return f?f.textContent.trim():null},vars={};
 const val=(b,n)=>{const v=b&&[...b.children].find(x=>x.tagName==='value'&&x.getAttribute('name')===n),i=v&&[...v.children].find(x=>x.tagName==='block'||x.tagName==='shadow');if(!i)return null;
  const t=i.getAttribute('type');if(t==='math_number'||t==='math_number_positive')return impNum(own(i,'NUM'));if(t==='variables_get'){const k=own(i,'VAR');return k in vars?vars[k]:null}return null};
 by('variables_set').forEach(b=>{const k=own(b,'VAR'),v=val(b,'VALUE');if(k&&v!=null&&!(k in vars))vars[k]=v});
 if(!all.length||!all.some(b=>/^trade_definition|^purchase$|^before_purchase$/.test(b.getAttribute('type')||'')))throw 0;
 const c={},got=[],miss=[],mk=by('trade_definition_market')[0],opt=by('trade_definition_tradeoptions')[0];
 const sym=own(mk,'SYMBOL_LIST'),k=sym&&IMP_SYM()[sym.toLowerCase()];
 if(k){c.m=k;got.push('Market: '+M[k].n)}else miss.push('Market'+(sym?' ('+sym+' is not available here)':''));
 const ct=own(by('trade_definition_contracttype')[0],'TYPE_LIST'),pu=own(by('purchase')[0],'PURCHASE_LIST'),tt=own(by('trade_definition_tradetype')[0],'TRADETYPE_LIST');
 const code=(ct&&ct.toLowerCase()!=='both'?ct:pu||'').toLowerCase().replace(/[^a-z]/g,''),t=IMP_CT[code]||(!code&&IMP_TT[(tt||'').toLowerCase()]);
 if(t){c.t=t;got.push('Contract: '+TT[t][0])}else miss.push('Contract type'+(code||tt?' ('+(ct&&ct.toLowerCase()!=='both'?ct:pu||tt)+' is not supported)':''));
 const dt=own(opt,'DURATIONTYPE_LIST'),du=val(opt,'DURATION');
 if(du!=null&&(!dt||dt==='t')){c.n=Math.min(10,Math.max(1,Math.round(du)));got.push('Duration: '+c.n+' tick'+(c.n>1?'s':''))}else miss.push('Duration'+(dt&&dt!=='t'?' (only ticks are supported)':''));
 const st=val(opt,'AMOUNT');if(st!=null&&st>0){c.s=Math.max(.35,st);got.push('Stake: '+f(c.s))}else miss.push('Stake');
 if(t&&HAS_B.includes(t)){const pr=val(opt,'PREDICTION');if(pr!=null){c.b=Math.min(9,Math.max(0,Math.round(pr)));got.push('Prediction digit: '+c.b)}else miss.push('Prediction digit')}
 const vf=re=>{for(const n in vars)if(re.test(n))return vars[n];return null},tp=vf(/take.?profit|^tp$|target.?profit/i),sl=vf(/stop.?loss|^sl$|max.?loss|loss.?limit/i),mt=vf(/martingale|multipl/i);
 if(tp>0){c.tp=tp;got.push('Take profit: '+f(tp))}if(sl>0){c.sl=sl;got.push('Stop loss: '+f(sl))}if(mt>=1.1&&mt<=20){c.mo=true;c.mart=mt;got.push('Martingale ×'+mt)}
 return{c,got,miss,kind:'Deriv Bot XML'}}
/* JSON from other platforms: look for well-known setting names anywhere in the file */
function impJson(d){
 const seen=[],q=[[d,0]],P={};while(q.length){const[o,dp]=q.shift();if(!o||typeof o!=='object'||dp>5||seen.includes(o))continue;seen.push(o);
  for(const key in o){const v=o[key],nk=key.toLowerCase().replace(/[^a-z]/g,'');if(v!==null&&typeof v!=='object'){if(!(nk in P))P[nk]=v}else q.push([v,dp+1])}}
 const pick=(...n)=>{for(const x of n)if(x in P)return P[x];return null},c={},got=[],miss=[],S=IMP_SYM();
 const sv=pick('symbol','market','underlying','underlyingsymbol','index'),k=sv!=null&&S[String(sv).toLowerCase()];
 if(k){c.m=k;got.push('Market: '+M[k].n)}else miss.push('Market');
 const cv=pick('contracttype','tradetype','contract','purchase','trade','type'),t=cv!=null&&IMP_CT[String(cv).toLowerCase().replace(/[^a-z]/g,'')];
 if(t){c.t=t;got.push('Contract: '+TT[t][0])}else miss.push('Contract type');
 const s=impNum(pick('amount','stake','initialstake','basestake'));if(s>0){c.s=Math.max(.35,s);got.push('Stake: '+f(c.s))}else miss.push('Stake');
 const du=impNum(pick('duration','ticks','tickcount'));if(du>0){c.n=Math.min(10,Math.max(1,Math.round(du)));got.push('Duration: '+c.n+' tick'+(c.n>1?'s':''))}
 const b=impNum(pick('barrier','prediction','lastdigit','digit'));if(b!=null&&t&&HAS_B.includes(t)){c.b=Math.min(9,Math.max(0,Math.round(b)));got.push('Prediction digit: '+c.b)}
 const tp=impNum(pick('takeprofit','tp','targetprofit')),sl=impNum(pick('stoploss','sl','maxloss')),mt=impNum(pick('martingale','martingalemultiplier','martingalefactor','multiplier'));
 if(tp>0){c.tp=tp;got.push('Take profit: '+f(tp))}if(sl>0){c.sl=sl;got.push('Stop loss: '+f(sl))}if(mt>=1.1&&mt<=20){c.mo=true;c.mart=mt;got.push('Martingale ×'+mt)}
 const nm=pick('name','botname','title');return{c,got,miss,kind:'JSON',name:nm}}
function importBotFile(fi,go2='Bot Builder'){
 const bad=m=>toast(m||'Unsupported file. Load a bot saved as .json or .xml (HT TRADES, Deriv Bot or similar).');
 if(fi.size>2*1024*1024)return bad('That file is too large to be a bot (2 MB maximum).');
 const base=cleanName(String(fi.name||'').replace(/\.[^.]*$/,'').replace(/[_-]+/g,' '));
 const r=new FileReader();r.onerror=()=>bad('Could not read that file.');
 r.onload=()=>{const txt=String(r.result).replace(/^\uFEFF/,'').trim();let res=null;
  try{
   if(txt[0]==='{'||txt[0]==='['){const d=JSON.parse(txt);
    if(d&&d.app==='ht-trades'){BOTS.main.c=cleanCfg(d.cfg);BOTS.main.name=cleanName(d.name);saveBots();toast('Bot loaded: '+BOTS.main.name);return nav(go2)}
    if(d&&d.kind==='auto')return bad('That is an Auto Trader file. Open Auto Trader and use its Upload button.');
    res=impJson(d)}
   else if(txt[0]==='<')res=impXml(txt);
  }catch(e){res=null}
  if(!res||!res.got.length)return bad('Could not find any trade settings in that file. Supported: HT TRADES .json, Deriv Bot .xml, and JSON with market, contract and stake.');
  const nm=cleanName(res.name||base),d=$('gd'),li=a=>a.map(x=>`<li>${esc(x)}</li>`).join('');
  d.innerHTML=`<h3>Import bot: ${esc(nm)}</h3><p>${esc(res.kind)} file read. These trade settings will be loaded:</p><ul class="impl">${li(res.got)}</ul>${res.miss.length?`<p><b>Not found, default used:</b></p><ul class="impl">${li(res.miss)}</ul>`:''}
   <p>HT TRADES imports the trade settings only. A bot's own block logic (conditions, recovery rules) is not converted, so check the settings before you run it.</p>
   <div class="dlgb"><button class="btn bo" id="im-x">Cancel</button><button class="btn bg" id="im-go">Load bot</button></div>`;
  d.showModal();$('im-x').onclick=()=>d.close();
  $('im-go').onclick=()=>{BOTS.main.c=cleanCfg({...DEF,...res.c});BOTS.main.name=nm;saveBots();d.close();toast('Bot loaded: '+nm);nav(go2)}};
 r.readAsText(fi)}
/* Apply a preset to the main bot (with a short loading spinner on the button) */
async function usePreset(p,btn,go2='Bot Builder'){busy(btn,true,'Loading…');await wait(450);BOTS.main.c={...DEF,...p.cfg};BOTS.main.name=p.name;saveBots();busy(btn,false);toast(p.name+' loaded. Review it, then press Run.');nav(go2)}

/* ---------- Bot library: Free Bots (34) and Premium Bots ---------- */
const FAM={rec:'Recovery strategies: switch side after a loss and rebuild the stake.',wiz:'Switcher strategies: contract switching with stake automation.',spd:'Speed setups: 1-tick contracts on fast markets.',mom:'Momentum strategies: enter after a run of rising or falling ticks.',dig:'Digit strategies: last-digit contracts with a fixed barrier.',bas:'Basic single-contract bots. A good place to start.'};
const B=(name,cat,fam,cfg)=>({name,cat,fam,cfg});
const LIB=[
 B('HT Magic Recovery','premium','rec',{m:'V100',t:'over',b:2,n:1,s:.5,rec:true,mo:true,mart:2.1,tp:10,sl:30}),
 B('HT Nova Grid','premium','rec',{m:'V75',t:'under',b:7,n:1,s:.5,rec:true,mo:true,mart:2.2,tp:8,sl:25}),
 B('Over 2 Recovery','popular','rec',{m:'V100',t:'over',b:2,n:1,s:.5,rec:true,mo:true,mart:2,tp:5,sl:20}),
 B('Under 7 Recovery','popular','rec',{m:'V100',t:'under',b:7,n:1,s:.5,rec:true,mo:true,mart:2,tp:5,sl:20}),
 B('Under 8 Shield','popular','rec',{m:'V50',t:'under',b:8,n:1,s:.5,mo:true,mart:5,tp:5,sl:20}),
 B('Even Streak Hunter','popular','wiz',{m:'V10',t:'even',n:1,s:.5,mo:true,mart:2,tp:5,sl:15}),
 B('Odd Streak Hunter','popular','wiz',{m:'V25',t:'odd',n:1,s:.5,mo:true,mart:2,tp:5,sl:15}),
 B('Rise Momentum 3','popular','mom',{m:'V75',t:'rise',entry:'up',k:3,n:5,s:1,tp:10,sl:20}),
 B('Fall Momentum 3','popular','mom',{m:'V75',t:'fall',entry:'down',k:3,n:5,s:1,tp:10,sl:20}),
 B('Differs Safe 5','popular','dig',{m:'V10',t:'differ',b:5,n:1,s:1,tp:5,sl:15}),
 B('Over 1 Steady','popular','dig',{m:'V100',t:'over',b:1,n:1,s:1,tp:5,sl:15}),
 B('Under 8 Steady','popular','dig',{m:'V100',t:'under',b:8,n:1,s:1,tp:5,sl:15}),
 B('Digit Flipper','popular','wiz',{m:'V50',t:'even',n:1,s:.5,rec:true,mo:true,mart:2,tp:5,sl:15}),
 B('Auto Switch Even/Odd','automated','wiz',{m:'V10',t:'even',n:1,s:.5,rec:true,mo:true,mart:2.1,tp:5,sl:20}),
 B('Auto Switch Over/Under','automated','wiz',{m:'V100',t:'over',b:4,n:1,s:.5,rec:true,mo:true,mart:2.1,tp:5,sl:20}),
 B('Auto Rise/Fall Switcher','automated','wiz',{m:'V75',t:'rise',n:5,s:1,rec:true,mo:true,mart:2,tp:10,sl:20}),
 B('RSI Reversal Rise','automated','mom',{m:'V75',t:'rise',entry:'rsiLow',n:5,s:1,tp:10,sl:20}),
 B('RSI Reversal Fall','automated','mom',{m:'V75',t:'fall',entry:'rsiHigh',n:5,s:1,tp:10,sl:20}),
 B('Recovery Over 3','automated','rec',{m:'V25',t:'over',b:3,n:1,s:.5,rec:true,mo:true,mart:2.5,tp:5,sl:20}),
 B('Recovery Under 6','automated','rec',{m:'V25',t:'under',b:6,n:1,s:.5,rec:true,mo:true,mart:2.5,tp:5,sl:20}),
 B('Hedge Even/Odd','automated','wiz',{m:'V10',t:'even',n:1,s:.5,hedge:true,tp:3,sl:10}),
 B('Momentum Reversal','automated','mom',{m:'V100',t:'fall',entry:'up',k:3,n:5,s:1,tp:10,sl:20}),
 B('Matches Hunter 5','automated','dig',{m:'V100',t:'match',b:5,n:1,s:.35,tp:5,sl:10}),
 B('Differs Auto 7','automated','dig',{m:'V50',t:'differ',b:7,n:1,s:1,mo:true,mart:11,tp:5,sl:20}),
 B('Volt 1s Even','new','spd',{m:'V100s',t:'even',n:1,s:.5,mo:true,mart:2,tp:5,sl:15}),
 B('Volt 1s Over 2','new','spd',{m:'V10s',t:'over',b:2,n:1,s:.5,rec:true,mo:true,mart:2,tp:5,sl:15}),
 B('Bull Market Rise','new','mom',{m:'BULL',t:'rise',entry:'up',k:2,n:5,s:1,tp:10,sl:20}),
 B('Bear Market Fall','new','mom',{m:'BEAR',t:'fall',entry:'down',k:2,n:5,s:1,tp:10,sl:20}),
 B('Even Basic','normal','bas',{m:'V10',t:'even',n:1,s:1}),
 B('Odd Basic','normal','bas',{m:'V10',t:'odd',n:1,s:1}),
 B('Rise Basic','normal','bas',{m:'V25',t:'rise',n:5,s:1}),
 B('Fall Basic','normal','bas',{m:'V25',t:'fall',n:5,s:1}),
 B('Over 4 Basic','normal','bas',{m:'V50',t:'over',b:4,n:1,s:1}),
 B('Under 5 Basic','normal','bas',{m:'V50',t:'under',b:5,n:1,s:1})];
const PREM=[
 {...LIB[0],risk:'High',cap:'100 USD+',how:'Buys Over 2 on 1-tick contracts. After a loss it switches to Under and multiplies the stake by 2.1 until a win.'},
 {...LIB[1],risk:'High',cap:'100 USD+',how:'Buys Under 7, switching side after a loss with a 2.2× recovery stake.'},
 {name:'HT Even Sniper',cat:'premium',fam:'wiz',cfg:{m:'V10s',t:'even',n:1,s:.5,entry:'fn',fid:'',sm:'dal',tp:5,sl:15},risk:'Medium',cap:'50 USD+',how:'Even on the 1-second Volatility 10 market with D\'Alembert staking: +1 unit after a loss, −1 after a win.'},
 {name:'HT Trend Rider',cat:'premium',fam:'mom',cfg:{m:'V75',t:'rise',entry:'up',k:4,n:5,s:1,sm:'rev',mart:1.5,tp:15,sl:20},risk:'Medium',cap:'100 USD+',how:'Rides 4-tick rising runs on Volatility 75 with reverse martingale: stakes grow after wins, reset after three.'},
 {name:'HT Bear Hunter',cat:'premium',fam:'mom',cfg:{m:'BEAR',t:'fall',entry:'rsiHigh',n:5,s:1,tp:10,sl:15},risk:'Low',cap:'50 USD+',how:'Sells into overbought spikes on the Bear Market index using RSI(14) above 70.'},
 {name:'HT Matches Pro',cat:'premium',fam:'dig',cfg:{m:'V100',t:'match',b:7,n:1,s:.35,max:40,tp:5,sl:10},risk:'High',cap:'20 USD+',how:'Small-stake Matches 7 with a 40-trade cap. Rare wins pay about 9×.'}];
PREM.forEach(p=>{if(p.cfg.entry==='fn')p.cfg.entry='always'});
const CATS=[['all','All Bots'],['premium','Premium'],['popular','Popular'],['automated','Automated'],['new','New'],['normal','Normal']];
const cfgLine=c=>`${M[c.m].n} · ${TT[c.t][0]}${HAS_B.includes(c.t)?' '+c.b:''} · ${c.n} tick${c.n>1?'s':''} · stake ${f(c.s)}`;
