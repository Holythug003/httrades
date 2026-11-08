/* App shell: header tabs, side drawer, ticker, dock, routing, render loop, landing page */
/* Tabs grouped by task: overview | build & run bots | trade | read the market | manage risk */
const NAVG=[['Overview',['Dashboard']],['Bots',['Quick Bot','Bot Builder','Free Bots','Premium Bots','Auto Trader']],['Trade',['Manual Trader','Bulk Trader','Copy Trading']],['Market',['Charts','Analysis Tools','Signals','Signal AI']],['Risk',['Risk Calculator']]];
const NAV=NAVG.flatMap(g=>g[1]);
const EXTRA=['Speed Lab','Reports','Tutorials'];
const P=[...NAV,...EXTRA];
const NI={'Dashboard':'M3 11l9-8 9 8M5 9.5V21h5v-6h4v6h5V9.5',
 'Bot Builder':'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
 'Free Bots':'M6 6h12v12H6zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4M9.5 9.5h5v5h-5z',
 'Premium Bots':'M9 3h6v3a3 3 0 1 0 3 3h3v6h-3a3 3 0 1 0-3 3v3H9v-3a3 3 0 1 0-3-3H3V9h3a3 3 0 1 0 3-3z',
 'Quick Bot':'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 12l3 3M14.5 4.5C17 2 21 3 21 3s1 4-1.5 6.5L13 16l-5-5zM8 11l-3 .5L3 14l4 1M13 16l-.5 3L15 21l1-4',
 'Signal AI':'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
 'Bulk Trader':'M12 3l9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5',
 'Manual Trader':'M3 4h18v12H3zM8 20h8M12 16v4',
 'Copy Trading':'M4 9h16v10H4zM9 9V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 13h16',
 'Charts':'M4 20V10h4v10zM10 20V4h4v16zM16 20v-7h4v7z',
 'Analysis Tools':'M12 12h.01M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8',
 'Auto Trader':'M13 2L4 14h7l-1 8 9-12h-7z',
 'Signals':'M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3zM19 14l.9 2.1 2.1.9-2.1.9L19 20l-.9-2.1L16 17l2.1-.9zM5 15l.7 1.6 1.6.7-1.6.7L5 19.6l-.7-1.6L2.7 17.3l1.6-.7z',
 'Risk Calculator':'M6 2h12v20H6zM9 6h6v3H9zM9 13h.01M12 13h.01M15 13h.01M9 17h.01M12 17h.01M15 17h.01',
 'Speed Lab':'M4 16a8 8 0 1 1 16 0M12 16l4-5','Reports':'M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3','Tutorials':'M3 7l9-4 9 4-9 4zM7 9v5c0 2 10 2 10 0V9'};
let page='Dashboard',navTok=0;
$('nv').innerHTML=`<button class="nmenu" id="nmenu" aria-label="Open menu">${ICO('M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4')}</button>`+NAVG.map(g=>g[1].map(p=>`<button data-page="${p}">${ICO(NI[p])}<span>${p}</span></button>`).join('')).join('<i class="nsep" aria-hidden="true"></i>');
$('dwl').innerHTML=`${NAVG.map(g=>`<p class="dwh">${g[0]}</p>${g[1].map(p=>`<button data-page="${p}">${ICO(NI[p])}${p}</button>`).join('')}`).join('')}<p class="dwh">More tools</p>${EXTRA.map(p=>`<button data-page="${p}">${ICO(NI[p])}${p}</button>`).join('')}`;
/* Tab bar overflow: arrows + fades appear only when tabs don't fit */
const nvEdge=()=>{const n=$('nv'),o=n.scrollWidth-n.clientWidth;$('nvw').classList.toggle('cl',n.scrollLeft>4);$('nvw').classList.toggle('cr',n.scrollLeft<o-4)};
$('nv').addEventListener('scroll',nvEdge,{passive:true});addEventListener('resize',nvEdge);
$('nvl').onclick=()=>$('nv').scrollBy({left:-360,behavior:'smooth'});$('nvr').onclick=()=>$('nv').scrollBy({left:360,behavior:'smooth'});
$('nv').addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&$('nv').scrollWidth>$('nv').clientWidth){$('nv').scrollLeft+=e.deltaY;e.preventDefault()}},{passive:false});
function drawer(o){$('dw').hidden=!o;$('dwb').hidden=!o}
$('nmenu').onclick=()=>drawer(true);$('dwx').onclick=$('dwb').onclick=()=>drawer(false);
/* Page switch with a short loading spinner */
function nav(n){if(!PG[n])n='Dashboard';const prevPage=page;page=n;const tok=++navTok;
 document.querySelectorAll('#nv [data-page],#dwl [data-page]').forEach(b=>{const on=b.dataset.page===n;b.classList.toggle('on',on);b.setAttribute('aria-current',on?'page':'false');
  if(on&&view==='app'&&b.closest('#nv')){const nv=$('nv');nv.scrollLeft=Math.max(0,b.offsetLeft-(nv.clientWidth-b.offsetWidth)/2)}});
 setTimeout(nvEdge,60);PG[prevPage]&&PG[prevPage].leave&&PG[prevPage].leave();
 const g=PG[n];$('pg').onclick=null;$('pg').oninput=$('pg').onchange=PGH;$('pg').className='wrap pg-'+slug(n);
 $('pg').dataset.ready='';$('pg').innerHTML=`<div class="pload">${SPIN}<span>Loading ${n}…</span></div>`;
 if(view==='app')history.replaceState(null,'','#/'+slug(n));
 setTimeout(()=>{if(tok!==navTok)return;$('pg').innerHTML=g.html();g.init&&g.init();$('pg').dataset.ready=n;render()},view==='app'?260:0)}
addEventListener('hashchange',()=>{const p=P.find(x=>'#/'+slug(x)===location.hash);if(p&&view==='app'&&p!==page)nav(p)});
/* Dock */
$('rn').onclick=()=>{if(!BOTS.main.on&&page!=='Bot Builder'&&page!=='Quick Bot')toast(`Running ${BOTS.main.name} (set it up in Bot Builder or Quick Bot).`);setBot('main',!BOTS.main.on)};
const execUI=()=>{$('exv').textContent=EXEC.toUpperCase();$('ext').checked=EXEC==='fast';$('ext').closest('.exec').classList.toggle('fast',EXEC==='fast')};
$('ext').onchange=e=>{EXEC=e.target.checked?'fast':'slow';store.set('exec',EXEC);execUI();toast(EXEC==='fast'?'Fast execution: bots may hold up to 3 contracts at once.':'Slow execution: bots wait for each contract to finish.')};execUI();
const theme=()=>{const r=document.documentElement,dk=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);r.dataset.theme=dk?'light':'dark';store.set('theme',r.dataset.theme);render()};
$('th').onclick=theme;
$('lgx').onclick=()=>{if(DV.on()){if(!confirm('Log out of your Deriv account?'))return;dvLogout()}for(const id in BOTS)BOTS[id].on=false;go('landing')};
$('rk').onclick=()=>$('rkd').showModal();
$('fsb').onclick=()=>{if(!document.fullscreenEnabled)return toast('Fullscreen is not available in this browser.');document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()};
$('sgo').href=CFG.SIGNUP_URL+(CFG.AFFILIATE?'?t='+encodeURIComponent(CFG.AFFILIATE):'');$('yr').textContent=new Date().getFullYear();
/* Landing mobile menu */
const menu=o=>{document.querySelector('.ln').classList.toggle('open',o);$('mnu').setAttribute('aria-expanded',o)};
$('mnu').onclick=()=>menu(!document.querySelector('.ln').classList.contains('open'));
$('lk').onclick=e=>{if(e.target.closest('a,button'))menu(false)};
setInterval(()=>$('ck').textContent=new Date().toISOString().slice(0,19).replace('T',' ')+' GMT',1000);
/* Ticker */
const tkh=[0,1].map(()=>Object.keys(M).map(k=>`<span class="ti"><b style="color:${M[k].c}">${M[k].sh}</b><span data-tk="${k}"></span></span>`).join('')).join('');
$('tk').innerHTML=tkh;$('tk2').innerHTML=tkh;
function tickUI(){document.querySelectorAll("[data-tk]").forEach(e=>{const k=e.dataset.tk,m=M[k];e.textContent=m.p.toFixed(m.d)+(m.p>prev[k]?' ▲':m.p<prev[k]?' ▼':' ·');e.className=m.p>prev[k]?'up':m.p<prev[k]?'dn':''});for(const k in M)prev[k]=M[k].p}
function render(){
 if(view==='landing')landing();
 if(view!=='app')return;
 acctHdr();$('fdot').className='dot'+(live?'':' sim');$('fdot').title=live?'Live Deriv prices':'Simulated prices (Deriv feed not connected)';
 const b=BOTS.main,others=Object.values(BOTS).filter(x=>x.on&&x!==b);runBtn($('rn'),b.on,'Run','run');
 $('bs').textContent=b.on?`${b.name} · ${b.n} trades · ${b.pl>=0?'+':''}${f(b.pl)}`:others.length?`${others.length} bot${others.length>1?'s':''} running`:'Bot is not running';
 $('bsb').classList.toggle('on',b.on||others.length>0);
 if(PG[page]&&PG[page].tick&&$('pg').dataset.ready===page)PG[page].tick()}
/* Landing: hero candlestick panel and markets table */
let hs='V10';const LMK=['V10','V25','V50','V75','V100','V100s','BULL','BEAR'];
$('lt').innerHTML=LMK.map(k=>`<button data-sym="${k}">${M[k].sh}</button>`).join('');
$('lt').onclick=e=>{const b=e.target.closest('button');if(b){hs=b.dataset.sym;render()}};
const chg=k=>{const a=C[k].slice(-60);return(a.at(-1).c-a[0].o)/a[0].o*100};
const pc=v=>(v>=0?'+':'')+v.toFixed(2)+'%';
function landing(){
 const m=M[hs],c=chg(hs),src=live?'Live Deriv market data':'Simulated preview data (Deriv feed not connected)';
 [...$('lt').children].forEach(b=>b.classList.toggle('on',b.dataset.sym===hs));
 $('lcn').textContent=m.n;$('lcp').textContent=m.p.toFixed(m.d);$('lcc').textContent=pc(c);$('lcc').className=c>=0?'up':'dn';
 $('lcs').textContent=src;$('mns').textContent=src;candles($('hc'),C[hs].slice(-60),{d:m.d});
 $('mt').innerHTML=Object.keys(M).map(k=>{const x=chg(k),s=C[k].slice(-30).map(z=>z.c),mn=Math.min(...s),r=(Math.max(...s)-mn)||1,
  pts=s.map((v,i)=>`${i*4},${(24-(v-mn)/r*22).toFixed(1)}`).join(' ');
  return `<tr><td>${M[k].n}</td><td>${M[k].p.toFixed(M[k].d)}</td><td class="${x>=0?'up':'dn'}">${pc(x)}</td><td><svg width="116" height="26"><polyline points="${pts}" fill="none" stroke="${x>=0?'#22ab94':'#f23645'}" stroke-width="1.5"/></svg></td></tr>`}).join('')}
/* Open the linked page (#/quick-bot etc.) once every page file has registered */
addEventListener('DOMContentLoaded',()=>nav(P.find(p=>'#/'+slug(p)===location.hash)||'Dashboard'));
