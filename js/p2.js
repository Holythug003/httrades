/* Bot Builder, Quick Bot, Free Bots, Premium Bots */
let QSOPEN=false;
const BB={z:store.get('bb_z',1),pos:store.get('bb_pos',{}),opt:store.get('bb_opt',[]),sel:''};
const BDEF={tp:{x:30,y:24},pc:{x:30,y:420},sc:{x:540,y:420},rc:{x:540,y:24},'an-dig':{x:30,y:600},'an-trend':{x:30,y:700},'an-rsi':{x:300,y:700},'ut-bal':{x:540,y:620},'ut-timer':{x:540,y:700}};
const OPTB={sc:'Sell conditions','an-dig':'Last digit stats','an-trend':'Tick trend','an-rsi':'RSI (14)','ut-bal':'Balance','ut-timer':'Run timer'};
const bbSave=()=>{store.set('bb_pos',BB.pos);store.set('bb_opt',BB.opt);store.set('bb_z',BB.z)};
const isel=(k,a,v)=>`<select class="bs" data-bot="main" data-c="${k}">${opt(a,v)}</select>`;
const inum=(k,min,step)=>`<input class="bs n" type="number" data-bot="main" data-c="${k}" min="${min}" step="${step}" value="${BOTS.main.c[k]}">`;
const ichk=k=>`<input type="checkbox" class="bc" data-bot="main" data-c="${k}"${BOTS.main.c[k]?' checked':''}>`;
const blk=(id,title,body,col)=>{const p=BB.pos[id]||BDEF[id];return`<div class="blk${BB.sel===id?' sel':''}" data-blk="${id}" style="left:${p.x}px;top:${p.y}px;--bc:${col||'#0d3c66'}"><div class="bh" data-drag="${id}">${ICO('M4 6h16M4 12h16M4 18h16')}${title}</div><div class="bb">${body}</div></div>`};
const row=(...cells)=>`<div class="br">${cells.filter(c=>c!=='').map(c=>c.startsWith('<')?c:`<span>${c}</span>`).join('')}</div>`;
function bbBlocks(){const c=BOTS.main.c,g=grp(c.t),grpOf=k=>M[k].g;
 let h=blk('tp','1. Trade parameters',
  row('Market:',`<select class="bs" disabled><option>Derived</option></select>`,'›',`<select class="bs" id="bbg">${opt(MGRP.map(x=>[x,x]),grpOf(c.m))}</select>`,'›',`<select class="bs" data-bot="main" data-c="m">${opt(MK.filter(x=>M[x[0]].g===grpOf(c.m)),c.m)}</select>`)+
  row('Trade Type:',`<select class="bs" disabled><option>${g==='rf'?'Up/Down':'Digits'}</option></select>`,'›',`<select class="bs" id="bbtt">${opt(GR,g)}</select>`)+
  row('Contract Type:',isel('ct',[['both','Both'],...SIDES[g].map(t=>[t,TT[t][0]])],c.ct))+
  row('Default Candle Interval:',isel('cint',[[60,'1 minute'],[120,'2 minutes'],[300,'5 minutes'],[900,'15 minutes']],c.cint))+
  row('Restart last trade on error (bot ignores the unsuccessful trade):',ichk('rerr'))+
  '<div class="bsub">Run once at start:</div>'+row('set','<span class="vt">maxStake</span>','to',inum('maxStake',0,1),'<small>0 = no cap</small>')+
  '<div class="bsub">Trade options:</div>'+row('Duration:',`<select class="bs" disabled><option>Ticks</option></select>`,inum('n',1,1),'Stake: USD',inum('s',.35,.01),...(HAS_B.includes(c.t)?['Prediction:',isel('b',DG,c.b)]:[])),'#0d3c66');
 h+=blk('pc','2. Purchase conditions',row('Purchase',isel('t',SIDES[g].map(t=>[t,TT[t][0]]),c.t))+row('when',isel('entry',ENT,c.entry),['up','down'].includes(c.entry)?'N =':'',['up','down'].includes(c.entry)?inum('k',1,1):''),'#0d3c66');
 h+=blk('rc','4. Restart trading conditions',
  row('Stake mode:',isel('sm',[['fixed','Fixed'],['mart','Martingale'],['dal',"D'Alembert"],['rev','Reverse martingale']],c.sm||(c.mo?'mart':'fixed')),'multiplier ×',inum('mart',1,.1))+
  row('After a loss, switch side (recovery):',ichk('rec'))+row('Hedge: buy both sides each round:',ichk('hedge'))+
  row('Stop when profit ≥',inum('tp',0,1),'USD','or loss ≥',inum('sl',0,1),'USD')+row('Stop after',inum('max',0,1),'trades (0 = no limit)')+row('Trade again','<span class="vt">after each purchase</span>'),'#0d3c66');
 if(BB.opt.includes('sc'))h+=blk('sc','3. Sell conditions',row('Sell when profit ≥',inum('sellAt',0,.1),'USD')+'<div class="bnote">Applies to Rise/Fall contracts. Digit contracts cannot be sold early.</div>','#7a2f0a');
 if(BB.opt.includes('an-dig'))h+=blk('an-dig','Analysis: last digit stats',`<div class="bdig" id="bb-dig"></div>`,'#4b2a7a');
 if(BB.opt.includes('an-trend'))h+=blk('an-trend','Analysis: tick trend',`<div class="bro" id="bb-trend"></div>`,'#4b2a7a');
 if(BB.opt.includes('an-rsi'))h+=blk('an-rsi','Analysis: RSI (14)',`<div class="bro" id="bb-rsi"></div>`,'#4b2a7a');
 if(BB.opt.includes('ut-bal'))h+=blk('ut-bal','Utility: balance',`<div class="bro" id="bb-bal"></div>`,'#1f5f4a');
 if(BB.opt.includes('ut-timer'))h+=blk('ut-timer','Utility: run timer',row('Stop the bot after',inum('runFor',0,1),'minutes (0 = off)'),'#1f5f4a');
 return h}
const BCAT=[['tp','Trade parameters','M4 6h16M4 12h10M4 18h7','market contract duration stake prediction candle error'],['pc','Purchase conditions','M3 4h2l2 12h11l2-8H6','purchase entry condition rsi rising falling'],['sc','Sell conditions (optional)','M20 12l-8 8-9-9V3h8z','sell profit early'],['rc','Restart trading conditions','M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5','martingale alembert recovery hedge take profit stop loss'],
 ['an','Analysis','M5 20V10M12 20V4M19 20v-7','digit trend rsi stats'],['ut','Utility','M14 7l3-3 3 3-3 3zM4 20l9-9','balance timer']];
function bbMenu(q){q=(q||'').toLowerCase().trim();return BCAT.filter(x=>!q||(x[1]+' '+x[3]).toLowerCase().includes(q)).map(x=>{
 const sub=x[0]==='an'?['an-dig','an-trend','an-rsi']:x[0]==='ut'?['ut-bal','ut-timer']:null;
 return`<div class="bmi"><button data-cat="${x[0]}">${ICO(x[2])}<span>${x[1]}</span>${sub?ICO('M6 9l6 6 6-6'):''}</button>${sub?`<div class="bms" data-sub="${x[0]}" ${q?'':'hidden'}>${sub.map(s=>`<button data-add="${s}">${BB.opt.includes(s)?'✓ ':'+ '}${OPTB[s]}</button>`).join('')}</div>`:''}</div>`}).join('')||'<p class="hint">No blocks match.</p>'}
const QS=[['mart','Martingale','Multiplies the stake after each loss until a win.'],['dal',"D'Alembert",'Adds one unit after a loss and removes one after a win.'],['rev','Reverse martingale','Grows the stake after wins and resets after three.'],['fixed','Fixed stake','Same stake on every trade.']];
function qsOpen(){const c=BOTS.main.c,d=$('qsd');d.innerHTML=`<h3>Quick strategy</h3><p>Pick a staking strategy and the basics. You can fine-tune everything in the workspace after.</p>
 <div class="qsl">${QS.map(s=>`<label class="qso"><input type="radio" name="qs" value="${s[0]}"${(c.sm||'fixed')===s[0]?' checked':''}><span><b>${s[1]}</b><small>${s[2]}</small></span></label>`).join('')}</div>
 <div class="g2s">${LB('Market',`<select id="qs-m">${mkOpts(c.m)}</select>`)}${LB('Contract',`<select id="qs-t">${opt(TY,c.t)}</select>`)}</div>
 <div class="g2s">${LB('Stake (USD)',`<input id="qs-s" type="number" min=".35" step=".01" value="${c.s}">`)}${LB('Multiplier',`<input id="qs-x" type="number" min="1" step=".1" value="${c.mart}">`)}</div>
 <div class="g2s">${LB('Take profit (USD)',`<input id="qs-tp" type="number" min="0" step="1" value="${c.tp}">`)}${LB('Stop loss (USD)',`<input id="qs-sl" type="number" min="0" step="1" value="${c.sl}">`)}</div>
 <div class="g2s">${LB('Duration (ticks)',`<input id="qs-n" type="number" min="1" max="10" step="1" value="${c.n}">`)}${LB('Prediction digit',`<select id="qs-b">${opt(DG,c.b)}</select>`)}</div>
 <div class="dlgb"><button class="btn bo" id="qs-c">Cancel</button><button class="btn b-or" id="qs-e">Edit in workspace</button><button class="btn bg" id="qs-r">Run</button></div>`;
 d.showModal();const apply=()=>{const v=id=>$(id).value;Object.assign(c,{sm:d.querySelector('[name=qs]:checked').value,m:v('qs-m'),t:v('qs-t'),s:Math.max(.35,+v('qs-s')),mart:Math.max(1,+v('qs-x')),tp:+v('qs-tp'),sl:+v('qs-sl'),n:Math.min(10,Math.max(1,+v('qs-n'))),b:+v('qs-b'),mo:false,ct:'both'});BOTS.main.name='Quick strategy';saveBots()};
 $('qs-c').onclick=()=>d.close();$('qs-e').onclick=()=>{apply();d.close();nav('Bot Builder')};$('qs-r').onclick=()=>{apply();d.close();nav('Bot Builder');setTimeout(()=>setBot('main',true),400)}}

Object.assign(PG,{
'Bot Builder':{html:()=>`<div class="bbw">
 <aside class="bbl"><button class="qsb" id="bbqs">Quick strategy</button>
  <div class="bmenu"><button class="bmh" id="bmh">Blocks menu ${ICO('M6 15l6-6 6 6')}</button><div id="bmb"><div class="srch">${ICO('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4')}<input id="bmq" placeholder="Search" autocomplete="off"></div><div id="bml">${bbMenu()}</div></div></div></aside>
 <section class="bbc"><div class="bbt">${[['bt-reset','Reset workspace','M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5','r'],['bt-load','Load bot','M3 7h6l2 2h10v10H3z','b'],['bt-save','Save bot','M12 4v11M7 10l5 5 5-5M4 20h16','p'],['bt-tidy','Tidy blocks','M4 6h16M4 12h10M4 18h6','p'],0,['bt-chart','Charts','M4 18l5-6 4 4 7-9','g'],['bt-cand','Trading view','M7 4v16M17 4v16M5 8h4v7H5zM15 6h4v6h-4z','g'],['bt-an','Analysis tools','M12 3v9h9a9 9 0 1 1-9-9z','g'],0,['bt-undo','Undo','M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3','k'],['bt-redo','Redo','M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3','k'],0,['bt-zi','Zoom in','M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6M11 8v6','o'],['bt-zo','Zoom out','M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6','o']].map(b=>b?`<button class="tbi ${b[3]}" id="${b[0]}" title="${b[1]}" aria-label="${b[1]}">${ICO(b[2])}</button>`:'<i class="tsep"></i>').join('')}</div>
  <div class="ws" id="ws"><div class="wsi" id="wsi" style="transform:scale(${BB.z})">${bbBlocks()}</div><button class="bin" id="bin" title="Delete selected optional block" aria-label="Delete selected block">${ICO('M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3')}</button></div>
  <div class="bbs" id="bbs"></div></section>
 ${rpHTML()}</div>`,
 init(){bbLast=JSON.stringify(BOTS.main.c);rpInit();
  const redraw=()=>{$('wsi').innerHTML=bbBlocks();BBT()};
  $('bbqs').onclick=qsOpen;if(QSOPEN){QSOPEN=false;setTimeout(qsOpen,50)}
  $('bmh').onclick=()=>{$('bmb').hidden=!$('bmb').hidden;$('bmh').classList.toggle('shut',$('bmb').hidden)};
  $('bmq').oninput=e=>$('bml').innerHTML=bbMenu(e.target.value);
  $('bml').onclick=e=>{const c=e.target.closest('[data-cat]'),a=e.target.closest('[data-add]');
   if(a){const id=a.dataset.add;BB.opt.includes(id)?BB.opt=BB.opt.filter(x=>x!==id):BB.opt.push(id);bbSave();redraw();$('bml').innerHTML=bbMenu($('bmq').value);toast(BB.opt.includes(id)?OPTB[id]+' block added':OPTB[id]+' block removed');return}
   if(!c)return;const id=c.dataset.cat;
   if(id==='an'||id==='ut'){const s=$('bml').querySelector(`[data-sub="${id}"]`);s.hidden=!s.hidden;return}
   if(id==='sc'&&!BB.opt.includes('sc')){BB.opt.push('sc');bbSave();redraw();toast('Sell conditions block added')}
   const el=$('wsi').querySelector(`[data-blk="${id}"]`);if(el){el.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}};
  /* drag blocks by their header; drop on the bin to delete optional ones */
  let dr=null;
  $('ws').onpointerdown=e=>{const h=e.target.closest('[data-drag]'),b=e.target.closest('[data-blk]');
   BB.sel=b?b.dataset.blk:'';$('wsi').querySelectorAll('.blk').forEach(x=>x.classList.toggle('sel',x.dataset.blk===BB.sel));
   if(!h)return;const id=h.dataset.drag,el=h.parentElement,p=BB.pos[id]||{...BDEF[id]};dr={id,el,sx:e.clientX,sy:e.clientY,x:p.x,y:p.y};h.setPointerCapture(e.pointerId)};
  $('ws').onpointermove=e=>{if(!dr)return;const x=Math.max(0,dr.x+(e.clientX-dr.sx)/BB.z),y=Math.max(0,dr.y+(e.clientY-dr.sy)/BB.z);dr.el.style.left=x+'px';dr.el.style.top=y+'px';dr.nx=x;dr.ny=y;
   const r=$('bin').getBoundingClientRect();$('bin').classList.toggle('hot',e.clientX>r.left-20&&e.clientX<r.right+20&&e.clientY>r.top-20&&e.clientY<r.bottom+20)};
  $('ws').onpointerup=e=>{if(!dr)return;const hot=$('bin').classList.contains('hot');$('bin').classList.remove('hot');
   if(hot&&OPTB[dr.id]){BB.opt=BB.opt.filter(x=>x!==dr.id);delete BB.pos[dr.id];bbSave();redraw();$('bml').innerHTML=bbMenu($('bmq').value);toast(OPTB[dr.id]+' block deleted')}
   else if(hot)toast('The four main blocks cannot be deleted.');
   else if(dr.nx!=null){BB.pos[dr.id]={x:Math.round(dr.nx),y:Math.round(dr.ny)};bbSave()}dr=null};
  $('bin').onclick=()=>{if(!BB.sel)return toast('Select an optional block first, or drag it onto the bin.');if(!OPTB[BB.sel])return toast('The four main blocks cannot be deleted.');const n=OPTB[BB.sel];BB.opt=BB.opt.filter(x=>x!==BB.sel);BB.sel='';bbSave();redraw();$('bml').innerHTML=bbMenu($('bmq').value);toast(n+' block deleted')};
  $('ws').onchange=e=>{if(e.target.id==='bbg'){const k=MK.find(x=>M[x[0]].g===e.target.value)[0];BOTS.main.c.m=k;saveBots();redraw()}
   if(e.target.id==='bbtt'){BOTS.main.c.t=SIDES[e.target.value][0];BOTS.main.c.ct='both';saveBots();redraw()}
   if(['t','entry','sm'].includes(e.target.dataset.c)){if(e.target.dataset.c==='sm')BOTS.main.c.mo=false;redraw()}};
  const zoom=d=>{BB.z=Math.min(1.6,Math.max(.6,+(BB.z+d).toFixed(2)));$('wsi').style.transform=`scale(${BB.z})`;bbSave()};
  $('bt-zi').onclick=()=>zoom(.1);$('bt-zo').onclick=()=>zoom(-.1);
  $('bt-tidy').onclick=()=>{BB.pos={};BB.z=1;bbSave();$('wsi').style.transform='scale(1)';redraw();toast('Blocks tidied')};
  $('bt-reset').onclick=()=>{if(!confirm('Reset the workspace to a new default bot?'))return;UNDO.push(JSON.stringify(BOTS.main.c));BOTS.main.c={...DEF};BOTS.main.name='My bot';BB.opt=[];BB.pos={};bbSave();saveBots();redraw();toast('Workspace reset')};
  $('bt-load').onclick=()=>pickFile(fi=>loadBotFile(fi));$('bt-save').onclick=()=>saveBot();
  $('bt-chart').onclick=()=>nav('Charts');$('bt-cand').onclick=()=>{AT.tab='tv';nav('Analysis Tools')};$('bt-an').onclick=()=>{AT.tab='at';nav('Analysis Tools')};
  const hist=(from,to,l)=>{if(!from.length)return toast('Nothing to '+l);to.push(JSON.stringify(BOTS.main.c));BOTS.main.c=JSON.parse(from.pop());bbLast=JSON.stringify(BOTS.main.c);saveBots();redraw();toast(l==='undo'?'Change undone':'Change redone')};
  $('bt-undo').onclick=()=>hist(UNDO,REDO,'undo');$('bt-redo').onclick=()=>hist(REDO,UNDO,'redo');
  const BBT=()=>{$('bt-undo').disabled=!UNDO.length;$('bt-redo').disabled=!REDO.length};BBT();PG['Bot Builder'].bbt=BBT},
 tick(){const b=BOTS.main,c=b.c;rpTick();PG['Bot Builder'].bbt&&PG['Bot Builder'].bbt();
  $('bbs').innerHTML=`<b>${esc(b.name)}</b> · ${esc(cfgLine(c))} · ${b.on?'<span class="up">Running</span>':'Stopped'} · ${sumTxt(b)}`;
  if(c.runFor&&b.on&&b.t0&&Date.now()-b.t0>c.runFor*60000){setBot('main',false);toast('Run timer reached: bot stopped.')}
  if($('bb-dig')){const ds=H[c.m].slice(-100).map(v=>digit(c.m,v)),n=Array(10).fill(0);ds.forEach(d=>n[d]++);$('bb-dig').innerHTML=n.map((v,i)=>`<span><b>${i}</b>${v}%</span>`).join('')}
  if($('bb-trend')){const s=H[c.m].slice(-6),u=s.slice(1).filter((v,i)=>v>s[i]).length;$('bb-trend').textContent=`Last 5 ticks: ${u} up, ${5-u} down → ${u>=4?'rising':u<=1?'falling':'mixed'}`}
  if($('bb-rsi')){const r=rsi(c.m);$('bb-rsi').textContent=r==null?'—':`RSI ${r.toFixed(1)} (${r<30?'oversold':r>70?'overbought':'neutral'})`}
  if($('bb-bal'))$('bb-bal').textContent=`${balTxt()} ${curTxt()}`}},

/* ---------- Quick Bot: draggable panels ---------- */
'Quick Bot':{lay:()=>store.get('qb_lay',[['qp-tp','qp-pu'],['qp-bp']]),
 html:()=>{const c=BOTS.main.c,g=grp(c.t),L=PG['Quick Bot'].lay(),P2={
  'qp-tp':`<section class="pnl dp" draggable="true" data-p="qp-tp"><h4><i class="grip"></i>${ICO('M8 3h8v4H8zM5 7h14v14H5z')}Trade parameters</h4><div class="pb2">
   ${LB('Market',`<div class="g3s"><select disabled><option>Derived</option></select><select id="qgr">${opt(MGRP.map(x=>[x,x]),M[c.m].g)}</select><select data-bot="main" data-c="m">${opt(MK.filter(x=>M[x[0]].g===M[c.m].g),c.m)}</select></div>`)}
   ${LB('Trade type',`<select id="qtt">${opt(GR,g)}</select>`)}${LB('Contract type',`<select data-bot="main" data-c="ct">${opt([['both','Both'],...SIDES[g].map(t=>[t,TT[t][0]])],c.ct)}</select>`)}
   <div class="fld row"><span class="fl">Recovery Mode</span>${tog('main','rec')}</div><div class="fld row"><span class="fl">Hedging</span>${tog('main','hedge')}</div></div></section>`,
  'qp-bp':`<section class="pnl dp" draggable="true" data-p="qp-bp"><h4><i class="grip"></i>${ICO('M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4')}Bot parameters</h4><div class="pb2">
   ${LB('Stake',ig('main','s',.35,.01))}${LB('Take profit',ig('main','tp',0,1))}${LB('Stop loss',ig('main','sl',0,1))}
   <div class="fld row"><span class="fl">Martingale</span><div class="mrt">${tog('main','mo')}<b>×</b>${num('main','mart',1.1,.1)}</div></div>
   ${LB('Duration',`<div class="g2s"><select disabled><option>Ticks</option></select>${num('main','n',1,1,10)}</div>`)}
   <div id="qpb">${LB('Prediction (barrier digit)',sel('main','b',DG))}</div></div></section>`,
  'qp-pu':`<section class="pnl dp hl" draggable="true" data-p="qp-pu"><h4><i class="grip"></i>${ICO('M3 4h2l2 12h11l2-8H6M9 20h.01M17 20h.01')}Purchase<span class="ea">Enable Analysis ${`<label class="tg"><input type="checkbox" id="qea"${store.get('qea',false)?' checked':''}><i></i></label>`}</span></h4><div class="pb2">
   ${LB('Purchase',`<select data-bot="main" data-c="t">${opt(SIDES[g].map(t=>[t,TT[t][0]]),c.t)}</select>`)}${LB('Buy when',sel('main','entry',ENT))}
   <div id="qan" class="qan"></div></div></section>`};
  return `<div class="qbt"><button class="tbn" id="qdl">${ICO('M12 4v11M7 10l5 5 5-5M4 20h16')}Download bot</button><button class="tbn" id="qld">${ICO('M3 7h6l2 2h10v10H3z')}Load bot</button><button class="tbn" id="qrs">${ICO('M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5')}Reset bot</button><button class="tbn" id="qrl">${ICO('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z')}Reset layout</button><button class="run sm" id="qrun"></button><div class="qpx"><small id="qpn"></small><b id="qpp"></b></div></div>
  <div class="qcols" id="qcols">${L.map((col,i)=>`<div class="qcol" data-col="${i}">${col.map(id=>P2[id]).join('')}</div>`).join('')}</div><p class="qsum" id="qsum"></p>`},
 init(){$('qtt').onchange=e=>{BOTS.main.c.t=SIDES[e.target.value][0];BOTS.main.c.ct='both';saveBots();nav('Quick Bot')};
  $('qgr').onchange=e=>{BOTS.main.c.m=MK.find(x=>M[x[0]].g===e.target.value)[0];saveBots();nav('Quick Bot')};
  $('qea').onchange=e=>store.set('qea',e.target.checked);
  $('qdl').onclick=()=>saveBot();$('qld').onclick=()=>pickFile(fi=>loadBotFile(fi,'Quick Bot'));
  $('qrs').onclick=()=>{BOTS.main.c={...DEF};BOTS.main.name='My bot';saveBots();nav('Quick Bot');toast('Bot reset to defaults')};
  $('qrl').onclick=()=>{store.set('qb_lay',null);nav('Quick Bot');toast('Layout reset')};
  $('qrun').onclick=()=>setBot('main',!BOTS.main.on);
  /* drag panels between and within columns */
  let dg=null;$('qcols').ondragstart=e=>{const p=e.target.closest('[data-p]');if(!p||e.target.closest('input,select'))return e.preventDefault();dg=p;p.classList.add('dragging');e.dataTransfer.effectAllowed='move'};
  $('qcols').ondragend=()=>{if(!dg)return;dg.classList.remove('dragging');dg=null;store.set('qb_lay',[...$('qcols').children].map(col=>[...col.children].map(p=>p.dataset.p)))};
  $('qcols').ondragover=e=>{if(!dg)return;e.preventDefault();const col=e.target.closest('.qcol');if(!col)return;const after=[...col.querySelectorAll('[data-p]:not(.dragging)')].find(p=>e.clientY<p.getBoundingClientRect().top+p.offsetHeight/2);after?col.insertBefore(dg,after):col.appendChild(dg)}},
 change(t){if(['t','entry'].includes(t.dataset.c))render()},
 tick(){const b=BOTS.main,c=b.c,m=M[c.m];runBtn($('qrun'),b.on,'Run','run sm');$('qpn').textContent=m.n;$('qpp').textContent=m.p.toFixed(m.d);$('qpb').hidden=!HAS_B.includes(c.t);
  $('qsum').textContent=sumTxt(b);
  const on=$('qea').checked;$('qan').hidden=!on;if(on){const ds=H[c.m].slice(-100).map(v=>digit(c.m,v)),n=Array(10).fill(0);ds.forEach(d=>n[d]++);const ev=ds.filter(d=>d%2===0).length,mx=Math.max(...n),mn=Math.min(...n),s=H[c.m].slice(-101),up=s.slice(1).filter((v,i)=>v>s[i]).length;
   $('qan').innerHTML=`<div class="qad">${n.map((v,i)=>`<span class="${v===mx?'hi':v===mn?'lo':''}"><b>${i}</b>${v}%</span>`).join('')}</div><div class="qab"><span>Even ${ev}% · Odd ${100-ev}%</span><span>Rise ${up}% · Fall ${100-up}%</span><span>Last digit <b>${digit(c.m,m.p)}</b></span></div><small class="hint">Last 100 ticks of ${m.n}.</small>`}}},

/* ---------- Free Bots ---------- */
'Free Bots':{f:{q:'',cat:'all'},html:()=>{const F=PG['Free Bots'].f;return `<div class="fbw"><div class="srch big">${ICO('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4')}<input id="fbq" placeholder="Search free bots..." value="${esc(F.q)}" autocomplete="off"></div>
 <div class="chips" id="fbc">${CATS.map(c=>`<button data-cat="${c[0]}" class="${F.cat===c[0]?'on':''}">${c[1]} <i>${c[0]==='all'?LIB.length:LIB.filter(x=>x.cat===c[0]).length}</i></button>`).join('')}</div>
 <div class="fbg" id="fbg"></div></div>`},
 init(){const F=PG['Free Bots'].f,draw=()=>{const L=LIB.filter(x=>(F.cat==='all'||x.cat===F.cat)&&(!F.q||(x.name+' '+FAM[x.fam]+' '+cfgLine(x.cfg)).toLowerCase().includes(F.q.toLowerCase())));
   $('fbg').innerHTML=L.length?L.map(x=>`<article class="fb c-${x.cat}"><span class="rib">${x.cat.toUpperCase()} ★</span><h3>${esc(x.name)}</h3><p>${FAM[x.fam]}</p><small>${esc(cfgLine({...DEF,...x.cfg}))}</small><button class="btn lb" data-load="${LIB.indexOf(x)}">Load Bot</button></article>`).join(''):'<p class="empty">No bots match your search.</p>'};
  draw();$('fbq').oninput=e=>{F.q=e.target.value;draw()};
  $('fbc').onclick=e=>{const b=e.target.closest('[data-cat]');if(!b)return;F.cat=b.dataset.cat;$('fbc').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));draw()};
  $('fbg').onclick=e=>{const b=e.target.closest('[data-load]');if(b)usePreset(LIB[+b.dataset.load],b)}}},

/* ---------- Premium Bots ---------- */
'Premium Bots':{html:()=>`<div class="pghead"><div><h1>Premium Bots</h1><p>Advanced strategies with tested settings. ${DV.on()?'Unlocked for your Deriv account.':'Log in with Deriv to unlock them.'}</p></div></div>
 <div class="pbg">${PREM.map((p,i)=>{const c={...DEF,...p.cfg};return`<article class="pbc"><div class="pbh"><span class="crown">${ICO('M3 8l4 4 5-7 5 7 4-4-2 11H5z')}</span><div><h3>${esc(p.name)}</h3><small>${esc(cfgLine(c))}</small></div><span class="risk r-${p.risk.toLowerCase()}">${p.risk} risk</span></div>
  <p>${esc(p.how)}</p><div class="pbm"><span><small>Suggested capital</small><b>${p.cap}</b></span><span><small>Take profit / stop loss</small><b>${c.tp} / ${c.sl}</b></span><span><small>Staking</small><b>${{fixed:'Fixed',mart:'Martingale',dal:"D'Alembert",rev:'Reverse mart.'}[c.sm&&c.sm!=='fixed'?c.sm:(c.mo?'mart':'fixed')]}</b></span></div>
  ${DV.on()?`<button class="btn lb" data-prem="${i}">Load Bot</button>`:`<button class="btn bo lockb" data-login>${ICO('M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4')}Log in to unlock</button>`}</article>`}).join('')}</div>`,
 init(){$('pg').onclick=e=>{const b=e.target.closest('[data-prem]');if(b)usePreset(PREM[+b.dataset.prem],b)}}}
});
