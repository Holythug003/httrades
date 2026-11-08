/* Help drawer (the Help button) and the FAQ on the landing page, both built from FAQ in pages2.js */
const faqHTML=(list,attr)=>list.map(([q,a],i)=>`<details ${attr}="${i}"><summary>${q}</summary><p>${a}</p></details>`).join('');
$('hl').innerHTML=faqHTML(FAQ,'data-q');
$('lfq').innerHTML=faqHTML(FAQ.slice(0,6),'data-lq');
function helpTab(t){$('hp-scan').hidden=t!=='scan';$('hp-faq').hidden=t!=='faq';document.querySelectorAll('.htabs [data-ht]').forEach(b=>b.classList.toggle('on',b.dataset.ht===t))}
/* Help (FAQ) is only opened from the Dashboard's Quick Answers; the AI button opens the market scanner */
function openHelp(i){$('help').hidden=false;helpTab('faq');$('hq').value='';filterHelp('');
 if(i>=0){const d=document.querySelector(`#hl [data-q="${i}"]`);if(d){d.open=true;d.scrollIntoView({block:'nearest'})}}else $('hq').focus()}
function filterHelp(q){q=q.trim().toLowerCase();let n=0;
 document.querySelectorAll('#hl details').forEach(d=>{const hit=!q||d.textContent.toLowerCase().includes(q);d.hidden=!hit;if(hit)n++});
 let e=$('hl').querySelector('.hempty');if(!n){if(!e){e=document.createElement('p');e.className='hempty';$('hl').append(e)}e.textContent='No answer matches that. Try a shorter word, or open the tutorials.'}else if(e)e.remove()}

/* ---------- AI Market Scanner ---------- */
const SC={strat:'all',n:1000,res:[],busy:false,t:0};
const SCS=[['all','Best'],['ou','Over/Under'],['eo','Even/Odd'],['rf','Rise/Fall'],['md','Match/Differ']];
const scLvl=e=>e>=6?['Strong','s']:e>=3?['Moderate','m']:['Weak','w'];
function scDraw(){
 $('scf').innerHTML=SCS.map(([k,l])=>`<button type="button" data-sf="${k}" class="${SC.strat===k?'on':''}">${l}</button>`).join('');
 $('scl2').innerHTML=SC.res.length?SC.res.map((s,i)=>{const[l,c]=scLvl(s.edge);
  return `<div class="scrow${i<3&&s.edge>=3?' top':''}"><div class="scm"><b>${M[s.k].n}</b><small>${sigTxt(s)} · wins ${s.w.toFixed(1)}% · break-even ${s.be}%</small><span class="scbar"><i style="width:${Math.min(100,s.w).toFixed(1)}%"></i><u style="left:${s.be}%"></u></span></div><div class="scv"><span class="scb ${c}">${l}</span><em class="${s.edge>=0?'up':'dn'}">${s.edge>=0?'+':''}${s.edge.toFixed(1)}%</em></div><button type="button" class="btn bo scbt" data-sc="${i}">Trade</button></div>`}).join(''):'<p class="hempty">No scan yet. Press Rescan.</p>';
 if(SC.t){const d=new Date(SC.t);$('sct').textContent=`${SC.res.length} markets · last ${SC.n} ticks · ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}`}}
async function scanRun(){
 if(SC.busy)return;SC.busy=true;$('ai').classList.add('scanning');$('rad').classList.add('on');$('scr').disabled=true;
 const ks=Object.keys(M),out=[],sts=SC.strat==='all'?['ou','eo','rf','md']:[SC.strat];
 for(let i=0;i<ks.length;i++){$('scs').textContent='Scanning '+M[ks[i]].n;$('scp').style.width=((i+1)/ks.length*100)+'%';await wait(80);
  let best=null;sts.forEach(st=>{const b=bestFor(st,ks[i],SC.n);b.st=st;if(!best||b.edge>best.edge)best=b});out.push(best)}
 SC.res=out.sort((a,b)=>b.edge-a.edge);SC.t=Date.now();SC.busy=false;
 const strong=SC.res.filter(s=>s.edge>=6).length;
 $('scs').textContent=strong?`${strong} strong signal${strong>1?'s':''} found`:'No strong signal right now';
 $('ai').classList.remove('scanning');$('rad').classList.remove('on');$('scr').disabled=false;$('scp').style.width='0';scDraw()}
function scOpen(){$('help').hidden=false;helpTab('scan');scDraw();if(!SC.t||Date.now()-SC.t>15000)scanRun()}
$('ai').onclick=()=>$('help').hidden?scOpen():($('help').hidden=true);
$('scr').onclick=scanRun;
$('scf').onclick=e=>{const b=e.target.closest('[data-sf]');if(!b)return;SC.strat=b.dataset.sf;SC.t=0;scDraw();scanRun()};
$('scl2').onclick=e=>{const b=e.target.closest('[data-sc]');if(!b)return;const s=SC.res[+b.dataset.sc];if(!s)return;
 const S=PG['Bulk Trader'].st;S.m=s.k;S.t=s.st;S.n=SC.n;if(HAS_B.includes(s.t))S.b=+s.b;$('help').hidden=true;nav('Bulk Trader');toast(`Bulk Trader set to ${sigTxt(s)} on ${M[s.k].n}. Check the stake, then buy.`)};
document.querySelectorAll('.htabs [data-ht]').forEach(b=>b.onclick=()=>helpTab(b.dataset.ht));
setInterval(()=>{if(!$('help').hidden&&!$('hp-scan').hidden&&!SC.busy&&view==='app')scanRun()},30000);
$('hx').onclick=()=>$('help').hidden=true;
$('hq').oninput=e=>filterHelp(e.target.value);
document.addEventListener('click',e=>{if(!$('help').hidden&&!e.target.closest('#help,#ai,[data-help]'))$('help').hidden=true});
