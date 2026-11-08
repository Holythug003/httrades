/* Charts: sparkline (line), candlesticks (boot/landing), and the full trading chart (drawChart) */
const f=v=>(+v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const TS={};  /* tick timestamps (seconds), parallel to H[k] */
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function setup(cv){const dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return null;
 if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=w*dpr;cv.height=h*dpr}const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);return{x,w,h}}
function line(c,a,col,n){const s=setup(c);if(!s)return;const{x,w,h}=s,d=a.slice(-(n||60)),mn=Math.min(...d),mx=Math.max(...d),r=(mx-mn)||1,px=i=>i/(Math.max(d.length-1,1))*w,py=v=>h-6-(v-mn)/r*(h-12);
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,col+'55');g.addColorStop(1,col+'00');x.beginPath();d.forEach((v,i)=>i?x.lineTo(px(i),py(v)):x.moveTo(px(i),py(v)));x.strokeStyle=col;x.lineWidth=1.6;x.stroke();x.lineTo(w,h);x.lineTo(0,h);x.fillStyle=g;x.fill()}
function candles(cv,a,o={}){const s=setup(cv);if(!s||!a.length)return;const{x,w,h}=s;
 const ax=o.axis!==false,pr=ax?60:8,pt=10,pb=10,W=w-pr,lo=o.r?o.r[0]:Math.min(...a.map(c=>c.l)),hi=o.r?o.r[1]:Math.max(...a.map(c=>c.h)),pad=(hi-lo)*.08||1,mn=lo-pad,mx=hi+pad,
 py=v=>pt+(mx-v)/(mx-mn)*(h-pt-pb),bw=W/(o.n||a.length),U='#22ab94',D='#f23645';
 x.font='11px Inter,"Segoe UI",Roboto,Arial,sans-serif';x.textBaseline='middle';
 if(ax)for(let i=0;i<=4;i++){const v=mn+(mx-mn)*i/4,y=py(v);x.strokeStyle='#1a2536';x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();x.fillStyle='#7d8aa0';x.fillText(v.toFixed(o.d||2),W+8,y)}
 a.forEach((c,i)=>{const cx=i*bw+bw/2,col=c.c>=c.o?U:D;x.strokeStyle=x.fillStyle=col;x.beginPath();x.moveTo(cx,py(c.h));x.lineTo(cx,py(c.l));x.stroke();const y1=py(Math.max(c.o,c.c));x.fillRect(cx-bw*.36,y1,bw*.72,Math.max(py(Math.min(c.o,c.c))-y1,1))});
 if(ax){const l=a.at(-1),y=py(l.c),col=l.c>=l.o?U:D;x.setLineDash([3,3]);x.strokeStyle=col;x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();x.setLineDash([]);x.fillStyle=col;x.fillRect(W+2,y-9,pr-4,18);x.fillStyle='#fff';x.fillText(l.c.toFixed(o.d||2),W+6,y)}}

/* Full chart. o = {k, type:'area'|'candle', n (ticks/candles shown), band:[lo,hi], marks:[{p,col,txt}], hover:{x,y}, ind:{sma,ema,bb}} */
const hhmm=t=>{const d=new Date(t*1000);return d.toTimeString().slice(0,8)};
function drawChart(cv,o){const s=setup(cv);if(!s)return;const{x,w,h}=s,k=o.k,m=M[k],dark=document.documentElement.dataset.theme==='dark'||(!document.documentElement.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);
 const ink=dark?'#e8eefb':'#1c2433',grid=dark?'#1d2a40':'#eef1f5',lab=dark?'#8b98b5':'#6b7588',pr=78,pb=26,W=w-pr,Hh=h-pb;
 let pts,lo,hi;
 if(o.type==='candle'){pts=C[k].slice(-(o.n||60));lo=Math.min(...pts.map(c=>c.l));hi=Math.max(...pts.map(c=>c.h))}
 else{const n=Math.min(o.n||300,H[k].length);pts=H[k].slice(-n);lo=Math.min(...pts);hi=Math.max(...pts)}
 if(o.band){lo=Math.min(lo,o.band[0]);hi=Math.max(hi,o.band[1])}
 (o.marks||[]).forEach(mk=>{lo=Math.min(lo,mk.p);hi=Math.max(hi,mk.p)});
 const pad=(hi-lo)*.12||m.p*.0005;lo-=pad;hi+=pad;const py=v=>12+(hi-v)/(hi-lo)*(Hh-24);
 x.font='11px Inter,"Segoe UI",Roboto,Arial,sans-serif';x.textBaseline='middle';
 /* grid + price axis */
 const step=(hi-lo)/6;for(let i=0;i<=6;i++){const v=lo+step*i,y=py(v);x.strokeStyle=grid;x.lineWidth=1;x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();x.fillStyle=lab;x.fillText(v.toFixed(m.d),W+10,y)}
 const N=pts.length,bx=i=>W*.86*(i/(Math.max(N-1,1)));  /* leave space on the right like a trading chart */
 /* time axis */
 const ts=TS[k]||[],tsl=ts.slice(-N);x.fillStyle=lab;x.textAlign='center';
 const NL=Math.max(2,Math.min(6,Math.floor(W/84)));for(let i=0;i<NL;i++){const j=Math.round(i*(N-1)/(NL-1)),t=o.type==='candle'?pts[j]&&pts[j].t:tsl[j];if(!t)continue;const X=bx(j);x.strokeStyle=grid;x.beginPath();x.moveTo(X,0);x.lineTo(X,Hh);x.stroke();x.fillText(hhmm(t),Math.min(Math.max(X,28),W-28),Hh+14)}
 x.textAlign='left';
 /* accumulator band */
 if(o.band){const y1=py(o.band[1]),y2=py(o.band[0]),X0=bx(N-1);x.fillStyle='rgba(47,111,228,.10)';x.fillRect(X0,y1,W-X0,y2-y1);x.strokeStyle='#2f6fe4';x.lineWidth=1.2;
  [y1,y2].forEach(y=>{x.beginPath();x.moveTo(X0,y);x.lineTo(W,y);x.stroke()});x.fillStyle='#2f6fe4';x.font='600 12px Inter,Arial';const dd=(o.band[1]-o.band[0])/2;
  x.textAlign='right';x.fillText('+'+dd.toFixed(m.d===2?3:m.d),W-6,y1-10);x.fillText('-'+dd.toFixed(m.d===2?3:m.d),W-6,y2+10);x.textAlign='left';x.font='11px Inter,Arial'}
 /* series */
 if(o.type==='candle'){const bw=W*.86/Math.max(N,1);pts.forEach((c,i)=>{const cx=bx(i),col=c.c>=c.o?'#22ab94':'#f23645';x.strokeStyle=x.fillStyle=col;x.beginPath();x.moveTo(cx,py(c.h));x.lineTo(cx,py(c.l));x.stroke();const y1=py(Math.max(c.o,c.c));x.fillRect(cx-bw*.35,y1,bw*.7,Math.max(py(Math.min(c.o,c.c))-y1,1))})}
 else{const g=x.createLinearGradient(0,0,0,Hh);g.addColorStop(0,dark?'rgba(232,238,251,.14)':'rgba(28,36,51,.10)');g.addColorStop(1,'rgba(28,36,51,0)');
  x.beginPath();pts.forEach((v,i)=>i?x.lineTo(bx(i),py(v)):x.moveTo(bx(i),py(v)));x.strokeStyle=ink;x.lineWidth=1.4;x.stroke();x.lineTo(bx(N-1),Hh);x.lineTo(0,Hh);x.fillStyle=g;x.fill()}
 /* indicators */
 const closes=o.type==='candle'?pts.map(c=>c.c):pts,series=(arr,col)=>{x.beginPath();let st=false;arr.forEach((v,i)=>{if(v==null)return;st?x.lineTo(bx(i),py(v)):x.moveTo(bx(i),py(v));st=true});x.strokeStyle=col;x.lineWidth=1.3;x.stroke()};
 if(o.ind){const P=20;if(o.ind.sma)series(closes.map((_,i)=>i<P-1?null:closes.slice(i-P+1,i+1).reduce((a,b)=>a+b,0)/P),'#f28c28');
  if(o.ind.ema){let e=closes[0];series(closes.map(v=>e=v*2/(P+1)+e*(1-2/(P+1))),'#a855f7')}
  if(o.ind.bb){const up=[],dn=[];closes.forEach((_,i)=>{if(i<P-1){up.push(null);dn.push(null);return}const s=closes.slice(i-P+1,i+1),mu=s.reduce((a,b)=>a+b,0)/P,sd=Math.sqrt(s.reduce((a,b)=>a+(b-mu)**2,0)/P);up.push(mu+2*sd);dn.push(mu-2*sd)});series(up,'#2f6fe4');series(dn,'#2f6fe4')}}
 /* contract entry marks */
 (o.marks||[]).forEach(mk=>{const y=py(mk.p);x.setLineDash([4,4]);x.strokeStyle=mk.col;x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();x.setLineDash([]);x.fillStyle=mk.col;x.font='600 11px Inter,Arial';x.fillText(mk.txt,8,y-9);x.font='11px Inter,Arial'});
 /* live price */
 const last=o.type==='candle'?pts.at(-1).c:pts.at(-1),ly=py(last),lx=bx(N-1);
 x.setLineDash([2,3]);x.strokeStyle=o.band?'#2f6fe4':ink;x.beginPath();x.moveTo(lx,ly);x.lineTo(W,ly);x.stroke();x.setLineDash([]);
 x.fillStyle=ink;x.beginPath();x.arc(lx,ly,3.5,0,7);x.fill();
 x.fillStyle=dark?'#e8eefb':'#0b0f17';x.fillRect(W+2,ly-11,pr-4,22);x.fillStyle=dark?'#0b1220':'#fff';x.font='600 12px Inter,Arial';x.fillText(last.toFixed(m.d),W+8,ly);
 /* crosshair */
 if(o.hover&&o.hover.x<W&&o.hover.y<Hh){const v=hi-(o.hover.y-12)/(Hh-24)*(hi-lo);x.setLineDash([3,3]);x.strokeStyle=lab;x.beginPath();x.moveTo(o.hover.x,0);x.lineTo(o.hover.x,Hh);x.moveTo(0,o.hover.y);x.lineTo(W,o.hover.y);x.stroke();x.setLineDash([]);
  x.fillStyle='#2f6fe4';x.fillRect(W+2,o.hover.y-10,pr-4,20);x.fillStyle='#fff';x.font='11px Inter,Arial';x.fillText(v.toFixed(m.d),W+8,o.hover.y)}}
/* Wire a chart canvas: hover crosshair + wheel zoom. st = state object used by drawChart */
function chartUI(cv,st,redraw){cv.onmousemove=e=>{const r=cv.getBoundingClientRect();st.hover={x:e.clientX-r.left,y:e.clientY-r.top};redraw()};cv.onmouseleave=()=>{st.hover=null;redraw()};
 cv.onwheel=e=>{e.preventDefault();zoomChart(st,e.deltaY>0?1:-1);redraw()}}
const zoomChart=(st,d)=>{const lim=st.type==='candle'?[20,120]:[40,HMAX];st.n=Math.round(Math.min(lim[1],Math.max(lim[0],st.n*(d>0?1.25:.8))))};
