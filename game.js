/* Вальдения — логика игры (бесконечное правление) */
(function(){
"use strict";
var $=function(i){return document.getElementById(i);};
var MON=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
var META=[["support","Поддержка"],["economy","Экономика"],["security","Безопасность"],
["treasury","Казна"],["unity","Единство"],["welfare","Жизнь"],["freedom","Открытость"]];
var FAC=[["biz","Бизнес"],["unions","Профсоюзы"],["forces","Силовики"],
["media","Пресса"],["regions","Регионы"],["youth","Молодёжь"]];
var TERM=8;

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

function thresh(){return clamp(35+(S.term-1)*4,35,60);}
function pressure(){var s=0;Object.keys(S.rivals).forEach(function(k){s+=S.rivals[k];});
 return Math.round(s/12);}
function avgStat(){var a=0;META.forEach(function(m){a+=S.st[m[0]];});return Math.round(a/META.length);}

function applyEff(e){
 if(!e)return;
 Object.keys(e).forEach(function(k0){
  var k=String(k0).toLowerCase(), v=parseFloat(e[k0]);
  if(!isFinite(v)||v===0)return;
  if(S.st[k]!=null) S.st[k]=clamp(S.st[k]+v,0,100);
  else if(S.fc[k]!=null) S.fc[k]=clamp(S.fc[k]+v,0,100);
 });
}
function delta(e){
 if(!e)return '<span class="nt">без резких изменений</span>';
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
 var p=partyOf(S.pid), ib=clamp(S.ideo*2,-10,10);
 $("turn").textContent="Срок "+S.term+" · месяц "+Math.max(1,S.turn)+" ("+MON[(Math.max(1,S.turn)-1)%12]+
  ", год "+(Math.floor((Math.max(1,S.turn)-1)/12)+1)+") · "+p.n+" · Капитал: "+S.cap+
  " · Порог: "+(thresh()+pressure());
 $("bars").innerHTML=META.map(function(m){
  var v=Math.round(S.st[m[0]]);
  var c=v<30?"#ff7b7b":v<50?"#ffcf6b":"#7ee3ff";
  return '<div class="bar"><span>'+m[1]+'</span><b>'+v+'</b><i><u style="width:'+v+
   '%;background:'+c+'"></u></i></div>';
 }).join("");
 $("fac").innerHTML=FAC.map(function(x){
  var v=Math.round(S.fc[x[0]]), g=S.goals[x[0]];
  var c=v<25?"#ff9b9b":v>65?"#8ff0b0":"#cbd8ef";
  return '<div>'+x[1]+' <b style="color:'+c+'">'+v+'</b> <em>'+
   (g.rev?("«"+esc(g.txt)+"»"):"цель скрыта")+'</em></div>';
 }).join("")+'<div>Идеологическая верность: <b>'+S.ideo+'</b> (на выборах '+
  (ib>=0?"+":"")+ib+') · Давление оппозиции: '+pressure()+'</div>';
}

/* ---------- старт ---------- */
function startScreen(){
 S=null;
 $("turn").textContent="Республика Вальдения";
 $("bars").innerHTML=""; $("fac").innerHTML="";
 var h='<div class="card"><div class="tag">Правление без ограничения срока</div><h2>Выбери партию</h2>'+
  '<p>Счётчика ходов больше нет. Каждые 8 месяцев — выборы: прошёл порог — новый срок, '+
  'чуть не дотянул — хрупкая коалиция (поддержка −6), провалился — конец правления. '+
  'Порог растёт со сроком и зависит от того, как усилилась оппозиция. '+
  'Пул событий кончается — дальше их собирает процедурный генератор по твоим слабым местам, '+
  'а по кнопке «ИИ: промпт» — Honer AI. У фракций скрытые цели: раскрывай их за капитал.</p>';
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
 S={turn:0,term:1,pid:pid,st:st,fc:fc,goals:goals,rivals:rivals,cap:(p.s.cap||0)+4,
    ideo:0,over:false,used:[],recent:[],event:null,eventAI:false,intr:null,log:[]};
 render();
 nextTurn();
}

/* ---------- ход ---------- */
function nextTurn(){
 if(!S||S.over)return;
 S.turn++;
 Object.keys(S.rivals).forEach(function(k){ S.rivals[k]=clamp(S.rivals[k]+rnd(0.7,1.6),0,100); });
 if(S.st.support<=0) return lose("Поддержка обнулилась: народ вышел на площади, и тебя отстранили от власти.");
 render();
 if(S.turn%TERM===0) return showElection();
 if(S.turn%3===0) return showIntrigue();
 newEvent();
}

function newEvent(){
 var i,k,av=[];
 var useGen=(typeof GEN==="undefined")?true:(Math.random()<0.45);
 if(!useGen){
  for(i=0;i<EVENTS.length;i++) if(S.used.indexOf(i)<0) av.push(i);
  if(av.length){
   k=av[Math.floor(Math.random()*av.length)];
   S.used.push(k);
   return showEvent(EVENTS[k],false);
  }
 }
 var ev=null,t=0;
 while(t<6){
  ev=GEN.make(S); t++;
  if(S.recent.indexOf(ev[0])<0) break;
 }
 S.recent.push(ev[0]);
 if(S.recent.length>6) S.recent.shift();
 showEvent(ev,false);
}

function showEvent(ev,isAI){
 S.event=ev; S.eventAI=!!isAI;
 var h='<div class="card"><div class="tag">'+(isAI?"ИИ · событие":"Событие")+' · срок '+S.term+
  ", месяц "+Math.max(1,S.turn)+'</div><h2>'+esc(ev[0])+'</h2><p>'+esc(ev[1])+'</p>';
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
 p.like.forEach(function(k){ if(v[1]&&v[1][k]) bal+=v[1][k]; });
 if(bal>0) S.ideo=clamp(S.ideo+1,-6,6);
 else if(bal<0) S.ideo=clamp(S.ideo-1,-6,6);
 S.cap+=1;
 S.log.push(ev[0]+" → "+v[0]);
 S.event=null;
 render();
 if(S.st.support<=0) return lose("Поддержка обнулилась — тебя отстранили от власти.");
 var h='<div class="card"><div class="tag">Итог · срок '+S.term+", месяц "+Math.max(1,S.turn)+
  '</div><h2>'+esc(ev[0])+'</h2><p>'+esc(v[2]||"Решение принято.")+'</p><div class="delta">'+
  delta(v[1])+'</div><button class="mbtn" id="nx">Дальше</button></div>';
 $("main").innerHTML=h;
 $("nx").onclick=nextTurn;
 window.scrollTo(0,0);
}

/* ---------- интриги ---------- */
function showIntrigue(){
 var it=pick(INTRIGUES);
 S.intr=it;
 var h='<div class="card"><div class="tag">Интрига · срок '+S.term+", месяц "+Math.max(1,S.turn)+
  '</div><h2>'+esc(it[0])+'</h2><p>'+esc(it[1])+'</p>';
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
 $("nx").onclick=newEvent;
 window.scrollTo(0,0);
}

/* ---------- выборы ---------- */
function showElection(){
 var p=partyOf(S.pid), ideoB=clamp(S.ideo*2,-10,10), facB=0, rowsF=[];
 FAC.forEach(function(f){
  var g=S.goals[f[0]], lo=S.fc[f[0]], ok=g.check(S.st);
  g.done=ok;
  var b=ok?2:-2, note=ok?"цель выполнена +2":"цель провалена −2";
  if(lo<25){
   b-=3; note+=", саботаж −3";
   applyEff(pick([{unity:-2,support:-2},{treasury:-3,economy:-2},{freedom:-2,support:-3}]));
  }
  facB+=b;
  rowsF.push(f[1]+" ("+Math.round(lo)+"): "+note+(g.rev?" · «"+esc(g.txt)+"»":" · цель скрыта"));
 });
 facB=clamp(facB,-12,12);
 var score=clamp(Math.round(S.st.support+ideoB+facB+rnd(-4,4)),0,100);
 var base=thresh(), pres=pressure(), need=base+pres, hard=need-8;
 var h='<div class="card"><div class="tag">Выборы · срок '+S.term+' завершён</div><h2>Выборы №'+S.term+
  '</h2><p>Поддержка '+Math.round(S.st.support)+' + идеология '+(ideoB>=0?"+":"")+ideoB+
  ' + фракции '+facB+' = <b>'+score+'</b><br>Порог: '+base+' (базовый) + '+pres+
  ' (давление оппозиции) = <b>'+need+'</b>. Для коалиции достаточно '+hard+'.</p>'+
  '<div class="note">'+rowsF.join("<br>")+'</div>';
 if(score<hard){
  h+='<p style="margin-top:10px">Порог не пройден. Власть переходит к оппозиции.</p>'+
   '<button class="mbtn" id="nx">Итоги правления</button></div>';
  $("main").innerHTML=h;
  $("nx").onclick=function(){ lose("Выборы проиграны: набрано "+score+" при необходимых "+hard+"."); };
  window.scrollTo(0,0);
  return;
 }
 var win=score>=need;
 S.term++;
 S.st.support=clamp(S.st.support+(win?3:-6),0,100);
 render();
 h+='<p style="margin-top:10px">'+(win?"Мандат получен: поддержка +3.":
  "Хрупкая коалиция: мандат сохранён, поддержка −6.")+
  ' Следующий срок — порог выше, события жёстче.</p>'+
  '<button class="mbtn" id="nx">Вернуться к делам</button></div>';
 $("main").innerHTML=h;
 $("nx").onclick=nextTurn;
 window.scrollTo(0,0);
}

/* ---------- итоги ---------- */
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
 var h='<div class="card"><div class="tag">Конец правления</div><h2>Игра окончена</h2><p>'+esc(txt)+
  '</p><p>Ты правил '+S.turn+' месяцев, сроков: '+S.term+'.</p>'+summary()+matchLine()+
  '<button class="mbtn" id="nx">Новая игра</button></div>';
 $("main").innerHTML=h;
 $("nx").onclick=startScreen;
 window.scrollTo(0,0);
}
function showStats(){
 if(!S)return;
 var done=0; FAC.forEach(function(f){ if(S.goals[f[0]].done) done++; });
 var back=S.event?function(){ showEvent(S.event,S.eventAI); }:function(){ newEvent(); };
 var h='<div class="card"><div class="tag">Промежуточные итоги</div><h2>Срок '+S.term+
  ' · месяц '+S.turn+'</h2><p>Средний показатель: <b>'+avgStat()+'</b>. Целей фракций выполнено: '+
  done+' из 6. Капитал: '+S.cap+'.</p>'+summary()+matchLine()+
  '<button class="mbtn" id="nx">Вернуться к делам</button></div>';
 $("main").innerHTML=h;
 $("nx").onclick=back;
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
 "Ты генерируешь событие, решение остаётся за игроком.\n\n"+
 "Правление: срок "+S.term+", месяц "+S.turn+". Партия игрока: "+p.n+" ("+p.ide+").\n"+
 "Показатели (0-100): "+st+".\nНастроение фракций (0-100): "+fc+".\n"+
 "Идеологическая верность: "+S.ideo+" из 6.\n"+
 "Последние решения: "+(S.log.slice(-3).join("; ")||"нет")+".\n\n"+
 "Придумай одно новое правдоподобное событие, логично продолжающее ситуацию. Без реальных "+
 "стран, политиков и организаций. Оно должно быть труднее предыдущих: срок растёт.\n\n"+
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
   Object.keys(x.effects).forEach(function(k0){
    var k=String(k0).toLowerCase(), v=parseFloat(x.effects[k0]);
    if(!isFinite(v)||v===0)return;
    if(S.st[k]==null&&S.fc[k]==null)return;
    e[k]=clamp(Math.round(v),-25,25);
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
$("bSt").onclick=showStats;
$("bNew").onclick=function(){ if(confirm("Начать заново? Текущее правление будет потеряно.")) startScreen(); };
$("closeModal").onclick=function(){ $("modal").classList.add("hide"); };
$("copyBtn").onclick=copyPrompt;
$("localBtn").onclick=function(){ $("modal").classList.add("hide"); };
$("applyAI").onclick=applyAI;

startScreen();
})();
