/* Shared state, markets, storage, view switching, spinners */
const $=id=>document.getElementById(id);
const store={get(k,d){try{const v=localStorage.getItem('ht_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem('ht_'+k,JSON.stringify(v))}catch(e){}}};
/* Markets: s = Deriv symbol, g = group, sh = ticker label, d = decimals (updated live from Deriv's pip size) */
const M={
 V10:{s:'R_10',n:'Volatility 10 Index',sh:'VOL 10',g:'Continuous Indices',p:4940.014,v:.0006,d:3,c:'#e8a10c'},
 V25:{s:'R_25',n:'Volatility 25 Index',sh:'VOL 25',g:'Continuous Indices',p:2713.504,v:.0012,d:3,c:'#22ab94'},
 V50:{s:'R_50',n:'Volatility 50 Index',sh:'VOL 50',g:'Continuous Indices',p:82.1412,v:.0018,d:4,c:'#2bb673'},
 V75:{s:'R_75',n:'Volatility 75 Index',sh:'VOL 75',g:'Continuous Indices',p:39983.9856,v:.0026,d:4,c:'#2f6fe4'},
 V100:{s:'R_100',n:'Volatility 100 Index',sh:'VOL 100',g:'Continuous Indices',p:643.34,v:.0032,d:2,c:'#e5484d'},
 V10s:{s:'1HZ10V',n:'Volatility 10 (1s) Index',sh:'VOL 10 (1s)',g:'Continuous Indices',p:9312.48,v:.0006,d:2,c:'#e8a10c'},
 V25s:{s:'1HZ25V',n:'Volatility 25 (1s) Index',sh:'VOL 25 (1s)',g:'Continuous Indices',p:612844.21,v:.0012,d:2,c:'#22ab94'},
 V50s:{s:'1HZ50V',n:'Volatility 50 (1s) Index',sh:'VOL 50 (1s)',g:'Continuous Indices',p:181.75,v:.0018,d:2,c:'#2bb673'},
 V75s:{s:'1HZ75V',n:'Volatility 75 (1s) Index',sh:'VOL 75 (1s)',g:'Continuous Indices',p:3841.62,v:.0026,d:2,c:'#2f6fe4'},
 V100s:{s:'1HZ100V',n:'Volatility 100 (1s) Index',sh:'VOL 100 (1s)',g:'Continuous Indices',p:1231.32,v:.0032,d:2,c:'#e5484d'},
 V150s:{s:'1HZ150V',n:'Volatility 150 (1s) Index',sh:'VOL 150',g:'Continuous Indices',p:892.119,v:.0045,d:3,c:'#4f8ff7'},
 V250s:{s:'1HZ250V',n:'Volatility 250 (1s) Index',sh:'VOL 250',g:'Continuous Indices',p:5821.40,v:.0075,d:2,c:'#a855f7'},
 BEAR:{s:'RDBEAR',n:'Bear Market Index',sh:'BEAR MARKET',g:'Daily Reset Indices',p:972.8890,v:.0011,d:4,c:'#f28c28'},
 BULL:{s:'RDBULL',n:'Bull Market Index',sh:'BULL MARKET',g:'Daily Reset Indices',p:1142.0782,v:.0011,d:4,c:'#14b8d4'}};
const HMAX=5000;
const H={},prev={},seen={};for(const k in M){H[k]=[M[k].p];prev[k]=M[k].p}
let cur='V10',bal=700,pl=0,trades=[],open=null,bot=false,view='boot';
/* Pages register here: PG[name] = {html(), init(), tick()} */
const PG={};
const TICKS=[];  /* pages that need every tick (charts) register a callback here */
{const s=store.get('demo',null);if(s&&typeof s.bal==='number'){bal=s.bal;pl=s.pl||0;trades=Array.isArray(s.trades)?s.trades:[]}}
let _sv;const saveDemo=()=>{const k=bookKey(),T=trades,P=pl;clearTimeout(_sv);_sv=setTimeout(()=>store.set(k,k==='demo'?{bal,pl:P,trades:T.slice(0,300)}:{pl:P,trades:T.slice(0,300)}),300)};
{const t=store.get('theme',null);if(t)document.documentElement.dataset.theme=t}
const slug=p=>p.toLowerCase().replace(/\s+/g,'-');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const closeDialogs=()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close());
const go=v=>{view=v;closeDialogs();['boot','landing','app'].forEach(x=>$(x).hidden=x!==v);document.body.dataset.view=v;scrollTo(0,0);
 if(v==='app'&&typeof page!=='undefined'){history.replaceState(null,'','#/'+slug(page));setTimeout(()=>nav(page),0)}else if(/^#\//.test(location.hash))history.replaceState(null,'',location.pathname+location.search);
 render()};
const toast=t=>{const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,3400)};
/* Loading spinners: on a button while something runs, and a short page loader between tabs */
const SPIN='<span class="spin" aria-hidden="true"></span>';
function busy(btn,on,label){if(!btn)return;if(on){btn.dataset.lbl=btn.innerHTML;btn.innerHTML=SPIN+(label||'Loading…');btn.disabled=true;btn.classList.add('busy')}
 else{if(btn.dataset.lbl!=null)btn.innerHTML=btn.dataset.lbl;btn.disabled=false;btn.classList.remove('busy')}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
document.addEventListener('click',e=>{
 const g=e.target.closest('[data-go]');if(g){e.preventDefault();return go(g.dataset.go)}
 if(e.target.closest('[data-login]')){e.preventDefault();closeDialogs();return DV.on()?go('app'):dvLogin()}
 if(e.target.closest('[data-signup]')){e.preventDefault();closeDialogs();return $('sg').showModal()}
 const h=e.target.closest('[data-help]');if(h)return openHelp(+h.dataset.help);
 const p=e.target.closest('[data-page]');if(p){e.preventDefault();$('help').hidden=true;drawer(false);closeDialogs();nav(p.dataset.page);scrollTo(0,0)}});
