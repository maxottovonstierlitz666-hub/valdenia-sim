/* Вальдения — логика игры */
(function(){
"use strict";

var $=function(i){return document.getElementById(i);};
var MON=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
var META=[["support","Поддержка"],["economy","Экономика"],["security","Безопасность"],
["treasury","Казна"],["unity","Единство"],["welfare","Жизнь"],["freedom","Открытость"]];
var FAC=[["biz","Бизнес"],["unions","Профсоюзы"],["forces","Силовики"],
["media","Пресса"],["regions","Регионы"],["youth","Молодёжь"]];
var TOTAL=24, THRESH=38;

var S=null;

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function rnd(a,b){return a+Math.random()*(b-a);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function partyOf(id){for(var i=0;i<PARTIES.length;i++){if(PARTIES[i].id===id)return PARTIES[i];}return null;}
function bind(sel,fn){Array.prototype.forEach.call(document.querySelectorAll(sel),
  function(b){b.onclick=function(){fn(b);};});}
function toast(t){var el=$("toast");el.textContent=t;el.classList.add("show");
  clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove("show");},2800);}

function applyEff(e){
  if(!e)return;
  Object.keys(e).forEach(function(k){
    if(S.st[k]!=null) S.st[k]=clamp(S.st[k]+e[k],0,100);
    else if(S.fc[k]!=null) S.fc[k]=clamp(S.fc[k]+e[k],0,100);
  });
}
function delta(e){
  if(!e) return '<span class="nt">без резких изменений</span>';
  var out=[];
  META.concat(FAC).forEach(function(m){
    var v=e[m[0]];
    if(!v)return;
    out.push('<span class="'+(v>0?"up":"dn")+'">'+m[1]+" "+(v>0?"+":"")+v+'</span>');
  });
  return out.length?out.join(""):'<span class="nt">без резких изменений</span>';
}

/* ---------- шапка ---------- */
function render(){
  if(!S)return;
  var t=Math.max(1,S.turn), p=partyOf(S.pid);
  $("turn").textContent="Ход "+t+" из "+TOTAL+" · "+MON[(t-1)%12]+", год "+(Math.floor((t-1)/12)+1)+
    " · "+p.n+" ("+p.ide+") · Капитал: "+S.cap;
  $("bars").innerHTML=META.map(function(m){
    var v=Math.round(S.st[m[0]]);
    var c=v<30?"#ff7b7b":v<50?"#ffcf6b":"#7ee3ff";
    return '<div class="bar"><span>'+m[1]+'</span><b>'+v+'</b><i><u style="width:'+v+
      '%;background:'+c+'"></u></i></div>';
  }).join("");
  var f=FAC.map(function(x){
    var v=Math.round(S.fc[x[0]]), g=S.goals[x[0]];
    var c=v<25?"#ff9b9b":v>65?"#8ff0b0":"#cbd8ef";
    var mark=g.rev?("<em>«"+esc(g.txt)+"»</em>"):"<em>цель скрыта</em>";
    return '<div>'+x[1]+' <b style="color:'+c+'">'+v+'</b> '+mark+'</div>';
  }).join("");
  var ib=clamp(S.ideo*2,-10,10);
  $("fac").innerHTML=f+'<div>Идеологическая верность: <b>'+S.ideo+'</b> (на выборах '+
    (ib>=0?"+":"")+ib+')</div>';
}

/* ---------- старт ---------- */
function startScreen(){
  S=null;
  $("turn").textContent="Республика Вальдения";
  $("bars").innerHTML=""; $("fac").innerHTML="";
  var h='<div class="card"><div class="tag">Правление · 24 хода</div><h2>Выбери партию</h2>'+
   '<p>Идеология задаёт стартовые показатели, любимые темы и слабое место. Решения в духе партии '+
   'копят верность — это бонус на выборах. Выборы на 8, 16 и 24 ходу: меньше 38 или второе место — '+
   'конец правления. У каждой фракции скрытая цель: раскрывай их за капитал кнопкой «Разведка».</p>';
  PARTIES.forEach(function(p){
    h+='<button class="opt" data-p="'+p.id+'"><b style="color:'+p.c+'">'+p.n+'</b> — '+p.ide+
      '<br><span style="color:#8fa3c8;font-size:13px">'+p.ln+'</span></button>';
  });
  h+='</div>';
  $("main").innerHTML=h;
  bind(".opt",function(b){ start(b.getAttribute("data-p")); });
  window.scrollTo(0,0);
}

function start(pid){
  var p=partyOf(pid);
  var st={support:50,economy:48,security:50,treasury:52,unity:50,welfare:48,freedom:48};
  var fc={biz:50,unions:50,forces:50,media:50,regions:50,youth:50};
  Object.keys(p.s).forEach(function(k){
    if(k==="cap")return;
    if(st[k]!=null) st[k]=clamp(st[k]+p.s[k],0,100);
    else if(fc[k]!=null) fc[k]=clamp(fc[k]+p.s[k],0,100);
  });
  var goals={};
  FAC.forEach(function(f){
    var g=pick(GOALS[f[0]]);
    goals[f[0]]={txt:g[0],check:g[1],rev:false,done:false};
  });
  var rivals={};
  PARTIES.forEach(function(q){ if(q.id!==pid) rivals[q.id]=rnd(7,12); });
  S={turn:0,pid:pid,st:st,fc:fc,goals:goals,rivals:rivals,cap:(p.s.cap||0)+4,
     ideo:0,over:false,used:[],event:null,intr:null,log:[]};
  render();
  nextTurn();
}

/* ---------- ход ---------- */
function nextTurn(){
  if(!S||S.over)return;
  S.turn++;
  Object.keys(S.rivals).forEach(function(k){ S.rivals[k]=clamp(S.rivals[k]+rnd(0.7,1.5),0,100); });
  if(S.st.support<=0) return lose("Поддержка обнулилась: народ вышел на площади, и тебя отстранили от власти.");
  if(S.turn>TOTAL) return finish();
  render();
  if(S.turn%8===0) return showElection();
  if(S.turn%3===0) return showIntrigue();
  newEvent();
}

function newEvent(){
  var avail=[],i;
  for(i=0;i<EVENTS.length;i++) if(S.used.indexOf(i)<0) avail.push(i);
  if(!avail.length){ S.used=[]; for(i=0;i<EVENTS.length;i++) avail.push(i); }
  var k=avail[Math.floor(Math.random()*avail.length)];
  S.used.push(k);
  showEvent(EVENTS[k],false);
}

function showEvent(ev,isAI){
  S.event=ev;
  var h='<div class="card"><div class="tag">'+(isAI?"ИИ · событие":"Событие")+' · ход '+
    Math.max(1,S.turn)+'</div><h2>'+esc(ev[0])+'</h2><p>'+esc(ev[1])+'</p>';
  ev[2].forEach(function(v,i){ h+='<button class="opt" data-i="'+i+'">'+esc(v[0])+'</button>'; });
  h+='</div>';
  $("main").innerHTML=h;
  bind(".opt",function(b){ choose(parseInt(b.getAttribute("data-i"),10)); });
  window.scrollTo(0,0);
}

function choose(i){
  var ev=S.event; if(!ev||S.over)return;
  var v=ev[2][i]; if(!v)return;
  applyEff(v[1]);
  var p=partyOf(S.pid), bal=0;
  p.like.forEach(function(k){ if(v[1][k]) bal+=v[1][k]; });
  if(bal>0) S.ideo=clamp(S.ideo+1,-6,6);
  else if(bal<0) S.ideo=clamp(S.ideo-1,-6,6);
  S.cap+=1;
  S.log.push(ev[0]+" → "+v[0]);
  S.event=null;
  render();
  if(S.st.support<=0) return lose("Поддержка обнулилась — тебя отстранили от власти.");
  var h='<div class="card"><div class="tag">Итог · ход '+Math.max(1,S.turn)+'</div><h2>'+esc(ev[0])+
    '</h2><p>'+esc(v[2]||"Решение принято.")+'</p><div class="delta">'+delta(v[1])+
    '</div><button class="mbtn" id="nx">Дальше</button></div>';
  $("main").innerHTML=h;
  $("nx").onclick=nextTurn;
  window.scrollTo(0,0);
}

/* ---------- интриги ---------- */
function showIntrigue(){
  var it=pick(INTRIGUES);
  S.intr=it;
  var h='<div class="card"><div class="tag">Интрига · ход '+Math.max(1,S.turn)+'</div><h2>'+
    esc(it[0])+'</h2><p>'+esc(it[1])+'</p>';
  it[2].forEach(function(v,i){ h+='<button class="opt" data-i="'+i+'">'+esc(v[0])+'</button>'; });
  h+='</div>';
  $("main").innerHTML=h;
  bind(".opt",function(b){ doIntrigue(parseInt(b.getAttribute("data-i"),10)); });
  window.scrollTo(0,0);
}

function doIntrigue(i){
  var it=S.intr; if(!it)return;
  var v=it[2][i]; if(!v)return;
  var fail=Math.random()<v[3];
  var eff=fail?(v[4]||{}):(v[1]||{});
  var txt=fail?(v[5]||"План не сработал."):(v[2]||"Получилось.");
  applyEff(eff);
  S.cap+=1;
  if(fail) S.ideo=clamp(S.ideo-1,-6,6);
  S.log.push(it[0]+" → "+v[0]+(fail?" (провал)":" (успех)"));
  S.intr=null;
  render();
  var h='<div class="card"><div class="tag">'+(fail?"Провал":"Успех")+' · интрига</div><h2>'+
    esc(it[0])+'</h2><p>'+esc(txt)+'</p><div class="delta">'+delta(eff)+
    '</div><button class="mbtn" id="nx">Дальше</button></div>';
  $("main").innerHTML=h;
  $("nx").onclick=function(){ newEvent(); };
  window.scrollTo(0,0);
}

/* ---------- выборы ---------- */
function showElection(){
  var p=partyOf(S.pid), ideoB=clamp(S.ideo*2,-10,10), facB=0, rowsF=[];
  FAC.forEach(function(f){
    var g=S.goals[f[0]], lo=S.fc[f[0]], ok=g.check(S.st);
    g.done=ok;
    var b=ok?2:-2;
    var note=ok?"цель выполнена +2":"цель провалена −2";
    if(lo<25){
      b-=3; note+=", саботаж −3";
      applyEff(pick([{unity:-2,support:-2},{treasury:-3,economy:-2},{freedom:-2,support:-3}]));
    }
    facB+=b;
    rowsF.push(f[1]+" ("+Math.round(lo)+"): "+note+(g.rev?" · «"+esc(g.txt)+"»":" · цель скрыта"));
  });
  facB=clamp(facB,-12,12);
  var score=clamp(Math.round(S.st.support+ideoB+facB+rnd(-5,5)),0,100);
  var rows=PARTIES.map(function(q){
    return {n:q.n, me:q.id===S.pid,
      r:q.id===S.pid?score:Math.round(clamp(S.rivals[q.id]+rnd(0,7),0,100))};
  });
  rows.sort(function(a,b){return b.r-a.r;});
  var win=rows[0].me&&score>=THRESH;
  var h='<div class="card"><div class="tag">Выборы · ход '+Math.max(1,S.turn)+'</div><h2>'+
    (S.turn>=TOTAL?"Финальные выборы":"Парламентские выборы")+'</h2>'+
    '<p>Твой результат: поддержка '+Math.round(S.st.support)+' + идеология '+
    (ideoB>=0?"+":"")+ideoB+' + фракции '+facB+' = <b>'+score+'</b> (порог '+THRESH+')</p>'+
    rows.map(function(x){
      return '<div class="pt"><span'+(x.me?' style="color:#7ee3ff;font-weight:700"':'')+'>'+
        x.n+'</span><span>'+x.r+'</span></div>';
    }).join("")+
    '<div class="note" style="margin-top:10px">'+rowsF.join("<br>")+'</div>';

  if(!win){
    h+='<p style="margin-top:12px">'+(score<THRESH?"Порог не пройден.":"Соперники набрали больше.")+
      ' Власть переходит к оппозиции.</p><button class="mbtn" id="nx">Итоги</button></div>';
    $("main").innerHTML=h;
    $("nx").onclick=function(){
      lose(score<THRESH?"Выборы проиграны: поддержка ниже порога 38.":"Выборы проиграны: соперники получили больше голосов.");
    };
    window.scrollTo(0,0);
    return;
  }
  S.st.support=clamp(S.st.support+3,0,100);
  render();
  h+='<p style="margin-top:12px">Мандат получен: поддержка +3.</p>'+
    '<button class="mbtn" id="nx">'+(S.turn>=TOTAL?"Итоги правления":"Вернуться к делам")+'</button></div>';
  $("main").innerHTML=h;
  $("nx").onclick=function(){ if(S.turn>=TOTAL){finish();}else{newEvent();} };
  window.scrollTo(0,0);
}

/* ---------- финалы ---------- */
function summary(){
  return '<div class="note">Показатели: '+META.map(function(m){
      return m[1]+" "+Math.round(S.st[m[0]]);}).join(", ")+
    '<br>Фракции: '+FAC.map(function(f){
      return f[1]+" "+Math.round(S.fc[f[0]]);}).join(", ")+
    '<br>Решений принято: '+S.log.length+'</div>';
}
function matchLine(){
  return '<div class="note" style="margin-top:8px">Последние решения: '+
    (S.log.slice(-3).join("; ")||"нет")+'</div>';
}
function lose(txt){
  if(S) S.over=true;
  var h='<div class="card"><div class="tag">Конец правления</div><h2>Игра окончена</h2><p>'+
    esc(txt)+'</p>'+summary()+matchLine()+'<button class="mbtn" id="nx">Новая игра</button></div>';
  $("main").innerHTML=h;
  $("nx").onclick=startScreen;
  window.scrollTo(0,0);
}
function finish(){
  if(S) S.over=true;
  var avg=0; META.forEach(function(m){avg+=S.st[m[0]];});
  avg=Math.round(avg/META.length);
  var done=0; FAC.forEach(function(f){ if(S.goals[f[0]].done) done++; });
  var title=avg>=65?"Выдающееся правление":avg>=52?"Прочное правление":
    avg>=40?"Трудное правление":"Страна в упадке";
  var h='<div class="card"><div class="tag">24 хода пройдено</div><h2>'+title+'</h2>'+
    '<p>Средний показатель: <b>'+avg+'</b>. Целей фракций выполнено: <b>'+done+' из 6</b>. '+
    'Партия: '+partyOf(S.pid).n+' ('+partyOf(S.pid).ide+').</p>'+summary()+matchLine()+
    '<button class="mbtn" id="nx">Новая игра</button></div>';
  $("main").innerHTML=h;
  $("nx").onclick=startScreen;
  window.scrollTo(0,0);
}

/* ---------- разведка ---------- */
function recon(){
  if(!S||S.over){ toast("Сначала выбери партию."); return; }
  if(S.cap<2){ toast("Нужно 2 капитала, а есть "+S.cap+"."); return; }
  var list=FAC.filter(function(f){ return !S.goals[f[0]].rev; });
  if(!list.length){ toast("Все шесть целей уже раскрыты."); return; }
  var f=pick(list);
  S.goals[f[0]].rev=true;
  S.cap-=2;
  render();
  toast("«"+f[1]+"»: цель — "+S.goals[f[0]].txt);
}

/* ---------- мост к ИИ ---------- */
function buildPrompt(){
  var st=META.map(function(m){return m[1]+": "+Math.round(S.st[m[0]]);}).join(", ");
  var fc=FAC.map(function(f){return f[1]+": "+Math.round(S.fc[f[0]]);}).join(", ");
  var p=partyOf(S.pid);
  return "Ты — движок политического симулятора. Страна: вымышленная республика Вальдения. "+
  "Ты генерируешь событие, а решение остаётся за игроком.\n\n"+
  "Ход "+(S.turn+1)+" из "+TOTAL+". Партия игрока: "+p.n+" ("+p.ide+").\n"+
  "Показатели (0-100): "+st+".\nНастроение фракций (0-100): "+fc+".\n"+
  "Последние решения: "+(S.log.slice(-3).join("; ")||"нет")+".\n\n"+
  "Придумай одно новое правдоподобное событие, логично продолжающее ситуацию. "+
  "Без реальных стран, политиков и организаций.\n\n"+
  "Ответь СТРОГО одним JSON, без markdown и лишнего текста:\n"+
  '{"title":"название","text":"2-3 предложения","options":[{"label":"вариант решения",'+
  '"effects":{"support":0,"economy":0,"security":0,"treasury":0,"unity":0,"welfare":0,'+
  '"freedom":0,"biz":0,"unions":0,"forces":0,"media":0,"regions":0,"youth":0},'+
  '"result":"1-2 предложения о последствиях"}]}\n\n'+
  "Ровно 3 варианта с разными последствиями: жёсткий, компромиссный и пассивный. "+
  "Числа в effects — целые от -15 до 15, нули можно опускать.";
}

function parseAI(txt){
  if(!txt)return null;
  var s=String(txt).replace(/```json/gi,"").replace(/```/g,"").trim();
  var a=s.indexOf("{"), b=s.lastIndexOf("}");
  if(a<0||b<0)return null;
  var o;
  try{ o=JSON.parse(s.slice(a,b+1)); }catch(e){ return null; }
  if(!o||!o.title||!Array.isArray(o.options))return null;
  var opts=[];
  o.options.slice(0,4).forEach(function(x){
    if(!x||!x.label)return;
    var e={};
    if(x.effects&&typeof x.effects==="object"){
      Object.keys(x.effects).forEach(function(k){
        if(S.st[k]==null&&S.fc[k]==null)return;
        var v=parseFloat(x.effects[k]);
        if(isFinite(v)&&v!==0) e[k]=clamp(Math.round(v),-25,25);
      });
    }
    opts.push([String(x.label).slice(0,220),e,String(x.result||"Решение принято.").slice(0,420)]);
  });
  if(!opts.length)return null;
  return [String(o.title).slice(0,140),String(o.text||"").slice(0,650),opts];
}

function openModal(){
  if(!S||S.over){ toast("Сначала выбери партию или начни заново."); return; }
  $("promptBox").value=buildPrompt();
  $("copyHint").textContent=""; $("aiHint").textContent="";
  $("modal").classList.remove("hide");
}
function fallbackCopy(t,ok){
  var ta=$("promptBox");
  ta.removeAttribute("readonly"); ta.focus(); ta.select();
  try{ document.execCommand("copy"); ok(); }
  catch(e){ $("copyHint").textContent="Скопируй вручную: выдели текст и нажми «Копировать»."; }
  ta.setAttribute("readonly","readonly");
}
function copyPrompt(){
  var t=$("promptBox").value;
  var ok=function(){ $("copyHint").textContent="Скопировано. Вставь промпт в чат с Honer AI."; };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(ok,function(){ fallbackCopy(t,ok); });
  } else fallbackCopy(t,ok);
}
function applyAI(){
  if(!S||S.over){ toast("Игра не идёт."); return; }
  var ev=parseAI($("aiIn").value);
  if(!ev){
    $("aiHint").textContent="Не удалось разобрать JSON. Вставь ответ целиком: он начинается с { и заканчивается }.";
    return;
  }
  $("modal").classList.add("hide");
  $("aiIn").value="";
  showEvent(ev,true);
  toast("Событие от ИИ загружено.");
}

/* ---------- кнопки ---------- */
$("bAI").onclick=openModal;
$("bRe").onclick=recon;
$("bNew").onclick=function(){ if(confirm("Начать заново? Текущее правление будет потеряно.")) startScreen(); };
$("closeModal").onclick=function(){ $("modal").classList.add("hide"); };
$("copyBtn").onclick=copyPrompt;
$("localBtn").onclick=function(){ $("modal").classList.add("hide"); };
$("applyAI").onclick=applyAI;

startScreen();
})();
