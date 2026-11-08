/* Dashboard, Speed Lab, Reports, Tutorials + the Summary/Transactions/Journal side panel */
const FAQ=[
 ['What is HT TRADES?','An independent workspace built on the Deriv API. You can build bots, trade by hand and study live synthetic index data. Your Deriv account and funds stay with Deriv.'],
 ['Do I need a Deriv account?','Not to explore. Everything works on the guest demo without signing up. To trade your own demo or real funds, log in with Deriv. You stay on HT TRADES the whole time.'],
 ['Is the demo balance real money?','No. The guest demo starts with 10,000.00 USD of virtual funds. Reset it any time from the balance menu at the top right.'],
 ['How do I run my first bot?','Open Quick Bot, pick a market and contract, set your stake, take profit and stop loss, then press Run. Results show in the Summary panel and in Reports.'],
 ['What do take profit and stop loss do?','The bot stops by itself once its session profit reaches take profit, or its session loss reaches stop loss. Set either to 0 to turn it off.'],
 ['What is martingale?','After a losing round the stake is multiplied by the number you set. It can win back losses quickly, and it can grow losses just as quickly. Check the stake ladder in Risk Calculator before you use it.'],
 ['What does the barrier digit mean?','Digit contracts (Over/Under and Matches/Differs) compare the last digit of the exit price with the barrier digit you choose.'],
 ['Where do I find the blocks I need?','In Bot Builder, use the Blocks menu on the left. Click a category to jump to that block, or search for a setting by name.'],
 ['How do I remove blocks from the workspace?','The four main blocks are always there. Optional blocks (Sell conditions, Analysis, Utility) can be removed: select one and press the bin, or drag it onto the bin.'],
 ['How do I save or load a bot?','Use Download bot (Quick Bot) or the save button in Bot Builder to get a .json file. Load it again from the Dashboard (My computer) or any Load bot button.'],
 ['What do SLOW and FAST execution mean?','SLOW waits for each contract to finish before the next one. FAST lets a bot hold up to three contracts at once. FAST trades more and risks more.'],
 ['How does copy trading work?','Paste a Deriv API token with Trade scope in Copy Trading and press Save. The token goes to the HT TRADES server, never to other users.']];
const CT=[['Rise / Fall','Win if the exit price is higher (Rise) or lower (Fall) than the entry price.'],['Even / Odd','Win if the last digit of the exit price is even (0, 2, 4, 6, 8) or odd.'],['Over / Under','Win if the last digit is above or below the barrier digit you choose.'],['Matches / Differs','Matches wins if the last digit equals your barrier digit. Differs wins if it is any other digit.'],['Accumulators','Your stake grows by the growth rate on every tick the price stays inside the range. If it leaves the range you lose the stake.']];
const GUIDE=[['Start on demo','The workspace opens on a demo account. Practise there until a strategy behaves the way you expect.','Dashboard','Go to dashboard'],['Run a Quick Bot','Pick a market and contract, set a stake and limits, then press Run.','Quick Bot','Open Quick Bot'],['Build a strategy','Edit the four blocks in Bot Builder: trade parameters, purchase, sell and restart conditions.','Bot Builder','Open Bot Builder'],['Read the digits','See how often each last digit appeared and which way the market leans.','Analysis Tools','Open Analysis Tools'],['Size your stakes','Work out a safe stake and how many losses in a row your balance can absorb.','Risk Calculator','Open Risk Calculator'],['Review your results','Every settled contract is listed with its stake and result, ready to export.','Reports','Open Reports']];

/* ---------- Summary / Transactions / Journal panel (Bot Builder, Charts) ---------- */
const RP={tab:'summary',filt:'all',open:true};
const rpHTML=()=>`<aside class="rpan${RP.open?'':' shut'}" id="rpan"><button class="rpc" id="rpc" aria-label="Collapse panel">${ICO('M15 6l-6 6 6 6M20 6l-6 6 6 6')}</button>
 <div class="rpt">${[['summary','Summary'],['tx','Transactions'],['journal','Journal']].map(t=>`<button data-rpt="${t[0]}" class="${RP.tab===t[0]?'on':''}">${t[1]}</button>`).join('')}</div>
 <div class="rpb" id="rpb"></div></aside>`;
function rpInit(){$('rpan').onclick=e=>{const t=e.target.closest('[data-rpt]');if(t){RP.tab=t.dataset.rpt;$('rpan').querySelectorAll('[data-rpt]').forEach(b=>b.classList.toggle('on',b===t));$('rpb').dataset.v='';rpTick()}
  if(e.target.closest('#rpc')){RP.open=!RP.open;$('rpan').classList.toggle('shut',!RP.open)}
  if(e.target.closest('#rpdl')){const L=RP.tab==='journal'?JOURNAL.map(j=>`${new Date(j.t).toISOString()}\t${j.m}`).join('\n'):'Time,Source,Market,Contract,Stake,Profit\n'+trades.map(t=>[new Date(t.t).toISOString(),t.src,t.m,t.d,t.s,t.p].join(',')).join('\n');download(RP.tab==='journal'?'ht-journal.txt':'ht-transactions.csv',L,'text/plain')}
  if(e.target.closest('#rprs')){if(RP.tab==='journal')JOURNAL.length=0;else{if(!confirm('Clear the saved trade history for this account?'))return;trades.length=0;pl=0;saveDemo();const b=BOTS.main;b.n=b.w=0;b.pl=0}$('rpb').dataset.v='';rpTick();toast('Cleared')}};
 $('rpan').onchange=e=>{if(e.target.id==='rpfl'){RP.filt=e.target.value;$('rpb').dataset.v='';rpTick()}}}
function rpTick(){const el=$('rpb');if(!el)return;const b=BOTS.main,T=trades;let h;
 const key=RP.tab+T.length+JOURNAL.length+b.n+b.on+RP.filt+(T[0]&&T[0].t);if(el.dataset.v===key)return;el.dataset.v=key;
 const bar=(dl)=>`<div class="rpa">${dl?'<button class="tbn" id="rpdl">Download</button>':''}${RP.tab==='journal'?`<label class="rpf">Filters <select id="rpfl">${opt([['all','All'],['trade','Trades'],['bot','Bot events'],['err','Errors']],RP.filt)}</select></label>`:''}</div>`;
 if(RP.tab==='summary'){const st=T.reduce((a,t)=>a+t.s,0),po=T.filter(t=>t.p>0).reduce((a,t)=>a+t.s+t.p,0),w=T.filter(t=>t.p>0).length;
  h=(T.length?'':`<div class="rpe">When you're ready to trade, hit <b>Run</b>. You'll be able to track your bot's performance here.</div>`)+
   `<div class="rps">${[['Total stake',f(st)],['Total payout',f(po)],['No. of runs',b.n],['Contracts won',w],['Contracts lost',T.length-w],['Total profit/loss',`<span class="${(st&&po-st>=0)||!st?'up':'dn'}">${po-st>=0?'+':''}${f(po-st)}</span>`]].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div>`}
 else if(RP.tab==='tx')h=bar(1)+(T.length?`<div class="rpl">${T.slice(0,60).map(t=>`<div class="rpi"><div><b>${esc(t.d)}</b><small>${esc(t.m)} · ${new Date(t.t).toLocaleTimeString()}</small></div><div class="r"><small>Stake ${f(t.s)}</small><b class="${t.p>0?'up':'dn'}">${t.p>0?'+':''}${f(t.p)}</b></div></div>`).join('')}</div>`:'<div class="rpe">No transactions yet.</div>');
 else{const J=JOURNAL.filter(j=>RP.filt==='all'||(RP.filt==='err'?/fail|error|stopped:/i.test(j.m):RP.filt==='bot'?/Started|Stopped|limit/.test(j.m):/Won|Lost|Bought|Sold/.test(j.m)));
  h=bar(1)+(J.length?`<div class="rpl">${J.slice(0,80).map(j=>`<div class="jr"><span>${new Date(j.t).toLocaleTimeString()}</span>${esc(j.m)}</div>`).join('')}</div>`:'<div class="rpe">There are no messages to display.</div>')}
 el.innerHTML=h+`<button class="btn bo full" id="rprs">Reset</button>`}

Object.assign(PG,{
'Dashboard':{html:()=>`<div class="dash tilebg">
 <section class="dmain"><h1 class="hello">Hello <span id="hid"></span>!</h1>
  <p class="dsub">Import a bot from your computer or Google Drive, build it from scratch, or start with a quick strategy.</p>
  <div class="tiles">
   <button class="tile" id="t-pc"><i>${ICO('M3 4h18v12H3zM8 20h8M12 16v4')}</i>My computer</button>
   <button class="tile" id="t-gd"><i class="gdr"><svg viewBox="0 0 24 24" fill="none"><path d="M8.3 3.5h7.4L22 14.5l-3.7 6H5.7L2 14.5z" style="fill:#fff;stroke:none"/><path d="M8.3 3.5L15 14.5H2z" style="fill:#0f9d58;stroke:none"/><path d="M15.7 3.5L22 14.5h-7z" style="fill:#fbbc04;stroke:none"/><path d="M2 14.5h20l-3.7 6H5.7z" style="fill:#4285f4;stroke:none"/></svg></i>Google Drive</button>
   <button class="tile" data-page="Bot Builder"><i>${ICO('M9 3h6v3a3 3 0 1 0 3 3h3v6h-3a3 3 0 1 0-3 3v3H9v-3a3 3 0 1 0-3-3H3V9h3a3 3 0 1 0 3-3z')}</i>Bot Builder</button>
   <button class="tile" id="t-qs"><i>${ICO('M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v4h-7zM4 15h7v5H4z')}</i>Quick strategy</button>
   <button class="tile" id="t-km"><i>${ICO('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4')}</i>King of Matches</button>
   <button class="tile" data-page="Speed Lab"><i>${ICO('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7l1.5 3.5L17 12l-3.5 1.5L12 17l-1.5-3.5L7 12l3.5-1.5z')}</i>Speed Lab</button>
  </div>
  <div class="dstrip" id="dstrip"></div>
 </section>
 <aside class="dside">
  <div class="card wel"><span class="wico">${ICO('M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14')}</span><h2>Welcome to HT TRADES</h2><p>Build and deploy automated trades without coding.</p></div>
  <button class="card gs" data-page="Tutorials"><span class="gico">${ICO('M3 4h18v12H3zM10 8l5 3-5 3z')}</span><div><h3>Get Started</h3><p>Learn how to build your first automated trading bot</p></div></button>
  <div class="card qa"><span class="gico">${ICO('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01')}</span><div><h3>Quick Answers</h3><button data-help="3">What is Deriv Bot?</button><button data-help="7">Where do I find the blocks I need?</button><button data-help="8">How do I remove blocks from the workspace?</button></div></div>
 </aside></div>`,
 init(){$('t-pc').onclick=()=>pickBotFile(fi=>importBotFile(fi));
  $('t-pc').ondragover=e=>e.preventDefault();$('t-pc').ondrop=e=>{e.preventDefault();const fi=e.dataTransfer.files[0];fi&&importBotFile(fi)};
  $('t-gd').onclick=()=>toast('Google Drive import needs a Google API key on your site. Use My computer to load a .json bot for now.');
  $('t-qs').onclick=()=>{QSOPEN=true;nav('Bot Builder')};
  $('t-km').onclick=e=>usePreset(LIB.find(x=>x.name==='Matches Hunter 5'),e.currentTarget.querySelector('i'),'Quick Bot')},
 tick(){$('hid').textContent=DV.on()?DV.id:'Trader';const b=Object.values(BOTS).filter(x=>x.on);
  const h=`<span><small>Balance</small><b>${balTxt()} ${curTxt()}</b></span><span><small>Session P/L</small><b class="${pl>=0?'up':'dn'}">${pl>=0?'+':''}${f(pl)}</b></span><span><small>Trades</small><b>${trades.length}</b></span><span><small>Bots running</small><b>${b.length?b.map(x=>esc(x.name)).join(', '):'None'}</b></span>`;
  if($('dstrip').dataset.h!==h){$('dstrip').innerHTML=h;$('dstrip').dataset.h=h}}},

/* ---------- Speed Lab: a 1-tick contract on every tick ---------- */
'Speed Lab':{html:()=>{const c=BOTS.speed.c;c.n=1;return `<div class="pghead"><div><h1>Speed Lab</h1><p>Buys a new 1-tick contract on every tick. Results change fast, so set a stop loss first.</p></div></div>
 <div class="g2">
 <section class="pnl"><h4>${ICO('M4 6h16M4 12h10M4 18h7')}Settings</h4><div class="pb2">
  ${LB('Market',mkSel('speed'))}<div class="g2s">${LB('Trade type',`<select id="spg">${opt(GR,grp(c.t))}</select>`)}${LB('Contract',`<select data-bot="speed" data-c="t">${opt(SIDES[grp(c.t)].map(t=>[t,TT[t][0]]),c.t)}</select>`)}</div>
  <div id="spb">${LB('Prediction (barrier digit)',sel('speed','b',DG))}</div>
  ${LB('Stake',ig('speed','s',.35,.01))}<div class="g2s">${LB('Take profit',ig('speed','tp',0,1))}${LB('Stop loss',ig('speed','sl',0,1))}</div>
  ${LB('Stop after (trades, 0 = no limit)',num('speed','max',0,1))}<div class="fld row"><span class="fl">Martingale</span><div class="mrt">${tog('speed','mo')}<b>×</b>${num('speed','mart',1.1,.1)}</div></div></div></section>
 <section class="pnl"><h4>${ICO('M4 16a8 8 0 1 1 16 0M12 16l4-5')}Live ticks<span class="pill" id="spst"></span></h4><div class="pb2">
  <div class="spd"><div><small>Last digit</small><div class="sdg" id="spd"></div></div><div class="spr"><small id="spn"></small><b id="spp"></b></div></div>
  <div class="sps" id="sps"></div><p class="hint">Each square is a recent tick. Green would have won with your current contract, red would have lost.</p>
  <div class="kv" id="spk"></div><button class="run" id="sprun"></button></div></section></div>`},
 init(){$('spg').onchange=e=>{BOTS.speed.c.t=SIDES[e.target.value][0];saveBots();nav('Speed Lab')};
  $('sprun').onclick=()=>{const b=BOTS.speed;if(!b.on&&!(b.c.sl>0))toast('Tip: set a stop loss so Speed Lab can stop itself.');setBot('speed',!b.on)}},
 tick(){const b=BOTS.speed,c=b.c,m=M[c.m],h=H[c.m].slice(-25);c.n=1;$('spb').hidden=!HAS_B.includes(c.t);
  $('spd').textContent=digit(c.m,m.p);$('spn').textContent=m.n;$('spp').textContent=m.p.toFixed(m.d);
  $('sps').innerHTML=h.slice(1).map((x,i)=>{const d=digit(c.m,x);return`<span class="${TT[c.t][2](h[i],x,d,c.b)?'w':'l'}">${d}</span>`}).join('');
  $('spst').textContent=b.on?'Running':'Stopped';$('spst').className='pill'+(b.on?' on':'');
  $('spk').innerHTML=[['Trades',b.n],['Won',b.w],['Lost',b.n-b.w],['Win rate',b.n?(b.w/b.n*100).toFixed(1)+'%':'—'],['Profit/loss',`<span class="${b.pl>=0?'up':'dn'}">${b.pl>=0?'+':''}${f(b.pl)}</span>`],['Next stake',f(stakeOf(b,c))]].map(r=>`<div><small>${r[0]}</small><b>${r[1]}</b></div>`).join('');
  runBtn($('sprun'),b.on,'Start Speed Lab')}},

/* ---------- Reports ---------- */
'Reports':{html:()=>`<div class="pghead"><div><h1>Reports</h1><p>Every settled contract for ${DV.on()?esc(DV.id):'the guest demo'}, saved in this browser.</p></div><div class="ha"><button class="tbn" id="rp-x">${ICO('M12 4v12M6 10l6 6 6-6M4 20h16')}Export CSV</button><button class="tbn" id="rp-c">Clear history</button></div></div>
 <div class="stats" id="rps"></div>
 <div class="card"><div class="rph"><b>Statement</b><div class="rpf2"><select id="rp-s"><option value="all">All sources</option>${[...new Set(['Manual','Bulk',...trades.map(t=>t.src)])].map(s=>`<option>${esc(s)}</option>`).join('')}</select><select id="rp-r"><option value="all">All results</option><option value="w">Won</option><option value="l">Lost</option></select></div></div>
  <div class="tw"><table><thead><tr><th>Time</th><th>Source</th><th>Market</th><th>Contract</th><th>Stake</th><th>Profit/loss</th></tr></thead><tbody id="rpt"></tbody></table></div></div>`,
 init(){const rows=()=>{const s=$('rp-s').value,r=$('rp-r').value;return trades.filter(t=>(s==='all'||t.src===s)&&(r==='all'||(r==='w'?t.p>0:t.p<=0)))};PG.Reports.rows=rows;
  $('rp-s').onchange=$('rp-r').onchange=()=>render();
  $('rp-x').onclick=()=>{const R=rows();if(!R.length)return toast('No trades to export yet.');const q=v=>`"${String(v).replace(/"/g,'""')}"`;download('ht-trades-statement.csv',['Time,Source,Market,Contract,Stake,Profit/loss',...R.map(t=>[new Date(t.t).toISOString(),t.src,t.m,t.d,t.s.toFixed(2),t.p.toFixed(2)].map(q).join(','))].join('\n'),'text/csv');toast('Exported '+R.length+' trades')};
  $('rp-c').onclick=()=>{if(!trades.length)return toast('History is already empty.');if(!confirm('Clear the trade history saved for this account? Your balance does not change.'))return;trades.length=0;pl=0;saveDemo();render()}},
 tick(){const T=trades,R=PG.Reports.rows(),w=T.filter(t=>t.p>0),net=T.reduce((a,t)=>a+t.p,0),st=T.reduce((a,t)=>a+t.s,0);
  $('rps').innerHTML=[['Trades',T.length],['Won / lost',`${w.length} / ${T.length-w.length}`],['Net profit/loss',`<span class="${net>=0?'up':'dn'}">${net>=0?'+':''}${f(net)}</span>`],['Total staked',f(st)],['Win rate',T.length?(w.length/T.length*100).toFixed(1)+'%':'—']].map(x=>`<div class="card"><small>${x[0]}</small><div class="v">${x[1]}</div></div>`).join('');
  $('rpt').innerHTML=R.length?R.slice(0,200).map(t=>`<tr><td>${new Date(t.t).toLocaleString()}</td><td>${esc(t.src)}</td><td>${esc(t.m)}</td><td>${esc(t.d)}</td><td>${f(t.s)}</td><td class="${t.p>0?'up':'dn'}">${t.p>0?'+':''}${f(t.p)}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">No trades match. Run a bot or buy a contract and results land here.</td></tr>'}},

/* ---------- Tutorials ---------- */
'Tutorials':{html:()=>`<div class="tut"><div class="pghead"><div><h1>Learn the workspace</h1><p>Six short guides, in the order most people need them.</p></div></div>
 <div class="gd">${GUIDE.map((g,i)=>`<div class="card"><span class="gn">${i+1}</span><b>${g[0]}</b><p>${g[1]}</p><button class="btn bo" data-page="${g[2]}">${g[3]}</button></div>`).join('')}</div>
 <h2>Contract types</h2><div class="ctg">${CT.map(c=>`<div><b>${c[0]}</b><p>${c[1]}</p></div>`).join('')}</div>
 <h2>Questions</h2><div class="fq">${FAQ.map(q=>`<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}</div>
 <div class="rk2"><b>Risk warning.</b> Deriv offers complex derivatives that can lose money rapidly. Practise on demo, and only trade real funds you can afford to lose.</div></div>`}
});
newBot('speed',{...DEF,m:'V100',t:'even',b:5,s:.5,n:1,tp:5,sl:5},'Speed Lab');
