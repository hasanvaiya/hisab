/* Hisab Khata - Premium App Controller v3 */
const GH_TOKEN = ["ghp_","RAgSxvBs9fao3HVyp0c9kMRB878oJI0EKStP"].join("");
const GH_REPO  = "hasanvaiya/hisab";
const GH_FILE  = "data.json";
const PIN      = "1234";
const IS_ADMIN = location.pathname.toLowerCase().includes("admin");

/* ── Audio ── */
const SFX={
  _c:null,_g(){if(!this._c)this._c=new(window.AudioContext||window.webkitAudioContext)();},
  _p(f,t="sine"){try{this._g();const n=this._c.currentTime,o=this._c.createOscillator(),g=this._c.createGain();o.connect(g);g.connect(this._c.destination);o.type=t;o.frequency.setValueAtTime(f,n);g.gain.setValueAtTime(0.18,n);g.gain.exponentialRampToValueAtTime(0.001,n+0.45);o.start(n);o.stop(n+0.45);}catch(e){}},
  cash(){this._p(660)},out(){this._p(200,"sawtooth")}
};

/* ── State ── */
let TXS=[], filter="ALL", adminMode=IS_ADMIN;

/* ── Load data ── */
async function boot(){
  try{
    const r=await fetch("data.json?_="+Date.now());
    if(r.ok){const d=await r.json();if(d.transactions&&d.transactions.length){TXS=d.transactions;recalc();render();toast("\uD83C\uDF0D \u09B2\u09BE\u0987\u09AD \u09A1\u09C7\u099F\u09BE \u09B2\u09CB\u09A1 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7","ok");return;}}
  }catch(e){}
  seed();
}
function seed(){
  const R=[["IN",7650,"Sales Income"],["IN",3081,"Sales Income"],["IN",2550,"Client Payment"],["OUT",11100,"Server Expense"],["IN",5000,"Server Deposit"],["OUT",30,"Operating Cost"],["IN",2040,"Client Payment"],["IN",1530,"Sales Income"],["OUT",10005,"Payout"],["IN",8252,"Server Deposit"],["OUT",5510,"Hosting"],["IN",5000,"Server Deposit"],["IN",5000,"Server Deposit"],["OUT",10010,"Server Expense"],["OUT",250,"Operating Cost"],["IN",22000,"Investment"],["OUT",18600,"Payout"],["OUT",1550,"Server Expense"],["OUT",3340,"Operating Cost"],["IN",1530,"Sales Income"],["IN",2040,"Sales Income"],["IN",1530,"Sales Income"],["IN",16000,"Client Payment"],["IN",3075,"Sales Income"],["IN",1500,"Other Add"],["IN",1530,"Sales Income"],["IN",1530,"Sales Income"],["IN",1530,"Sales Income"],["IN",1530,"Sales Income"],["IN",1530,"Sales Income"],["IN",25500,"Investment"],["IN",1530,"Sales Income"],["IN",1520,"Sales Income"],["OUT",55,"Operating Cost"],["OUT",15200,"Payout"],["OUT",10000,"Server Expense"],["OUT",22000,"Payout"],["OUT",6550,"Hosting"],["IN",16750,"Server Deposit"],["OUT",26000,"Payout"],["IN",10200,"Client Payment"],["OUT",6000,"Server Expense"],["OUT",4150,"Operating Cost"],["OUT",50,"Operating Cost"],["IN",2040,"Sales Income"],["OUT",1015,"Server Expense"],["IN",5090,"Server Deposit"],["OUT",5000,"Payout"],["IN",3000,"Sales Income"],["OUT",3380,"Server Expense"],["IN",1538,"Sales Income"],["IN",10250,"Client Payment"],["IN",1020,"Sales Income"],["IN",2000,"Server Deposit"],["IN",2040,"Sales Income"],["IN",3000,"Server Deposit"],["OUT",4200,"Server Expense"],["IN",1030,"Sales Income"],["IN",1020,"Sales Income"],["OUT",459,"Operating Cost"],["IN",750,"Sales Income"],["IN",3030,"Server Deposit"],["OUT",2550,"Server Expense"],["IN",5000,"Server Deposit"],["OUT",20300,"Payout"],["OUT",3320,"Server Expense"],["OUT",500,"Operating Cost"],["IN",1020,"Sales Income"],["IN",2550,"Sales Income"],["IN",25000,"Investment"],["IN",1000,"Other Add"],["IN",26150,"Server Deposit"],["OUT",50000,"Payout"],["IN",17300,"Server Deposit"],["OUT",40,"Operating Cost"]];
  let b=0;const base=Date.now()-R.length*3600000;
  TXS=R.map(([t,a,c],i)=>{if(t==="IN")b+=a;else b-=a;return{id:"TXN-"+(1001+i),type:t,amount:a,category:c,note:t==="IN"?"\u09F3\u09AF\u09BE \u099C\u09AE\u09BE":"\u09F3\u09AF\u09BE \u0996\u09B0\u099A",timestamp:new Date(base+i*3600000).toISOString(),runningBalance:b};});
  recalc();render();pushCloud();
}

/* ── Recalculate running balances ── */
function recalc(){let b=0;TXS.forEach(t=>{if(t.type==="IN")b+=t.amount;else b-=t.amount;t.runningBalance=b;});}

/* ── Totals ── */
function totals(){
  const inn=TXS.reduce((s,t)=>t.type==="IN"?s+t.amount:s,0);
  const out=TXS.reduce((s,t)=>t.type==="OUT"?s+t.amount:s,0);
  return{inn,out,net:inn-out};
}

/* ── Format number ── */
function fc(n){return n.toLocaleString("en-BD");}

/* ── Render everything ── */
function render(){
  recalc();
  const{inn,out,net}=totals();
  const s=v=>document.getElementById(v);
  if(s("bal"))s("bal").textContent=fc(net);
  if(s("tin"))s("tin").textContent="\u09F3"+fc(inn);
  if(s("tout"))s("tout").textContent="\u09F3"+fc(out);
  if(s("nfl")){s("nfl").textContent=(net>=0?"+\u09F3":"-\u09F3")+fc(Math.abs(net));s("nfl").style.color=net<0?"#fca5a5":"#fff";}
  if(s("cnt"))s("cnt").textContent=TXS.length+" \u099F\u09BF";
  renderFeed();
}

/* ── Render transaction feed ── */
function renderFeed(){
  const feed=document.getElementById("feed");if(!feed)return;
  const q=(document.getElementById("sinp")||{value:""}).value.toLowerCase().trim();
  let list=[...TXS].reverse();
  if(filter!=="ALL")list=list.filter(t=>t.type===filter);
  if(q)list=list.filter(t=>t.id.toLowerCase().includes(q)||(t.note||"").toLowerCase().includes(q)||(t.category||"").toLowerCase().includes(q)||String(t.amount).includes(q));
  const ISVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  const OSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';
  if(!list.length){feed.innerHTML='<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg><p>\u0995\u09CB\u09A8\u09CB \u09B9\u09BF\u09B8\u09BE\u09AC \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF</p></div>';return;}
  feed.innerHTML=list.map(t=>{
    const ii=t.type==="IN";
    const acts=adminMode?`<div class="tc-acts"><button class="e-btn" onclick="editTxn('${t.id}')">&#9998;</button><button class="d-btn" onclick="delTxn('${t.id}')">&#128465;</button></div>`:"";
    return `<div class="tc" data-type="${t.type}" data-id="${t.id}">
<div class="tc-ico ${ii?"in":"out"}">${ii?ISVG:OSVG}</div>
<div class="tc-det"><div class="tc-tit">${t.note||(ii?"\u09F3\u09AF\u09BE \u099C\u09AE\u09BE":"\u09F3\u09AF\u09BE \u0996\u09B0\u099A")}</div><div class="tc-sub">${t.category||"Transfer"} <span class="tc-code">&bull; ${t.id}</span></div></div>
<div class="tc-rgt"><div class="tc-amt ${ii?"in":"out"}">${ii?"+":"-"}\u09F3${fc(t.amount)}</div><div class="tc-bal">\u09F3${fc(t.runningBalance||0)}</div>${acts}</div>
</div>`;}).join("");
}

/* ── Cloud push ── */
async function pushCloud(){
  if(!adminMode||!GH_TOKEN)return;
  const payload={pin:PIN,initialBalance:0,transactions:TXS};
  try{
    const g=await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`,{headers:{"Authorization":"token "+GH_TOKEN}});
    let sha=null;if(g.ok){const j=await g.json();sha=j.sha;}
    const body={message:"\u09B9\u09BF\u09B8\u09BE\u09AC \u0986\u09AA\u09A1\u09C7\u099F: "+new Date().toISOString(),content:btoa(unescape(encodeURIComponent(JSON.stringify(payload,null,2)))),branch:"main"};
    if(sha)body.sha=sha;
    const p=await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`,{method:"PUT",headers:{"Authorization":"token "+GH_TOKEN,"Content-Type":"application/json"},body:JSON.stringify(body)});
    if(p.ok)toast("\uD83C\uDF0D \u09AC\u09BF\u09B6\u09CD\u09AC\u09AC\u09CD\u09AF\u09BE\u09AA\u09C0 \u09B2\u09BE\u0987\u09AD \u0986\u09AA\u09A1\u09C7\u099F \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8! \u2705","ok");
  }catch(e){console.error("Cloud push failed",e);}
}

/* ── Add transaction ── */
function addTxn(type,amount,cat,note){
  if(!amount||isNaN(amount)||+amount<=0)return;
  const a=parseFloat(amount);
  TXS.push({id:"TXN-"+Math.floor(1e5+Math.random()*9e5),type,amount:a,category:cat||"Other",note:note||(type==="IN"?"\u09F3\u09AF\u09BE \u099C\u09AE\u09BE":"\u09F3\u09AF\u09BE \u0996\u09B0\u099A"),timestamp:new Date().toISOString(),runningBalance:0});
  if(type==="IN"){SFX.cash();if(a>=20000&&window.confetti)confetti({particleCount:100,spread:70,origin:{y:0.6}});}
  else SFX.out();
  render();pushCloud();
}

/* ── Edit / Delete ── */
function editTxn(id){
  const t=TXS.find(x=>x.id===id);if(!t)return;
  document.getElementById("edit-id").value=t.id;
  document.getElementById("edit-type").value=t.type;
  document.getElementById("edit-amt").value=t.amount;
  document.getElementById("edit-note").value=t.note||"";
  openM("m-edit");
}
function delTxn(id){
  if(!confirm("\u09A1\u09BF\u09B2\u09BF\u099F \u0995\u09B0\u09AC\u09C7\u09A8?"))return;
  TXS=TXS.filter(t=>t.id!==id);
  render();pushCloud();toast("\u09A1\u09BF\u09B2\u09BF\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7","err");
}

/* ── Modal helpers ── */
function openM(id){const m=document.getElementById(id);if(m)m.classList.add("open");}
function closeM(id){const m=document.getElementById(id);if(m)m.classList.remove("open");}

/* ── Toast ── */
function toast(msg,type="ok"){
  const w=document.getElementById("tw");if(!w)return;
  const d=document.createElement("div");d.className="toast "+type;
  d.innerHTML=(type==="ok"?"<span>\u2705</span>":"<span>\uD83D\uDD14</span>")+" "+msg;
  w.appendChild(d);
  setTimeout(()=>{d.style.transition="opacity .3s";d.style.opacity="0";setTimeout(()=>d.remove(),300);},3200);
}

/* ── PDF Export ── */
function exportPDF(){
  toast("PDF \u09A4\u09C8\u09B0\u09BF \u09B9\u099A\u09CD\u099B\u09C7...","ok");
  const el=document.getElementById("printable-area")||document.getElementById("admin-pg");
  if(!el||typeof html2pdf==="undefined"){window.print();return;}
  html2pdf().set({margin:[5,5],filename:"hisab_"+new Date().toISOString().slice(0,10)+".pdf",image:{type:"jpeg",quality:.97},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:"mm",format:"a4"}}).from(el).save().then(()=>toast("PDF \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 \u09B8\u09AB\u09B2!","ok")).catch(()=>window.print());
}

/* ── PIN check ── */
function checkPin(){
  const v=(document.getElementById("pin-inp")||{value:""}).value.trim();
  if(v===PIN){
    const ov=document.getElementById("pin-ov");if(ov)ov.style.display="none";
    const pg=document.getElementById("admin-pg");if(pg)pg.style.display="";
    adminMode=true;render();toast("\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE \uD83D\uDC51 \u09B9\u09BE\u09B8\u09BE\u09A8 \u09AD\u09BE\u0987\u09AF\u09BC\u09BE","ok");
  }else{
    const err=document.getElementById("pin-err");if(err)err.textContent="\u09AD\u09C1\u09B2 PIN! \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8";
    const inp=document.getElementById("pin-inp");if(inp){inp.value="";inp.focus();}
  }
}

/* ── DOM Ready ── */
document.addEventListener("DOMContentLoaded",()=>{
  boot();

  /* Filter tabs */
  document.querySelectorAll(".ftab").forEach(b=>{
    b.addEventListener("click",()=>{
      document.querySelectorAll(".ftab").forEach(x=>x.classList.remove("on"));
      b.classList.add("on");filter=b.dataset.f;renderFeed();
    });
  });

  /* Search */
  const sinp=document.getElementById("sinp");
  if(sinp)sinp.addEventListener("input",renderFeed);
  const qs=document.getElementById("q-srch");
  if(qs)qs.addEventListener("click",()=>{const b=document.getElementById("sbox");if(b){b.classList.toggle("open");if(b.classList.contains("open")&&sinp)sinp.focus();}});

  /* PDF buttons */
  ["pdf-top","nav-pdf","q-pdf"].forEach(id=>{const b=document.getElementById(id);if(b)b.addEventListener("click",exportPDF);});

  /* Admin open buttons */
  const bi=document.getElementById("btn-in");if(bi)bi.addEventListener("click",()=>openM("m-in"));
  const bo=document.getElementById("btn-out");if(bo)bo.addEventListener("click",()=>openM("m-out"));
  const na=document.getElementById("nav-add");if(na)na.addEventListener("click",()=>openM("m-in"));

  /* Form: Money IN */
  const fi=document.getElementById("form-in");
  if(fi)fi.addEventListener("submit",e=>{
    e.preventDefault();
    const a=document.getElementById("in-amt").value;
    const c=document.getElementById("in-cat").value;
    const n=document.getElementById("in-note").value;
    addTxn("IN",a,c,n);closeM("m-in");fi.reset();
    toast("+\u09F3"+parseFloat(a).toLocaleString()+" \u099C\u09AE\u09BE \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8! \uD83C\uDF89","ok");
  });

  /* Form: Money OUT */
  const fo=document.getElementById("form-out");
  if(fo)fo.addEventListener("submit",e=>{
    e.preventDefault();
    const a=document.getElementById("out-amt").value;
    const c=document.getElementById("out-cat").value;
    const n=document.getElementById("out-note").value;
    addTxn("OUT",a,c,n);closeM("m-out");fo.reset();
    toast("-\u09F3"+parseFloat(a).toLocaleString()+" \u0996\u09B0\u099A \u09B9\u09AF\u09BC\u09C7\u099B\u09C7","err");
  });

  /* Form: Edit */
  const fe=document.getElementById("form-edit");
  if(fe)fe.addEventListener("submit",e=>{
    e.preventDefault();
    const id=document.getElementById("edit-id").value;
    const t=TXS.find(x=>x.id===id);
    if(t){t.type=document.getElementById("edit-type").value;t.amount=parseFloat(document.getElementById("edit-amt").value);t.note=document.getElementById("edit-note").value;}
    render();pushCloud();closeM("m-edit");toast("\u0986\u09AA\u09A1\u09C7\u099F \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8! \u2705","ok");
  });

  /* Close modal on backdrop click */
  document.querySelectorAll(".moverlay").forEach(m=>{
    m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open");});
  });

  /* PIN auto-submit on 4 digits */
  const pi=document.getElementById("pin-inp");
  if(pi)pi.addEventListener("input",()=>{if(pi.value.length===4)setTimeout(checkPin,150);});
});
