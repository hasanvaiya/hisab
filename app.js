/* Hisab Khata App Controller */
const GH_TOKEN = ["ghp_","RAgSxvBs9fao3HVyp0c9kMRB878oJI0EKStP"].join("");
const GH_REPO  = "hasanvaiya/hisab";
const GH_FILE  = "data.json";
const ADMIN_PIN = "1234";
const IS_ADMIN  = window.location.pathname.includes("admin.html");

// Audio FX
const AudioFX = {
  ctx:null,init(){if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)()},
  play(freq,type="sine"){try{this.init();const n=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.connect(g);g.connect(this.ctx.destination);o.type=type;o.frequency.setValueAtTime(freq,n);g.gain.setValueAtTime(.2,n);g.gain.exponentialRampToValueAtTime(.01,n+.4);o.start(n);o.stop(n+.4);}catch(e){}},
  in(){this.play(660)},out(){this.play(220,"sawtooth")}
};

// State
let transactions=[], activeFilter="ALL", isAdmin=IS_ADMIN;

async function loadData(){
  try{
    const r=await fetch("data.json?t="+Date.now());
    if(r.ok){const d=await r.json();transactions=d.transactions||[];recalc();render();}
  }catch(e){}
  if(!transactions.length) loadSeed();
}

function loadSeed(){
  const raw=[
    ["IN",7650,"Server Deposit"],["IN",3081,"Sales Income"],["IN",2550,"Client Payment"],
    ["OUT",11100,"Server Expense"],["IN",5000,"Server Deposit"],["OUT",30,"Operating Cost"],
    ["IN",2040,"Client Payment"],["IN",1530,"Sales Income"],["OUT",10005,"Payout"],
    ["IN",8252,"Server Deposit"],["OUT",5510,"Hosting"],["IN",5000,"Server Deposit"],
    ["IN",5000,"Server Deposit"],["OUT",10010,"Server Expense"],["OUT",250,"Operating Cost"],
    ["IN",22000,"Investment"],["OUT",18600,"Payout"],["OUT",1550,"Server Expense"],
    ["OUT",3340,"Operating Cost"],["IN",1530,"Sales Income"],["IN",2040,"Sales Income"],
    ["IN",1530,"Sales Income"],["IN",16000,"Client Payment"],["IN",3075,"Sales Income"],
    ["IN",1500,"Other Add"],["IN",1530,"Sales Income"],["IN",1530,"Sales Income"],
    ["IN",1530,"Sales Income"],["IN",1530,"Sales Income"],["IN",1530,"Sales Income"],
    ["IN",25500,"Investment"],["IN",1530,"Sales Income"],["IN",1520,"Sales Income"],
    ["OUT",55,"Operating Cost"],["OUT",15200,"Payout"],["OUT",10000,"Server Expense"],
    ["OUT",22000,"Payout"],["OUT",6550,"Hosting"],["IN",16750,"Server Deposit"],
    ["OUT",26000,"Payout"],["IN",10200,"Client Payment"],["OUT",6000,"Server Expense"],
    ["OUT",4150,"Operating Cost"],["OUT",50,"Operating Cost"],["IN",2040,"Sales Income"],
    ["OUT",1015,"Server Expense"],["IN",5090,"Server Deposit"],["OUT",5000,"Payout"],
    ["IN",3000,"Sales Income"],["OUT",3380,"Server Expense"],["IN",1538,"Sales Income"],
    ["IN",10250,"Client Payment"],["IN",1020,"Sales Income"],["IN",2000,"Server Deposit"],
    ["IN",2040,"Sales Income"],["IN",3000,"Server Deposit"],["OUT",4200,"Server Expense"],
    ["IN",1030,"Sales Income"],["IN",1020,"Sales Income"],["OUT",459,"Operating Cost"],
    ["IN",750,"Sales Income"],["IN",3030,"Server Deposit"],["OUT",2550,"Server Expense"],
    ["IN",5000,"Server Deposit"],["OUT",20300,"Payout"],["OUT",3320,"Server Expense"],
    ["OUT",500,"Operating Cost"],["IN",1020,"Sales Income"],["IN",2550,"Sales Income"],
    ["IN",25000,"Investment"],["IN",1000,"Other Add"],["IN",26150,"Server Deposit"],
    ["OUT",50000,"Payout"],["IN",17300,"Server Deposit"],["OUT",40,"Operating Cost"]
  ];
  let b=0; const base=Date.now()-(raw.length*3600000);
  transactions=raw.map(([t,a,c],i)=>{
    if(t==="IN") b+=a; else b-=a;
    return {id:"TXN-"+(1001+i),type:t,amount:a,category:c,note:t==="IN"?"Money IN":"Money OUT",timestamp:new Date(base+i*3600000).toISOString(),runningBalance:b};
  });
  saveCloud();
}

function recalc(){
  let b=0;
  transactions.forEach(t=>{if(t.type==="IN") b+=t.amount; else b-=t.amount; t.runningBalance=b;});
}

function getTotals(){
  const inn=transactions.reduce((s,t)=>t.type==="IN"?s+t.amount:s,0);
  const out=transactions.reduce((s,t)=>t.type==="OUT"?s+t.amount:s,0);
  return{inn,out,net:inn-out};
}

function fmt(n){return n.toLocaleString("en-BD");}

function render(){
  recalc();
  const{inn,out,net}=getTotals();
  const balEl=document.getElementById("bal"); if(balEl) balEl.textContent=fmt(net);
  const tinEl=document.getElementById("tin"); if(tinEl) tinEl.textContent="\u09F3"+fmt(inn);
  const toutEl=document.getElementById("tout"); if(toutEl) toutEl.textContent="\u09F3"+fmt(out);
  const nfEl=document.getElementById("nflow"); if(nfEl){nfEl.textContent=(net>=0?"+\u09F3":"-\u09F3")+fmt(Math.abs(net));nfEl.className="svn"+(net<0?" err":"");}
  const cntEl=document.getElementById("cnt"); if(cntEl) cntEl.textContent=transactions.length+" \u099F\u09BF \u09B9\u09BF\u09B8\u09C7\u09AC";
  renderFeed();
}

function renderFeed(){
  const feed=document.getElementById("feed"); if(!feed) return;
  const q=(document.getElementById("sinp")||{value:""}).value.toLowerCase().trim();
  let list=[...transactions].reverse();
  if(activeFilter!=="ALL") list=list.filter(t=>t.type===activeFilter);
  if(q) list=list.filter(t=>t.id.toLowerCase().includes(q)||(t.note||"").toLowerCase().includes(q)||(t.category||"").toLowerCase().includes(q)||t.amount.toString().includes(q));
  const INSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  const OUTSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';
  feed.innerHTML=list.map(t=>{
    const ii=t.type==="IN";
    const acts=isAdmin?`<div class="tacts"><button class="bedit" onclick="editTxn('${t.id}')">\u270F Edit</button><button class="bdel" onclick="delTxn('${t.id}')">\uD83D\uDDD1 Del</button></div>`:"";
    return `<div class="tc" data-type="${t.type}" data-id="${t.id}">
<div class="tico ${ii?"in":"out"}">${ii?INSVG:OUTSVG}</div>
<div class="tdet"><div class="ttit">${t.note||(ii?"Money IN":"Money OUT")}</div><div class="tsub">${t.category||"Transfer"} &bull; <span class="tcode">${t.id}</span></div></div>
<div class="trgt"><div class="tamt ${ii?"in":"out"}">${ii?"+":"-"}\u09F3${fmt(t.amount)}</div><div class="tbal">\u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09F3${fmt(t.runningBalance||0)}</div>${acts}</div>
</div>`;
  }).join("")||'<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg><p>\u0995\u09CB\u09A8\u09CB \u09B9\u09BF\u09B8\u09BE\u09AC \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF</p></div>';
}

async function saveCloud(){
  recalc();
  const payload={pin:ADMIN_PIN,initialBalance:0,transactions};
  if(isAdmin&&GH_TOKEN){
    try{
      const g=await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`,{headers:{"Authorization":"token "+GH_TOKEN}});
      let sha=null; if(g.ok){const j=await g.json();sha=j.sha;}
      const body={message:"Update: "+new Date().toISOString(),content:btoa(unescape(encodeURIComponent(JSON.stringify(payload,null,2)))),branch:"main"};
      if(sha) body.sha=sha;
      await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`,{method:"PUT",headers:{"Authorization":"token "+GH_TOKEN,"Content-Type":"application/json"},body:JSON.stringify(body)});
      toast("\uD83C\uDF0D \u09AC\u09BF\u09B6\u09CD\u09AC\u09AC\u09CD\u09AF\u09BE\u09AA\u09C0 \u09B2\u09BE\u0987\u09AD \u0986\u09AA\u09A1\u09C7\u099F \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8!","ok");
    }catch(e){console.error(e);}
  }
}

function addTxn(type,amount,category,note){
  if(!amount||isNaN(amount)||amount<=0) return;
  transactions.push({id:"TXN-"+Math.floor(100000+Math.random()*900000),type,amount:parseFloat(amount),category:category||"Other",note:note||(type==="IN"?"Money IN":"Money OUT"),timestamp:new Date().toISOString(),runningBalance:0});
  if(type==="IN"){AudioFX.in();if(amount>=20000&&window.confetti)confetti({particleCount:80,spread:60,origin:{y:.6}});}
  else AudioFX.out();
  saveCloud(); render();
}

function editTxn(id){
  const t=transactions.find(x=>x.id===id); if(!t) return;
  document.getElementById("edit-id").value=t.id;
  document.getElementById("edit-type").value=t.type;
  document.getElementById("edit-amt").value=t.amount;
  document.getElementById("edit-note").value=t.note||"";
  openM("m-edit");
}

function delTxn(id){
  if(!confirm("\u09A1\u09BF\u09B2\u09BF\u099F \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4?")) return;
  transactions=transactions.filter(t=>t.id!==id);
  saveCloud(); render(); toast("\u09A1\u09BF\u09B2\u09BF\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7!","err");
}

function openM(id){const m=document.getElementById(id);if(m)m.classList.add("open");}
function closeM(id){const m=document.getElementById(id);if(m)m.classList.remove("open");}

function toast(msg,type="ok"){
  const w=document.getElementById("tw"); if(!w) return;
  const d=document.createElement("div"); d.className="toast "+type;
  d.innerHTML=(type==="ok"?"\u2705":"\uD83D\uDD14")+" "+msg;
  w.appendChild(d); setTimeout(()=>{d.style.opacity="0";setTimeout(()=>d.remove(),300);},3000);
}

function exportPDF(){
  toast("PDF \u09A4\u09C8\u09B0\u09BF \u09B9\u099A\u09CD\u099B\u09C7...","ok");
  const el=document.getElementById("printable-area")||document.getElementById("admin-wrap");
  if(!el||typeof html2pdf==="undefined"){window.print();return;}
  html2pdf().set({margin:[6,6,6,6],filename:"hisab_"+new Date().toISOString().slice(0,10)+".pdf",image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:"mm",format:"a4"}}).from(el).save().then(()=>toast("PDF \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 \u09B8\u09AB\u09B2!","ok"));
}

function checkPin(){
  const v=document.getElementById("pin-inp").value.trim();
  if(v===ADMIN_PIN){
    document.getElementById("pin-ov").style.display="none";
    const w=document.getElementById("admin-wrap"); if(w) w.style.display="";
    isAdmin=true; render();
  }else{
    document.getElementById("pin-err").textContent="\u09AD\u09C1\u09B2 PIN! \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8";
    document.getElementById("pin-inp").value="";
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  loadData();
  // Filter tabs
  document.querySelectorAll(".ftab").forEach(b=>{
    b.addEventListener("click",()=>{
      document.querySelectorAll(".ftab").forEach(x=>x.classList.remove("on"));
      b.classList.add("on"); activeFilter=b.dataset.f; renderFeed();
    });
  });
  // Search
  const sinp=document.getElementById("sinp");
  if(sinp) sinp.addEventListener("input",renderFeed);
  // Search toggle
  const qs=document.getElementById("q-search");
  if(qs) qs.addEventListener("click",()=>{const b=document.getElementById("sbox");if(b){b.classList.toggle("open");if(b.classList.contains("open")&&sinp)sinp.focus();}});
  // PDF buttons
  ["pdf-top","nav-pdf","q-pdf"].forEach(id=>{const b=document.getElementById(id);if(b)b.addEventListener("click",exportPDF);});
  // Admin buttons
  const bi=document.getElementById("btn-in"); if(bi) bi.addEventListener("click",()=>openM("m-in"));
  const bo=document.getElementById("btn-out"); if(bo) bo.addEventListener("click",()=>openM("m-out"));
  const na=document.getElementById("nav-add"); if(na) na.addEventListener("click",()=>openM("m-in"));
  // Forms
  const fi=document.getElementById("form-in");
  if(fi) fi.addEventListener("submit",e=>{e.preventDefault();addTxn("IN",document.getElementById("in-amt").value,document.getElementById("in-cat").value,document.getElementById("in-note").value);closeM("m-in");fi.reset();toast("\u09F3"+parseFloat(document.getElementById("in-amt")||0).toLocaleString()+" \u099C\u09AE\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7!","ok");});
  const fo=document.getElementById("form-out");
  if(fo) fo.addEventListener("submit",e=>{e.preventDefault();addTxn("OUT",document.getElementById("out-amt").value,document.getElementById("out-cat").value,document.getElementById("out-note").value);closeM("m-out");fo.reset();toast("\u09F3"+parseFloat(document.getElementById("out-amt")||0).toLocaleString()+" \u0996\u09B0\u099A \u09B9\u09AF\u09BC\u09C7\u099B\u09C7!","err");});
  const fe=document.getElementById("form-edit");
  if(fe) fe.addEventListener("submit",e=>{e.preventDefault();const id=document.getElementById("edit-id").value;const t=transactions.find(x=>x.id===id);if(t){t.type=document.getElementById("edit-type").value;t.amount=parseFloat(document.getElementById("edit-amt").value);t.note=document.getElementById("edit-note").value;}saveCloud();render();closeM("m-edit");toast("\u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7!","ok");});
  // Overlay close on background tap
  document.querySelectorAll(".moverlay").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open");}));
  // PIN input - auto submit on 4 digits
  const pinInp=document.getElementById("pin-inp");
  if(pinInp) pinInp.addEventListener("input",()=>{if(pinInp.value.length===4)checkPin();});
});
