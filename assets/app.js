
/* Wordly v2 — independent course, text-only learning. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
{const _ap=Element.prototype.append;Element.prototype.append=function(...a){return _ap.apply(this,a.filter(x=>x!=null&&x!==false));};}
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs||{})){if(v===false||v==null)continue;if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}for(const k of kids.flat(9)){if(k==null||k===false)continue;e.append(k.nodeType?k:document.createTextNode(String(k)));}return e;}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TAGS={s:'Подлежащее',v:'Глагол',a:'Вспомогательный',n:'Отрицание',q:'Вопр. слово',t:'Маркер времени',p:'Связка / особое',o:''};
const R={};
// ---------- хранилище
const KEY='wordly-original-v2';
const COURSE_ID='wordly-original-2026';
let S; try{S=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){S=null;}
if(!S || S.courseId!==COURSE_ID)S={};
S=Object.assign({stars:{},acc:{},mist:[],days:[],answers:0,correct:0,level:1,tt:null,srs:{},sets:[],set:{},ts:{},conf:{},gs:{},path:{},sprint:{},ps:{},cards:{},decks:[],notes:{},ctx:{},known:{},texts:[],hist:{},time:{},newDay:{},rec:{}},S);
S.courseId=COURSE_ID;
const MASTERY_THRESHOLD=70;
function ensureLessonProgress(){
 S.lessonProgress=S.lessonProgress&&typeof S.lessonProgress==='object'&&!Array.isArray(S.lessonProgress)?S.lessonProgress:{};
 for(const [id,stars] of Object.entries(S.stars||{}))if(stars&&!S.lessonProgress[id])S.lessonProgress[id]={completed:true,mastered:false,legacy:true,bestAccuracy:Number.isFinite(S.acc?.[id])?S.acc[id]:null,attempts:0};
 S.progressSchema=1;
}
ensureLessonProgress();
function lessonStatus(id){return S.lessonProgress[id]||{completed:false,mastered:false,attempts:0};}
function lessonStatusText(id){const p=lessonStatus(id);if(p.legacy)return 'Завершён ранее · освоение не проверено';if(p.mastered)return 'Освоение подтверждено · '+p.bestAccuracy+'% с первой попытки';if(p.completed)return p.lastAccuracy==null?'Завершён · освоение не проверено':'Завершён · '+p.lastAccuracy+'% · стоит повторить';return '';}

S.wordEdits=S.wordEdits||{};S.cardFlags=S.cardFlags||{};S.reviewLog=S.reviewLog||[];
S.set=Object.assign({learnSteps:'1m 10m',relearnSteps:'10m',graduateInterval:1,easyInterval:4,maxInterval:3650,intervalPercent:100,lapsePercent:50,reviewDayMax:100,reviewOrder:'due',reviewScope:'all',newOrder:'source',voice:false,fx:false,tiles:false,listen:false,newPer:10,revPer:20,sprintSec:4,unlock:false,revMode:'mix',flipDir:'en',goalMin:10,newDayMax:20},S.set);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));window.dispatchEvent(new Event('wordly-save'));}catch(e){toast('Не удалось сохранить локально. Экспортируйте прогресс.');}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function markDay(){const d=today();if(!S.days.includes(d)){S.days.push(d);save();}}
function streakDays(){const set=new Set(S.days);let n=0;const d=new Date();if(!set.has(today()))d.setDate(d.getDate()-1);for(;;){const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(set.has(k)){n++;d.setDate(d.getDate()-1);}else break;}return n;}
// ---------- токены
const clean=w=>String(w).toLowerCase().replace(/[.,!?;:«»"()—–]/g,'').replace(/’/g,"'");
const plain=toks=>toks.map(t=>t.w).join(' ');
function parse(str){return String(str).split(/\s+/).map(w=>({w,c:null}));}
function tokSpan(t,dict){const cls='tw'+(t.c&&t.c!=='o'?' tc-'+t.c:'');const tr=dict&&dict(t.w);const e=h('span',{class:cls+(tr?' has-tip':'')},t.w);if(tr)e.append(h('span',{class:'tip'},h('small',{},'Перевод'),tr));return e;}
function sentenceEl(toks,dict,cls){const e=h('span',{class:'sent '+(cls||'')});toks.forEach((t,i)=>{if(i)e.append(' ');e.append(tokSpan(t,dict));});return e;}
function md(x){return esc(x||'').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\[([svanqtop]):([^\]]+)\]/g,'<span class="tc-$1">$2</span>').replace(/\n/g,'<br>');}
// ---------- проверка ответов
function expand(s){
  s=' '+clean(s).replace(/\s+/g,' ')+' ';
  const rep=[["won't","will not"],["can't","cannot"],["can not","cannot"],["shan't","shall not"],["i'm","i am"],["n't"," not"],["'re"," are"],["'ve"," have"],["'ll"," will"]];
  rep.forEach(([a,b])=>{s=s.split(a).join(b);});
  let vs=[s];
  if(/'s /.test(s)) vs=vs.flatMap(x=>[x.replace(/(\w)'s /g,'$1 is '),x.replace(/(\w)'s /g,'$1 has ')]);
  if(/'d /.test(s)) vs=vs.flatMap(x=>[x.replace(/(\w)'d /g,'$1 would '),x.replace(/(\w)'d /g,'$1 had ')]);
  return vs.map(x=>x.replace(/\s+/g,' ').trim());
}
function matches(user,targets){const u=expand(user);return targets.some(t=>expand(t).some(x=>u.indexOf(x)>=0&&u.some(y=>y===x)));}
function formulaEl(rule,small){
  const box=h('div',{class:'formula'+(small?' small':'')});
  if(rule.h)box.append(h('div',{class:'f-hint',html:md(rule.h)}));
  String(rule.f||'').split(' | ').forEach(line=>{const row=h('div',{class:'f-row'});
    line.split(' + ').forEach((part,i)=>{if(i)row.append(h('span',{class:'plus'},'+'));const m=part.trim().match(/^([svanqtop]):(.+)$/);row.append(h('span',{class:'chip '+(m?'c-'+m[1]:'c-o')},m?m[2]:part.trim()));});
    box.append(row);});
  return box;
}
function legendEl(toks){const used=[...new Set(toks.map(t=>t.c).filter(c=>c&&c!=='o'))];if(!used.length)return null;return h('div',{class:'legend'},used.map(c=>h('span',{class:'chip c-'+c},TAGS[c])));}
const TS=window.TENSES;TS.T.forEach(t=>{t.tl={...t.tl,k:t.k};});const modeName={aff:'Утверждение',neg:'Отрицание',q:'Вопрос'};
function tenseChip(t){return h('span',{class:'tchip g-'+t.g.replace(/ /g,'')},t.en);}
R.tbuild=(st,ctx)=>{
  const g=st.g;const tw=g.toks.map(t=>({w:t.w.replace(/[.?]/g,''),c:t.c}));
  tw[0].w=tw[0].w==='I'?'I':tw[0].w.toLowerCase();
  const multi=[];// маркеры и объекты — одной плиткой
  tw.forEach(t=>{const last=multi[multi.length-1];if(last&&(t.c==='t'||t.c==='o'||t.c==='s')&&last.c===t.c)last.w+=' '+t.w;else multi.push({...t});});
  const forms=new Set([g.v.b,g.v.s,g.v.p,g.v.pp,g.v.ing,'do','does','did','will','have','has','had','been','be','am','is','are','was','were','not']);
  multi.forEach(t=>forms.delete(t.w));
  const tiles=shuffle([...multi.map(t=>({w:t.w,c:t.c})),...shuffle([...forms]).slice(0,3).map(w=>({w,c:null}))]);
  const chosen=[];const ans=h('div',{class:'answer-line'}),pool=h('div',{class:'pool'});
  const draw=()=>{ans.innerHTML='';pool.innerHTML='';if(!chosen.length)ans.append(h('span',{class:'placeholder'},'Соберите предложение'));
    chosen.forEach((t,i)=>ans.append(h('button',{class:'tile'+(t.c?' tc-bg-'+t.c:''),onclick:()=>{chosen.splice(i,1);t.used=false;draw();}},t.w)));
    tiles.forEach(t=>pool.append(h('button',{class:'tile'+(t.used?' ghost':'')+(t.c?' tc-bg-'+t.c:''),onclick:()=>{if(t.used)return;t.used=true;chosen.push(t);draw();}},t.w)));ctx.setReady(chosen.length>0);};
  draw();
  ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const t=tiles[+e.key-1];if(t&&!t.used){t.used=true;chosen.push(t);draw();}return true;}if(e.key==='Backspace'&&chosen.length){chosen.pop().used=false;draw();return true;}};
  const hint=[g.subj[0],g.v.b+' ('+g.v.ru+')',g.v.o,g.marker.w].join(' / ');
  return {mode:'check',el:h('div',{},h('h3',{class:'step-title'},'Соберите: ',tenseChip(g.t),' · ',modeName[g.mode]),
    st.colored?formulaEl({f:g.t.f[{aff:0,neg:1,q:2}[g.mode]]},true):null,
    h('div',{class:'prompt'},h('span',{class:'bubble'},'🧩'),h('span',{class:'muted'},hint)),ans,pool),
    check:()=>({ok:matches(chosen.map(t=>t.w).join(' '),[plain(g.toks)]),toks:g.toks})};
};
function similarTenses(t){const same=TS.T.filter(x=>x!==t&&x.k!==t.pair);return shuffle(same).slice(0,3);}
R.tname=(st,ctx)=>{
  const g=st.g;const opts=shuffle([g.t,...similarTenses(g.t)]);let done=false;
  const btns=h('div',{class:'options col'},opts.map(t=>h('button',{class:'opt',onclick:e=>{if(done)return;done=true;const ok=t===g.t;e.currentTarget.classList.add(ok?'ok':'bad');
    ctx.done({ok,toks:g.toks,correctText:g.t.en+' — '+g.t.ru,chosenTk:t.k});}},t.en,h('small',{},' '+t.ru))));
  ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const b=btns.children[+e.key-1];if(b)b.click();return true;}};
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'Какое это время?'),h('div',{class:'choice-sent'},sentenceEl(g.toks.map(t=>({w:t.w,c:t.c==='t'?'t':null})),dictEN)),h('div',{class:'muted small'},'Подсказка: смотрите на маркер времени и форму глагола.'),btns)};
};
R.tform=(st,ctx)=>{
  const g=st.g;const vstr=(t)=>{const vp=TS.verbPart(t,g.mode,g.subj[1],g.v);return vp.post.map(x=>x[1]).join(' ');};
  const right=vstr(g.t);const om={};const sims=similarTenses(g.t);sims.forEach(t=>{const v=vstr(t);if(!(v in om))om[v]=t.k;});om[right]=g.t.k;const opts=shuffle([right,...new Set(sims.map(vstr).filter(x=>x!==right))].slice(0,4));
  // предложение с пропуском
  const toks=[];let gap=false;g.toks.forEach(t=>{if(t.c==='a'||t.c==='v'||t.c==='n'){if(!gap){toks.push({w:'___',c:'gap'});gap=true;}}else toks.push(t);});
  let done=false;const sent=h('div',{class:'choice-sent'});
  const renderQ=(fill,cls)=>{sent.innerHTML='';toks.forEach((t,i)=>{if(i)sent.append(' ');sent.append(t.c==='gap'?h('span',{class:'blank '+(cls||'')},fill||'… ('+(g.mode==='neg'?'not / ':'')+g.v.b+')'):tokSpan(t,dictEN));});};
  renderQ();
  const btns=h('div',{class:'options col'},opts.map(o=>h('button',{class:'opt',onclick:e=>{if(done)return;done=true;const ok=o===right;renderQ(right,ok?'ok':'bad');e.currentTarget.classList.add(ok?'ok':'bad');ctx.done({ok,toks:g.toks,chosenTk:om[o]});}},o)));
  ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const b=btns.children[+e.key-1];if(b)b.click();return true;}};
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'Поставьте глагол в нужное время'),sent,h('div',{class:'muted small'},'Маркер времени выделен бирюзовым — по нему и определяйте время.'),btns)};
};

// ---------- сессия
let session=null;
// Symbolic grammar schematics. Positions are illustrative, not measured durations.
const TIME_SCHEMES={
 PrS:{events:[18,34,50,66,82],caption:'Повторяющееся действие: было, происходит и может повторяться дальше.',note:'Точки показывают регулярность. Общий факт (например, «вода замерзает») не обязан иметь отдельные даты.'},
 PrC:{band:[35,62],open:true,caption:'Действие в процессе около «сейчас»: мы смотрим на него изнутри.',note:'Точное начало и конец могут быть неизвестны. Это также может быть временная ситуация вокруг настоящего.'},
 PrP:{events:[22],ref:50,arrow:[22,50],caption:'Действие раньше; его результат или опыт рассматриваем из настоящего.',reference:'точка отсчёта — сейчас',note:'Речь не о конкретном законченном моменте прошлого, а о связи с настоящим; возможен ещё продолжающийся период.'},
 PrPC:{band:[20,50],open:true,ref:50,caption:'Процесс начался раньше; к настоящему важна его длительность.',reference:'точка отсчёта — сейчас',note:'Процесс может продолжаться либо только что закончиться и оставлять заметный след.'},
 PaS:{events:[26],caption:'Завершённое событие в прошлом: смотрим на факт в закрытом периоде.',note:'Точка — учебное обозначение события, а не заявление, что оно обязательно было мгновенным.'},
 PaC:{band:[14,39],open:true,ref:28,caption:'В выбранный момент прошлого действие уже было в процессе.',reference:'выбранный момент в прошлом',note:'Эта точка может быть моментом звонка или другого события. Сейчас находится правее и не является точкой отсчёта.'},
 PaP:{events:[15],ref:35,arrow:[15,35],caption:'Первое событие уже завершилось до другой точки в прошлом.',reference:'более поздняя точка в прошлом',note:'Две точки обе слева от «сейчас»: более раннее действие → прошлая точка отсчёта.'},
 PaPC:{band:[10,35],open:true,ref:35,caption:'Процесс длился некоторое время до другой точки в прошлом.',reference:'точка в прошлом, до которой измеряем длительность',note:'Подчёркивается продолжительность или её последствие тогда, а не количество готовых результатов.'},
 FuS:{events:[77],caption:'Будущий факт: обещание, прогноз или решение, принятое сейчас.',note:'Это не единственный способ говорить о будущем. Заранее намеченный план часто выражается going to.'},
 FuC:{band:[62,91],open:true,ref:77,caption:'В выбранный будущий момент действие будет уже в процессе.',reference:'выбранный момент в будущем',note:'Не утверждаем, что к этому моменту действие будет закончено. Мы представляем его ход.'},
 FuP:{events:[67],ref:86,arrow:[67,86],caption:'Результат будет готов не позднее выбранного будущего срока.',reference:'будущий срок, к которому всё готово',note:'На схеме событие показано раньше срока. Завершение может совпасть с самим сроком.'},
 FuPC:{band:[25,86],open:true,ref:86,caption:'В будущей точке измеряем, сколько времени уже будет длиться процесс.',reference:'будущий момент, до которого считаем длительность',note:'Начало здесь показано в прошлом как один пример. Оно также может быть сейчас или в будущем — важно, чтобы оно было раньше точки отсчёта.'}
};
function timeline(tl){const def=TIME_SCHEMES[tl?.k];if(!def)return null;
 const track=h('div',{class:'time-track','aria-hidden':'true'},h('div',{class:'time-axis'}),h('div',{class:'time-now'}),h('div',{class:'time-labels'},h('span',{},'Прошлое'),h('span',{},'Сейчас'),h('span',{},'Будущее')));
 if(def.band)track.append(h('span',{class:'time-process'+(def.open?' open-ended':''),style:'left:'+def.band[0]+'%;width:'+(def.band[1]-def.band[0])+'%'}));
 if(def.arrow)track.append(h('span',{class:'time-relation',style:'left:'+def.arrow[0]+'%;width:'+(def.arrow[1]-def.arrow[0])+'%'}));
 (def.events||[]).forEach(x=>track.append(h('span',{class:'time-event',style:'left:'+x+'%'})));
 if(def.ref!=null)track.append(h('span',{class:'time-reference',style:'left:'+def.ref+'%'}));
 const keys=h('div',{class:'diagram-key'});if(def.events)keys.append(h('span',{},h('i',{class:'key-dot'}),'событие'));if(def.band)keys.append(h('span',{},h('i',{class:'key-band'}),'процесс'));if(def.ref!=null)keys.append(h('span',{},h('i',{class:'key-diamond'}),def.reference));
 return h('figure',{class:'tense-time','data-tense':tl.k,role:'img','aria-label':TN(tl.k)+'. Прошлое, сейчас, будущее. '+def.caption+' '+(def.reference||'')},h('div',{class:'diagram-heading'},'Временная схема'),track,h('figcaption',{class:'diagram-caption'},def.caption),keys,h('p',{class:'diagram-note'},def.note));
}

function tenseCard(t,compact){
  return h('div',{class:'tcard g-'+t.g.replace(/ /g,'')+(compact?' compact':'')},
    h('div',{class:'tc-head'},h('b',{},t.en),h('span',{class:'muted'},t.ru)),timeline(t.tl),
    h('div',{class:'tc-use'},t.use),
    h('div',{class:'tc-f'},['+','−','?'].map((s,i)=>h('div',{class:'tc-frow'},h('span',{class:'sign'},s),formulaEl({f:t.f[i]},true)))),
    h('div',{class:'tc-mk'},'Маркеры: ',h('span',{class:'tc-t'},t.mk)),
    compact?null:h('div',{class:'tc-ex'},['aff','neg','q'].map(m=>{const v=TS.V[0];const mk=t.m.find(x=>!x.md||x.md.includes(m))||t.m[0];return h('div',{},sentenceEl(TS.sentence(t,m,['she',3],v,mk).toks));})));
}
function showTrainer(){
  session=null;nav('tenses');
  const cfg=S.tt||{tenses:['PrS','PrC','PaS','FuS'],modes:['aff','neg','q'],types:['tform','tname','tbuild'],n:15,colored:true};
  const box=h('div',{class:'tt-tenses'});
  const groups=['Simple','Continuous','Perfect','Perfect Continuous'];
  const table=h('div',{class:'tt-grid'},h('span',{}),['Present','Past','Future'].map(x=>h('b',{},x)),
    groups.map(g=>[h('b',{},g),['Present','Past','Future'].map(tm=>{const t=TS.T.find(x=>x.g===g&&x.time===tm);
      return h('button',{class:'tt-cell g-'+g.replace(/ /g,'')+(cfg.tenses.includes(t.k)?' on':''),onclick:e=>{const i=cfg.tenses.indexOf(t.k);if(i>=0)cfg.tenses.splice(i,1);else cfg.tenses.push(t.k);e.currentTarget.classList.toggle('on');}},t.en);})]));
  box.append(table);
  const presets=[['Simple: настоящее / прошлое / будущее',['PrS','PaS','FuS']],['Present Simple vs Continuous',['PrS','PrC']],['Past Simple vs Present Perfect',['PaS','PrP']],['Все Perfect',['PrP','PaP','FuP']],['Прошедшие',['PaS','PaC','PaP','PaPC']],['Все 12',TS.T.map(t=>t.k)]];
  const toggles=(arr,opts,labels)=>h('div',{class:'toggles'},opts.map((o,i)=>h('button',{class:'tg'+(arr.includes(o)?' on':''),onclick:e=>{const k=arr.indexOf(o);if(k>=0){if(arr.length>1)arr.splice(k,1);else return;}else arr.push(o);e.currentTarget.classList.toggle('on');}},labels[i])));
  const start=()=>{if(!cfg.tenses.length){toast('Выберите хотя бы одно время');return;}S.tt=cfg;save();
    const steps=[];for(let i=0;i<cfg.n;i++){const type=rnd(cfg.types);let modes=cfg.modes;if(type==='tform')modes=modes.filter(m=>m!=='q');if(!modes.length)modes=['aff'];
      if(type==='tname'&&cfg.tenses.length<1)continue;const g=TS.gen(cfg.tenses,modes);steps.push({type,g,tense:g.t,colored:cfg.colored});}
    startSession({title:'Машина времени',doneTitle:'Тренировка завершена!',again:start,back:showTrainer},steps);};
  setMain(h('div',{class:'page'},h('h1',{},'⏱️ Машина времени'),
    h('p',{class:'muted'},'Бесконечный тренажёр времён: предложения генерируются заново каждый раз. Выберите времена, которые хотите прокачать.'),
    h('h3',{},'Быстрый выбор'),h('div',{class:'toggles'},presets.map(([l,ks])=>h('button',{class:'tg',onclick:()=>{cfg.tenses=ks.slice();S.tt=cfg;save();showTrainer();}},l))),
    h('h3',{},'Времена'),box,
    h('h3',{},'Формы'),toggles(cfg.modes,['aff','neg','q'],['Утверждение','Отрицание','Вопрос']),
    h('h3',{},'Упражнения'),toggles(cfg.types,['tform','tname','tbuild'],['Поставь глагол','Какое это время?','Собери предложение']),
    h('label',{class:'chk'},(()=>{const c=h('input',{type:'checkbox'});c.checked=cfg.colored;c.onchange=()=>cfg.colored=c.checked;return c;})(),' Цветные подсказки и формула в «Собери предложение»'),
    h('div',{class:'row'},h('button',{class:'main-btn blue',onclick:start},'▶ Начать ('+cfg.n+' заданий)'),
      h('select',{class:'sel',onchange:e=>{cfg.n=+e.target.value;S.tt=cfg;save();showTrainer();}},[10,15,20,30].map(n=>{const o=h('option',{value:n},n+' заданий');if(n===cfg.n)o.selected=true;return o;})))));
}
// ======================================================= v2: оригинальный курс
const SD=window.SD;
// Text-only edition: no media requests, speech synthesis or sound effects.
function img(key,cls,alt){const src=SD.imageAssets?.[key];return src?h('img',{src,class:cls||'',alt:alt||'',loading:'lazy',decoding:'async'}):null;}
function wordArtwork(w,thumb){const v=SD.visuals?.[w.id]||Object.entries(SD.D).map(([id,d])=>({id,d})).find(x=>x.d[0].toLowerCase()===w.en.toLowerCase()&&x.d[2]===w.ru);const visual=v?.asset?v:SD.visuals?.[v?.id];if(!visual)return null;const caption=visual.kind==='association'?'Визуальная ассоциация':visual.kind==='region'?'Выделенная область':visual.kind==='anki'?'Иллюстрация из Anki':'Иллюстрация';const picture=img(visual.asset,'vocab-picture',thumb?'':caption+': '+w.en);if(!picture)return null;const canvas=h('span',{class:'vocab-image'},picture);if(visual.marker)canvas.append(h('span',{class:'body-marker',style:'left:'+visual.marker[0]+'%;top:'+visual.marker[1]+'%','aria-hidden':'true'}));return h(thumb?'span':'figure',{class:'vocab-art'+(thumb?' thumb':'')},canvas,thumb?null:h('figcaption',{class:'muted'},caption));}
let exampleSequence=0;
function exampleBlock(en,ru,word,auto){if(!en&&!ru)return null;const box=h('div',{class:'w-ex example-hint'},en?h('div',{class:'example-en',html:word?hlWord(en,word):hl(en)}):null);if(ru){const id='example-translation-'+(++exampleSequence);const translation=h('div',{class:'muted example-ru',id,hidden:true},h('div',{html:hl(ru)}),auto?h('small',{class:'auto-notice'},'Автоматический перевод · можно исправить в карточке'):null);const btn=h('button',{type:'button',class:'example-toggle','aria-expanded':'false','aria-controls':id,onclick:e=>{e.stopPropagation();const open=translation.hidden;translation.hidden=!open;btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'Скрыть перевод':'Показать перевод примера';}},'Показать перевод примера');box.append(btn,translation);}return box;}
function vocabRow(w,back){return h('button',{type:'button',class:'vocab-row',onclick:()=>showWord(w.id,back)},wordArtwork(w,true),h('span',{class:'vocab-row-text'},h('b',{},w.en),h('span',{class:'muted'},w.ru)),h('span',{class:'vocab-row-state muted'},S.srs[w.id]?'в повторении':'новое'),h('span',{'aria-hidden':'true'},'›'));}
function imageCreditsBlock(){return h('details',{class:'image-credits'},h('summary',{},'Иллюстрации и лицензии'),h('p',{},'Картинки встроены в этот файл. Для абстрактных слов показана визуальная ассоциация, а не буквальное изображение. Части тела отмечены на учебной иллюстрации.'),h('p',{},h('a',{href:'https://openmoji.org/',target:'_blank',rel:'noopener noreferrer'},'OpenMoji'),': OpenMoji contributors, ',h('a',{href:'https://creativecommons.org/licenses/by-sa/4.0/',target:'_blank',rel:'noopener noreferrer'},'CC BY-SA 4.0'),'. Исходные SVG сохранены без изменения.'),h('p',{},h('a',{href:'https://github.com/Templarian/MaterialDesign',target:'_blank',rel:'noopener noreferrer'},'Material Design Icons / Pictogrammers'),': Apache 2.0. Цвет некоторых значков изменён.'),h('p',{},'Фотографии, рисунки и аудиозаписи из Anki импортированы из ваших файлов. Исходные наборы: Essential English Words, Core English, Basic English, Close-up и Illustrated Everyday Idioms. Права на публичное распространение этих материалов не подтверждены; файл подготовлен для личного использования.'),h('p',{},'Схема тела создана с помощью ИИ, кадрирована; добавлены маркеры областей. Это учебная иллюстрация, не медицинский атлас.'),h('details',{},h('summary',{},'Тексты лицензий'),h('pre',{class:'license-text'},SD.imageLicenseText)));}


function fx(){}
const cleanW=w=>String(w).toLowerCase().replace(/’/g,"'").replace(/[^a-z' ]/g,'').trim();
function wordSound(){return null;}
function sayWord(){}

// ---------- словарь для подсказок
const DICT_EN={};Object.values(SD.D).forEach(d=>{const k=d[0].toLowerCase();if(!DICT_EN[k])DICT_EN[k]=d[2];});
function dictEN(w){const l=clean(w);return DICT_EN[l]||(l.endsWith('s')&&DICT_EN[l.slice(0,-1)])||(l.endsWith('es')&&DICT_EN[l.slice(0,-2)])||null;}
// ---------- разбор формата Wordly
const COL={B:'s',G:'v',Y:'a',R:'n',O:'p',P:'q',W:'o'};
function parseTask(task){return String(task).split(/\s*;\s*/).filter(Boolean).map(t=>{
  const p=t.split('/');let c=null;if(p.length>=2&&/^[A-Z]{1,3}$/.test(p[p.length-1])&&!(p.length===2&&p[1]==='I')){c=p.pop();}
  const w=p[0].trim(),hint=p.slice(1).join('/').trim();const g=w.match(/^\((.+?)\)(.*)$/);
  return {w:g?g[1]:w,tail:g?g[2]:'',gap:!!g,hint,c:c&&COL[c.replace(/[ZU0-9]/g,'')[0]]||null};});}
function parseAns(a){return String(a).split('+').map(x=>{const m=x.match(/^(.*?)(?:\/([A-Z][A-Z0-9]*))?$/);const code=m[2]||'';const cm=code.replace(/^Z/,'').match(/^([BGYROPW]?)(?:U([01]+))?/)||[];
  return {w:m[1].trim(),c:COL[cm[1]]||null,u:cm[2]||''};}).filter(t=>t.w);}
const ruAns=a=>String(a).split(';').map(w=>({w:w.trim(),c:null,u:''})).filter(t=>t.w);
const joinT=ts=>ts.map(t=>t.w).join(' ');
const norm=s=>' '+String(s).toLowerCase().replace(/’/g,"'").replace(/[.,!?;:«»"—–]/g,' ').replace(/\s+/g,' ').trim()+' ';
function wEl(t,cls){const e=h('span',{class:'aw'+(t.c&&t.c!=='o'?' tc-'+t.c:'')+(cls?' '+cls:'')});
  if(t.u){[...t.w].forEach((ch,i)=>e.append(t.u[i]==='1'?h('u',{},ch):ch));}else e.append(t.w);return e;}
function ansEl(ts,cap){const e=h('span',{class:'ans-sent'});ts.forEach((t,i)=>{if(i)e.append(' ');let tt=t;if(cap&&i===0&&t.w)tt={...t,w:t.w[0].toUpperCase()+t.w.slice(1)};e.append(wEl(tt));});return e;}
function taskEl(toks,opts){opts=opts||{};const e=h('span',{class:'task-sent'});toks.forEach((t,i)=>{if(i)e.append(' ');
  if(t.gap){e.append(h('span',{class:'blank gapslot'},opts.fill||'…'),t.tail||'');return;}
  const s=h('span',{class:'tw'+(t.c&&opts.colored?' tc-'+t.c:'')+(t.hint?' has-tip':''),onclick:()=>{if(/[a-z]/i.test(t.w)&&!/[а-яё]/i.test(t.w))sayWord(t.w);}},t.w);
  if(t.hint)s.append(h('span',{class:'tip'},t.hint));e.append(s);});return e;}
// ---------- разметка правил
const RC=c=>COL[c]||'o';
function ruleHTML(m){const E=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const re=/;\*?([^;]+?)\*?;\/B-([A-Z]{1,2})|;\*([^;]+?)\*;\/([A-Z])|;([^;]+?);\/([A-Z])(?![A-Z])/g;let out='',last=0,mm;const src=String(m).replace(/\r/g,'');
  while((mm=re.exec(src))){out+=E(src.slice(last,mm.index));last=re.lastIndex;
    if(mm[1]!=null){const t=E(mm[1]),c=mm[2];out+=c.length>1?'<span class="chip c2" style="background:linear-gradient(90deg,var(--k'+RC(c[0])+') 50%,var(--k'+RC(c[1])+') 50%)">'+t+'</span>':'<span class="chip c-'+RC(c)+'">'+t+'</span>';}
    else if(mm[3]!=null)out+='<b class="tc-'+RC(mm[4])+'">'+E(mm[3])+'</b>';else out+='<span class="tc-'+RC(mm[6])+'">'+E(mm[5])+'</span>';}
  out+=E(src.slice(last));
  return out.replace(/\*([^*\n]+)\*/g,'<b>$1</b>').replace(/(^|\s)plus(?=\s|$)/g,'$1<span class="plus">+</span>').replace(/\s*#\s*\n?/g,'<br>').replace(/\n/g,'<br>');}
function ruleExample(e,be){return h('div',{class:'rule-example'},h('div',{class:'eyebrow'},'ПРИМЕР'),h('div',{class:'example-en'},be?ansEl([{w:'I',c:'s'},{w:'am',c:'a'},{w:'a beginner.',c:null}]):e.en),h('div',{class:'example-ru'},e.ru));}
function beRows(){return h('div',{class:'be-rows'},h('div',{class:'be-heading'},h('span',{},'Кто — подлежащее'),h('span',{},'Форма be')),[['I','am'],['he / she / it','is'],['you / we / they','are']].map(([subject,form])=>h('div',{class:'be-row'},h('div',{class:'subject-group'},subject.split(' / ').map(w=>h('span',{class:'chip c-s'},w))),h('span',{class:'be-arrow','aria-hidden':'true'},'→'),h('span',{class:'chip c-a be-form'},form))));}
function ruleContent(rid,complete){const r=SD.R[rid];if(!r)return null;const l=SD.L[r.l],first=+rid===11001;const box=h('div',{class:'orule rule-content'},h('p',{class:'rule-summary'},r.short));
 if(first)box.append(beRows());else if(r.formulas?.length)box.append(h('div',{class:'rule-formulas'},r.formulas.map(f=>h('div',{class:'rule-formula-row',html:ruleHTML(f)}))));
 if(l?.examples?.[0])box.append(ruleExample(l.examples[0],first));
 if(complete){box.append(h('h3',{},'Нюансы и исключения'),h('p',{},r.detail));l?.examples?.slice(1).forEach(e=>box.append(ruleExample(e,false)));}
 return box;
}

const ruleBox=(rid,small)=>ruleContent(rid,true);
const hl=s=>esc(s||'').replace(/\[([^\]]+)\]/g,'<b class="hl">$1</b>');
// ---------- индексы
const LV=SD.levels;const NODES=[];
LV.forEach(lv=>{let block=[];lv.list=lv.nodes.map(([k,id],i)=>{const n={k,id,key:k+id,lv,i};
  if(k==='L'){n.d=SD.L[id];n.title=n.d.t;block.push(n);}else if(k==='C'){n.d=SD.C[id];n.title='Checkpoint '+n.d.n;n.block=block;block=[];}else{n.d=SD.P[id];n.title=n.d.t;}
  NODES.push(n);return n;});
  let li=0;lv.list.forEach(n=>{if(n.k==='L')n.num=++li;});});
const nodeBy=key=>NODES.find(n=>n.key===key);
const QI={};
Object.entries(SD.L).forEach(([lid,l])=>l.q.forEach(q=>{QI['q'+q[7]]={q,lid:+lid,rid:q[8]};}));
Object.entries(SD.R).forEach(([rid,r])=>r.q.forEach(q=>{QI['r'+q[7]]={q,lid:r.l,rid:+rid,colored:true};}));
// ---------- задания
function mkTask(q,key,rid,colored){
  const [type,task,answer,wrong,variants,listen,sound]=q;const st={key,rid,sound,colored:!!colored};
  if(type===0){return {...st,type:'insert',toks:parseTask(task),a:String(answer),o:String(wrong||'').split(';').map(x=>x.trim()).filter(Boolean)};}
  const ru=type===1&&answer.includes(';')&&!answer.includes('+');
  const ans=ru?ruAns(answer):parseAns(answer);
  const base={...st,toks:parseTask(task),ans,ru,alts:(variants||[]).map(v=>joinT(parseAns(v)))};
  if(type===2)return {...base,type:'typ'};
  return {...base,type:'build',wrong:String(wrong||'').split(';').map(x=>x.trim()).filter(Boolean),listen:!ru&&listen&&sound&&S.set.listen&&Math.random()<.3};
}
function srcText(toks){return toks.map(t=>t.gap?t.w+t.tail:t.w).join(' ');}
function hintsLine(st){return st.ru?null:null;}
R.build=(st,ctx)=>{
  const tiles=shuffle([...st.ans.map(t=>({w:t.w,c:t.c})),...st.wrong.map(w=>({w,c:null}))]);
  const ans=h('div',{class:'answer-line'}),pool=h('div',{class:'pool'});const chosen=[];
  const pick=t=>{if(t.used)return;t.used=true;chosen.push(t);if(!st.ru)sayWord(t.w);draw();};
  const draw=()=>{ans.innerHTML='';pool.innerHTML='';
    if(!chosen.length)ans.append(h('span',{class:'placeholder'},'Нажимайте на слова (или цифры 1–9)'));
    chosen.forEach((t,i)=>ans.append(h('button',{class:'tile'+(t.c?' tc-bg-'+t.c:''),onclick:()=>{chosen.splice(i,1);t.used=false;draw();}},t.w)));
    tiles.forEach((t,k)=>pool.append(h('button',{class:'tile'+(t.used?' ghost':'')+(t.c?' tc-bg-'+t.c:''),title:k<9?'Клавиша '+(k+1):'',onclick:()=>pick(t)},t.w)));
    ctx.setReady(chosen.length>0);};
  draw();
  ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const t=tiles[+e.key-1];if(t)pick(t);return true;}if(e.key==='Backspace'&&chosen.length){chosen.pop().used=false;draw();return true;}};
  let prompt;
  if(st.listen){prompt=h('div',{class:'listen-box'},spk(st.sound,true),h('div',{class:'muted'},'Прослушайте и соберите фразу'));}
  else prompt=h('div',{class:'prompt'},h('span',{class:'bubble'},'💬'),taskEl(st.toks,{colored:true}));
  return {mode:'check',el:h('div',{},h('h3',{class:'step-title'},st.listen?'Что вы услышали?':st.ru?'Переведите на русский':'Соберите фразу'),st.colored&&st.rid&&st.first?ruleBox(st.rid,true):null,prompt,ans,pool),
    check:()=>{const u=norm(chosen.map(t=>t.w).join(' '));const ok=[joinT(st.ans),...st.alts].some(a=>norm(a)===u);
      return {ok,ans:st.ans,user:chosen.map(t=>t.w).join(' '),tr:st.listen?srcText(st.toks):null};}};
};
R.typ=(st,ctx)=>{
  const inp=h('textarea',{class:'type-input',rows:2,placeholder:'Напишите по-английски…',spellcheck:'false',autocomplete:'off'});
  inp.addEventListener('input',()=>ctx.setReady(inp.value.trim().length>0));
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ctx.enter();}});setTimeout(()=>inp.focus(),50);
  return {mode:'check',el:h('div',{},h('h3',{class:'step-title'},'Напишите по-английски'),h('div',{class:'prompt'},h('span',{class:'bubble'},'💬'),taskEl(st.toks,{colored:true})),inp,
    h('div',{class:'muted small'},'Сокращения (don\'t / do not) засчитываются. Регистр и точки не важны. Наведите на слово — подсказка.')),
    check:()=>({ok:matches(inp.value,[joinT(st.ans),...st.alts]),ans:st.ans,user:inp.value})};
};
R.insert=(st,ctx)=>{
  const sent=h('div',{class:'choice-sent'});const render=(fill,cls)=>{sent.innerHTML='';const e=taskEl(st.toks,{fill,colored:st.colored});if(cls)e.querySelector('.gapslot').classList.add(cls);sent.append(e);};render();
  const opts=shuffle([st.a,...st.o]);let done=false;
  const btns=h('div',{class:'options'},opts.map(o=>h('button',{class:'opt',onclick:e=>{if(done)return;done=true;const ok=o===st.a;render(st.a,ok?'ok':'bad');e.currentTarget.classList.add(ok?'ok':'bad');
    ctx.done({ok,ans:st.toks.map(t=>({w:t.gap?st.a+(t.tail||''):t.w,c:t.c,u:''})),user:o});}},o)));
  ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const b=btns.children[+e.key-1];if(b)b.click();return true;}};
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'Вставьте пропущенное слово'),sent,h('div',{class:'muted small'},'Наведите на слово, чтобы увидеть перевод'),btns)};
};
// быстрая тренировка (таблица)
R.quick=(st,ctx)=>{
  const rows=st.rows.map(r=>{const toks=parseAns(r[0]).map(t=>{const g=t.w.match(/^\((.+)\)$/);return {...t,w:g?g[1]:t.w,gap:!!g};});return {toks,tr:r[1],wrong:r[2],sound:r[3],a:(toks.find(t=>t.gap)||{}).w};});
  let cur=0,errors=0,lock=false;const tb=h('div',{class:'drill'}),opts=h('div',{class:'options'});
  const draw=()=>{tb.innerHTML='';rows.forEach((r,ri)=>{const line=h('div',{class:'q-sent'});r.toks.forEach((t,i)=>{if(i)line.append(' ');
      line.append(t.gap?(ri<cur?wEl({...t,c:t.c||'v'}):h('span',{class:'blank'+(ri===cur?' cur':'')},'…')):wEl(t));});
    tb.append(h('div',{class:'drill-row'+(ri===cur?' cur':'')+(ri<cur?' done':'')},line,h('small',{class:'muted'},r.tr)));});
    opts.innerHTML='';if(cur<rows.length){const r=rows[cur];shuffle([r.a,r.wrong]).forEach(o=>opts.append(h('button',{class:'opt green',onclick:e=>choose(o,e.currentTarget)},o)));}};
  const choose=(o,b)=>{if(lock||cur>=rows.length)return;const r=rows[cur];
    if(o===r.a){fx('tap');cur++;draw();if(cur>=rows.length)setTimeout(()=>ctx.done({ok:errors===0,noRetry:true,msg:errors?'Ошибок: '+errors:'Вы ответили правильно на все вопросы!'}),400);}
    else{errors++;lock=true;fx('wrong');b.classList.add('bad');setTimeout(()=>{b.classList.remove('bad');lock=false;},600);}};
  draw();ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const b=opts.children[+e.key-1];if(b)b.click();return true;}};
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'⚡ Быстрая тренировка'),h('div',{class:'muted small'},'Выбирайте правильную форму для каждой строки'),tb,opts)};
};
R.rule=(st)=>({mode:'continue',el:h('div',{class:'rule-step'},h('div',{class:'rule-num'},'Правило '+st.num+(st.of>1?' из '+st.of:'')),ruleBox(st.rid))});
R.banner=(st)=>({mode:'continue',el:h('div',{class:'center-step'},st.img?img(st.img,'banner-img'):h('div',{class:'big-emoji'},st.icon||'⭐'),h('h2',{},st.title),st.text?h('p',{class:'muted'},st.text):null)});
// ---------- слова
const D=id=>{let w;if(typeof id==='string'&&id[0]==='u'){const c=S.cards[id];if(!c)return null;w={id,en:c.en,tr:c.tr||'',ru:c.ru,f2:'',f3:'',exen:c.ex||'',exru:c.exru||'',wrong:'',sound:'',img:'',user:1,deck:c.deck};}else{const d=SD.D[id];if(!d)return null;w={id:+id,en:d[0],tr:d[1],ru:d[2],f2:d[3],f3:d[4],exen:d[5],exru:d[6],wrong:d[7],sound:SD.audio?.[id]?.word?.[0]||'',img:SD.visuals?.[id]?.asset||'',ext:!!d[10]};}const edit=S.wordEdits?.[id]||{};if(edit.en&&cleanW(edit.en)!==cleanW(w.en))w.sound='';return {...w,...edit};};
const ALLD=Object.keys(SD.D).filter(id=>!SD.D[id][10]).map(D);
function wordCard(w,big){return h('div',{class:'wcard'+(big?' big':'')},wordArtwork(w),
  h('div',{class:'w-en'},w.en,spk(w.sound)),w.tr?h('div',{class:'w-tr'},'['+w.tr+']'):null,h('div',{class:'w-ru'+(w.ru.length>70?' long-meaning':'')},w.ru),
  w.f2||w.f3?h('div',{class:'w-forms'},'Формы: ',h('b',{},w.en),' – ',h('b',{},w.f2),' – ',h('b',{},w.f3)):null,
  exampleBlock(w.exen,w.exru,null,!!SD.wordMeta?.[w.id]?.exampleAuto&&!S.wordEdits?.[w.id]?.exru),audioMaterials(w),definitionBlock(w),S.notes[w.id]?h('div',{class:'w-note'},'💭 '+S.notes[w.id]):null,big?importedContext(w):null,big?ctxEl(w,2):null);}
R.word=(st)=>{setTimeout(()=>voice(st.w.sound),250);return {mode:'continue',el:h('div',{class:'center-step'},h('div',{class:'muted'},st.newTitle||'Новое слово'),wordCard(st.w,true))};};
function distract(w,field,n){const out=[];const wr=(w.wrong||'').split('/');const v=field==='ru'?wr[0]:wr[1];if(v&&v.trim()&&v.trim().toLowerCase()!==w[field].toLowerCase())out.push(v.trim());
  const pool=shuffle(ALLD).filter(x=>x.id!==w.id);for(const x of pool){if(out.length>=n)break;const s=x[field];if(s&&!out.some(o=>o.toLowerCase()===s.toLowerCase())&&s.toLowerCase()!==w[field].toLowerCase())out.push(s);}return out;}
R.wchoice=(st,ctx)=>{const w=st.w;const dir=st.dir||'en';const tgt=dir==='en'?'ru':'en';const right=w[tgt];
  const opts=shuffle([right,...distract(w,tgt,3)]);let done=false;
  if(dir==='en'||dir==='listen')setTimeout(()=>voice(w.sound),250);
  const btns=h('div',{class:'options col'},opts.map(o=>h('button',{class:'opt',onclick:e=>{if(done)return;done=true;const ok=o===right;e.currentTarget.classList.add(ok?'ok':'bad');
    if(!ok)[...btns.children].forEach(b=>{if(b.textContent===right)b.classList.add('ok');});ctx.done({ok,word:w});}},o)));
  ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const b=btns.children[+e.key-1];if(b)b.click();return true;}};
  const q=dir==='listen'?h('div',{class:'listen-box'},spk(w.sound,true),h('div',{class:'muted'},'Какое слово вы услышали?')):
    h('div',{class:'w-q'},w.img&&dir==='ru'?img(w.img,'w-img sm'):null,h('div',{class:'w-en'},dir==='en'?w.en:w.ru,dir==='en'?spk(w.sound):null),dir==='en'&&w.tr?h('div',{class:'w-tr'},'['+w.tr+']'):null);
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},dir==='en'?'Выберите перевод':dir==='ru'?'Как это по-английски?':'Что вы услышали?'),q,btns)};};
R.wlisten=(st,ctx)=>R.wchoice({...st,dir:'listen'},ctx);
R.wtype=(st,ctx)=>{const w=st.w;const inp=h('input',{class:'type-input one',placeholder:'Напишите слово по-английски…',spellcheck:'false',autocomplete:'off'});
  inp.addEventListener('input',()=>ctx.setReady(inp.value.trim().length>0));inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ctx.enter();}});setTimeout(()=>inp.focus(),50);
  const first=w.en.replace(/^(to |a |an |the )/i,'');
  return {mode:'check',el:h('div',{},h('h3',{class:'step-title'},'Напишите по-английски'),h('div',{class:'w-q'},w.img?img(w.img,'w-img sm'):null,h('div',{class:'w-en'},w.ru),h('div',{class:'muted small'},'Подсказка: '+first[0]+'… ('+first.length+' букв)')),inp),
    check:()=>{const u=norm(inp.value).trim(),a=norm(w.en).trim();const ok=u===a||u===norm(first).trim()||w.en.split(/[,/]/).some(x=>norm(x).trim()===u);return {ok,word:w,user:inp.value,noRetry:true};}};};
// ---------- проверка (checkpoint)
R.tf=(st,ctx)=>{let done=false;
  const btns=h('div',{class:'options tf'},[[1,'✓ Верно'],[0,'✗ Есть ошибка']].map(([v,l])=>h('button',{class:'opt '+(v?'green':'redb'),onclick:e=>{if(done)return;done=true;const ok=v===st.a;e.currentTarget.classList.add(ok?'ok':'bad');
    ctx.done({ok,msg:st.a?'Предложение составлено правильно':'В предложении есть ошибка'});}},l)));
  ctx.keys=e=>{if(e.key==='1'||e.key==='2'){btns.children[+e.key-1].click();return true;}};
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'Правильно ли составлено предложение?'),h('div',{class:'choice-sent big'},st.text),btns)};};
// ---------- диалоги
function chatEl(hist){return h('div',{class:'chat'},hist.map(x=>h('div',{class:'msg '+x.who},h('div',{},x.en),x.ru?h('small',{class:'muted'},x.ru):null)));}
R.dlgq=(st,ctx)=>{const q=st.q;let done=false;const opts=shuffle([q[1],q[4]].filter(Boolean));
  const btns=h('div',{class:'options col'},opts.map(o=>h('button',{class:'opt',onclick:e=>{if(done)return;done=true;const ok=o===q[1];e.currentTarget.classList.add(ok?'ok':'bad');ctx.done({ok,msg:q[0]+' — '+q[1]});}},o)));
  ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const b=btns.children[+e.key-1];if(b)b.click();return true;}};
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'Что вам сказали?'),chatEl([...st.hist,{who:'them',en:q[0]}]),btns)};};
R.dlgr=(st,ctx)=>{const q=st.q;const ans=q[2].split(/\s*\+\s*|\s*;\s*/).filter(Boolean).map(w=>({w,c:null,u:''}));
  const sub=R.build({type:'build',toks:[],ans,wrong:String(q[5]||'').split(';').filter(Boolean),alts:[],ru:false},ctx);
  const el=h('div',{},h('h3',{class:'step-title'},'Ответьте собеседнику'),chatEl([...st.hist,{who:'them',en:q[0],ru:q[1]}]),h('div',{class:'prompt'},h('span',{class:'bubble'},'💬'),q[3]),sub.el.querySelector('.answer-line'),sub.el.querySelector('.pool'));
  return {mode:'check',el,check:()=>{const r=sub.check();return {...r,cap:true};}};};
function dialogSteps(p){const steps=[];const hist=[];
  p.q.forEach(q=>{steps.push({type:'dlgq',q,hist:hist.slice(),sound:q[6]});steps.push({type:'dlgr',q,hist:hist.slice(),sound:q[6]});hist.push({who:'them',en:q[0],ru:q[1]},{who:'me',en:q[2].split(/\s*\+\s*|\s*;\s*/).join(' '),ru:q[3]});});
  return steps;}
// ---------- сборка уроков
function lessonSteps(n){const L=n.d;const steps=[{type:'banner',img:L.img,title:'Урок '+n.num+'. '+L.t,text:(L.th?L.th+' · ':'')+L.r.length+' '+plural(L.r.length,'правило','правила','правил')+(L.w.length?' · '+L.w.length+' '+plural(L.w.length,'новое слово','новых слова','новых слов'):'')}];
  const words=L.w.map(D).filter(Boolean);
  words.forEach(w=>steps.push({type:'word',w}));
  shuffle(words).forEach(w=>steps.push({type:'wchoice',w,dir:'en',srs:w.id}));
  L.r.forEach((rid,ri)=>{const r=SD.R[rid];if(!r)return;steps.push({type:'rule',rid,num:ri+1,of:L.r.length});
    r.q.forEach((q,qi)=>steps.push({...mkTask(q,'r'+q[7],rid,true),first:qi===0}));
    r.k.forEach(p=>steps.push({type:'quick',rows:p,rid}));
    r.d.forEach(q=>steps.push(mkTask([1,q[0],q[1],q[2],[],1,q[3]],null,rid,false)));});
  if(L.q.length)steps.push({type:'banner',icon:'🏋️',title:'Тренировка',text:'Закрепим правила урока'});
  L.q.forEach(q=>steps.push(mkTask(q,'q'+q[7],q[8],false)));
  return steps;}
function cpSteps(n){return shuffle((n.d.practice||[]).flatMap(([lid,rid])=>(SD.R[rid]?.q||[]).slice(0,3).map(q=>mkTask(q,'r'+q[7],rid,false))));}
// ======================================================= Тренировка времён (v3)
const GX=window.GX;
const TT=k=>TS.T.find(t=>t.k===k)||null;
const TN=k=>k==='GT'?'be going to':(TT(k)||{en:k}).en;
const TKEYS=TS.T.map(t=>t.k);
const PAIRS=GX.PAIRS;
const partners=k=>{const s=new Set();PAIRS.forEach(p=>{if(p.a===k&&TT(p.b))s.add(p.b);if(p.b===k&&TT(p.a))s.add(p.a);});
  if(!s.size){const t=TT(k);TS.T.filter(x=>x!==t&&(x.time===t.time||x.g===t.g)).slice(0,2).forEach(x=>s.add(x.k));}return [...s];};
function pairStep(p,i){const f=p.items[i].split('|');const tk=f[0]==='a'?p.a:p.b,ot=f[0]==='a'?p.b:p.a;
  return {type:'pick',ctxt:f[1],sent:f[2],a:f[3],o:[f[4]],otk:{[f[3]]:tk,[f[4]]:ot},tk,why:f[5],key:'p:'+p.id+':'+i,pair:p.id,tense:TT(tk)};}
function cxStep(i){const f=GX.CX[i].split('|');const otk={[f[2]]:f[0]};const o=f[3].split('/').map(x=>{const j=x.lastIndexOf(':');const w=x.slice(0,j);otk[w]=x.slice(j+1);return w;});
  return {type:'pick',ctxt:'Сложное предложение',sent:f[1],a:f[2],o,otk,tk:f[0],why:f[4],key:'c:'+i,tense:TT(f[0])};}
const pairBy=id=>PAIRS.find(p=>p.id===id);
function keyStep(k){if(QI[k]){const x=QI[k];return {...mkTask(x.q,k,x.rid,x.colored),listen:false};}
  let m=k.match(/^p:(\w+):(\d+)$/);if(m&&pairBy(m[1])&&pairBy(m[1]).items[+m[2]])return pairStep(pairBy(m[1]),+m[2]);
  m=k.match(/^c:(\d+)$/);if(m&&GX.CX[+m[1]])return cxStep(+m[1]);return null;}
function keyText(k){if(QI[k]){const q=QI[k].q;const ans=q[0]===0?null:(q[2].includes(';')&&!q[2].includes('+')?ruAns(q[2]):parseAns(q[2]));const n=nodeBy('L'+QI[k].lid);
    return {main:q[0]===0?h('span',{},srcText(parseTask(q[1]))):ansEl(ans,true),sub:srcText(parseTask(q[1])).replace(/\(|\)/g,''),src:n?n.lv.t+' · Урок '+n.num+'. '+n.title:'',snd:q[6]};}
  const st=keyStep(k);if(!st)return null;return {main:h('span',{},st.sent.replace('___','['+st.a+']')),sub:st.ctxt,src:st.pair?pairBy(st.pair).t:'Сложные предложения · '+TN(st.tk)};}
// --- выбор формы в контексте
R.pick=(st,ctx)=>{const sent=h('div',{class:'choice-sent'});
  const render=(fill,cls)=>{sent.innerHTML='';const [x,y]=st.sent.split('___');sent.append(x,h('span',{class:'blank '+(cls||'')},fill||'…'),y||'');};render();
  const opts=shuffle([st.a,...st.o]);let done=false;
  const btns=h('div',{class:'options col'},opts.map(o=>h('button',{class:'opt',onclick:e=>{if(done)return;done=true;const ok=o===st.a;render(st.a,ok?'ok':'bad');e.currentTarget.classList.add(ok?'ok':'bad');
    if(!ok)[...btns.children].forEach(b=>{if(b.textContent===st.a)b.classList.add('ok');});
    const full=st.sent.replace(/\s*\([^)]*\)/,'').replace('___',st.a).replace(/\s+([.?!,])/g,'$1');
    ctx.done({ok,chosenTk:st.otk&&st.otk[o],node:h('span',{},h('b',{class:'tc-v'},full)),msg:st.why,correctText:st.tk?'Время: '+TN(st.tk):null});}},o)));
  ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){const b=btns.children[+e.key-1];if(b)b.click();return true;}};
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'Выберите правильную форму'),st.ctxt?h('div',{class:'ctx-chip'},st.ctxt):null,sent,btns)};};
// --- сравнение пары
R.cmp=(st)=>{const p=st.pair;const A=TT(p.a),B=TT(p.b);
  const col=(t,k,i)=>h('div',{class:'cmp-col'},h('div',{class:'cmp-h '+(i?'b':'a')},TN(k)),t&&t.tl?timeline(t.tl):null,
    p.cmp.map(c=>h('div',{class:'cmp-ex'},h('div',{class:'cmp-en'},c[i]),h('small',{class:'muted'},c[i+2]))));
  return {mode:'continue',el:h('div',{},h('h3',{class:'step-title'},'⚖️ '+p.t),h('div',{class:'cmp'},col(A,p.a,0),col(B,p.b,1)),h('div',{class:'note'},'💡 '+p.tip))};};
R.tcard=(st)=>({mode:'continue',el:h('div',{},h('h3',{class:'step-title'},'Формула времени'),tenseCard(st.tense))});
// --- найди и исправь ошибки в тексте
function parseText(x){const parts=[];let last=0;const re=/\{([^>]+)>([^>]+)>([^:]+):([A-Za-z]+)\}/g;let m;
  while((m=re.exec(x))){if(m.index>last)parts.push({t:x.slice(last,m.index)});parts.push({err:true,w:m[1],r:m[2],alt:m[3],tk:m[4]});last=re.lastIndex;}
  if(last<x.length)parts.push({t:x.slice(last)});return parts;}
R.fix=(st,ctx)=>{const T=st.text;const parts=parseText(T.x);const errs=parts.filter(p=>p.err);let found=0,misses=0,wrongFix=0,finished=false;
  const box=h('div',{class:'fix-text'});const pop=h('div',{class:'fix-pop hidden'});const info=h('div',{class:'muted small'});
  const upd=()=>{info.textContent='Найдено ошибок: '+found+' из '+errs.length+(misses?' · лишних нажатий: '+misses:'');};
  const finish=(giveup)=>{if(finished)return;finished=true;pop.className='fix-pop hidden';
    errs.forEach(e=>{if(!e.fixed){e.el.className='fx-w miss';e.el.textContent=e.r;}const ok=e.fixed&&e.first;S.ts[e.tk]=S.ts[e.tk]||{n:0,ok:0};S.ts[e.tk].n++;if(ok)S.ts[e.tk].ok++;});save();
    const ok=!giveup&&misses+wrongFix===0;ctx.done({ok,noRetry:true,msg:giveup?'Пропущено ошибок: '+(errs.length-found):'Все ошибки исправлены'+(misses+wrongFix?' (лишних нажатий: '+misses+', неверных исправлений: '+wrongFix+')':'!')});};
  parts.forEach(p=>{if(p.err){p.first=true;const s=h('span',{class:'fx-w'},p.w);p.el=s;s.onclick=()=>{if(finished||p.fixed)return;
      pop.innerHTML='';pop.className='fix-pop';pop.append(h('div',{class:'muted small'},'Как правильно?'),h('div',{class:'options'},shuffle([p.r,p.w,p.alt]).map(o=>h('button',{class:'opt',onclick:()=>{
        if(o===p.r){p.fixed=true;found++;s.textContent=p.r;s.className='fx-w fixed';pop.className='fix-pop hidden';fx('tap');upd();if(found===errs.length)finish(false);}
        else{wrongFix++;p.first=false;fx('wrong');pop.className='fix-pop hidden';s.classList.add('shake');setTimeout(()=>s.classList.remove('shake'),400);}}},o))));
      s.after(pop);};box.append(s);}
    else p.t.split(/(\s+)/).forEach(w=>{if(!w.trim()){box.append(w);return;}const s=h('span',{class:'fx-n'},w);s.onclick=()=>{if(finished)return;misses++;s.classList.add('nope');setTimeout(()=>s.classList.remove('nope'),500);upd();};box.append(s);});});
  upd();
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'🔎 Найдите и исправьте ошибки'),h('div',{class:'ctx-chip'},T.t+' · ошибок в тексте: '+errs.length),box,info,
    h('div',{class:'row'},h('button',{class:'main-btn ghost small',onclick:()=>finish(true)},'Показать ответы'))),};};
// --- шаги: генераторы
const genStep=(type,tks,modes,colored)=>{const g=TS.gen(tks,modes||(type==='tform'?['aff','neg']:['aff','neg','q']));return {type,g,tense:g.t,tk:g.t.k,colored:!!colored};};
function formulaSteps(tk){const t=TT(tk);const s=[{type:'tcard',tense:t}];for(let i=0;i<10;i++)s.push(genStep('tbuild',[tk],null,i<5));return s;}
function compareSteps(tk){const ps=PAIRS.filter(p=>p.a===tk||p.b===tk);if(!ps.length){const ks=[tk,...partners(tk)];return [{type:'tcard',tense:TT(tk)},...Array.from({length:10},(_,i)=>genStep(i%2?'tname':'tform',i%2?ks:[tk],null))];}
  const s=[];ps.forEach(p=>s.push({type:'cmp',pair:p}));const items=shuffle(ps.flatMap(p=>p.items.map((_,i)=>pairStep(p,i)))).slice(0,14);return [...s,...items];}
function contextSteps(tk){const cx=shuffle(GX.CX.map((_,i)=>i).filter(i=>{const f=GX.CX[i].split('|');return f[0]===tk||f[3].includes(':'+tk);})).slice(0,8).map(cxStep);
  const tx=shuffle(GX.TEXTS.filter(t=>t.x.includes(':'+tk+'}'))).slice(0,1).map(text=>({type:'fix',text}));
  const ks=[tk,...partners(tk)];const gen=Array.from({length:Math.max(4,10-cx.length)},()=>genStep('tform',ks));
  return [...shuffle([...cx,...gen]),...tx];}
function mixSteps(n,tks){tks=tks&&tks.length?tks:TKEYS;const s=[];
  const pi=shuffle(PAIRS.flatMap(p=>p.items.map((_,i)=>[p,i]))).filter(([p,i])=>{const f=p.items[i].split('|');return true;}).slice(0,Math.round(n*.32)).map(([p,i])=>pairStep(p,i));
  const cx=shuffle(GX.CX.map((_,i)=>i)).slice(0,Math.round(n*.2)).map(cxStep);
  const gn=Array.from({length:Math.round(n*.32)},(_,i)=>genStep(i%2?'tname':'tform',tks));
  const done=NODES.filter(x=>x.k==='L'&&S.stars[x.key]).flatMap(x=>x.d.q.filter(q=>q[0]===0));
  const ins=shuffle(done).slice(0,n-pi.length-cx.length-gn.length).map(q=>mkTask(q,'q'+q[7],q[8],false));
  s.push(...pi,...cx,...gn,...ins);while(s.length<n)s.push(genStep('tform',tks));return shuffle(s).slice(0,n);}
// --- итоги сессии по временам
function tenseReport(log){const per={},conf={};log.filter(x=>x.first&&x.tk).forEach(x=>{const p=per[x.tk]=per[x.tk]||{n:0,ok:0};p.n++;if(x.ok)p.ok++;if(!x.ok&&x.ch&&x.ch!==x.tk){const k=x.tk+'>'+x.ch;conf[k]=(conf[k]||0)+1;}});
  const rows=Object.entries(per).sort((a,b)=>a[1].ok/a[1].n-b[1].ok/b[1].n);if(!rows.length)return null;
  return h('div',{class:'report'},h('h3',{},'Результат по временам'),rows.map(([k,p])=>accRow(TN(k),p.ok,p.n)),
    Object.keys(conf).length?h('div',{},h('h3',{},'Где путаница'),confList(conf,5)):null);}
function accRow(label,ok,n){const pc=n?Math.round(ok/n*100):0;return h('div',{class:'acc-row'},h('span',{},label),h('span',{class:'acc-bar'},h('i',{style:'width:'+pc+'%;background:'+(pc>=85?'var(--g)':pc>=60?'var(--y)':'var(--r)')})),h('small',{},ok+'/'+n+' · '+pc+'%'));}
function confList(conf,max){return h('div',{class:'conf-list'},Object.entries(conf).sort((a,b)=>b[1]-a[1]).slice(0,max).map(([k,c])=>{const [a,b]=k.split('>');const p=PAIRS.find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a));
  return h('div',{class:'conf'},h('span',{},'Нужно ',h('b',{},TN(a)),' — а выбрано ',h('b',{class:'tc-n'},TN(b))),h('small',{class:'muted'},'×'+c),
    p?h('button',{class:'main-btn small blue',onclick:()=>startPair(p)},'Тренировать пару'):(TT(a)&&TT(b)?h('button',{class:'main-btn small ghost',onclick:()=>startDuel([a,b])},'Тренировать'):null));}));}
// --- запуск режимов
function startPair(p){const steps=[{type:'cmp',pair:p},...shuffle(p.items.map((_,i)=>pairStep(p,i)))];
  startSession({title:p.t,doneTitle:'Пара отработана!',again:()=>startPair(p),back:showTenses,extra:tenseReport},steps);}
function startDuel(ks){const steps=Array.from({length:12},(_,i)=>genStep(['tform','tname','tbuild'][i%3],ks));startSession({title:ks.map(TN).join(' vs '),back:showTenses,extra:tenseReport},steps);}
function startMix(n){startSession({title:'Микс-тест вслепую',doneTitle:'Микс-тест завершён!',again:()=>startMix(n),back:showTenses,extra:tenseReport,hideTitles:true},mixSteps(n||25));}
function startText(t){startSession({title:'Найди ошибки: '+t.t,back:showTenses},[{type:'fix',text:t}]);}
function startCx(){startSession({title:'Сложные предложения',again:startCx,back:showTenses,extra:tenseReport},shuffle(GX.CX.map((_,i)=>cxStep(i))).slice(0,15));}
// --- путь времени
const STAGES=[['Формула','Соберите утверждение, отрицание и вопрос из блоков',formulaSteps,90],['Сравнение','Контраст с похожим временем: смысл, а не формула',compareSteps,85],
  ['Контекст','Сложные предложения и поиск ошибок в тексте',contextSteps,85],['Спринт','4 секунды на ответ — до автоматизма',null,80],['Микс-тест','Вперемешку со всеми временами, без подсказки темы',null,85]];
const pathOf=k=>S.path[k]||(S.path[k]=[0,0,0,0,0]);
const stageOpen=()=>true;
function runStage(k,i){const P=pathOf(k);const done=acc=>{if(acc>P[i]){P[i]=acc;save();}};const back=()=>showTensePath(k);
  if(i===3)return startSprint({mode:'tenses',tenses:[k,...partners(k)],n:20,sec:S.set.sprintSec||4,onDone:done,back,title:'Спринт: '+TN(k)});
  if(i===4){const tks=[...new Set([k,...TKEYS.filter(x=>pathOf(x)[0]>=90)])];return startSession({title:'Микс-тест · '+TN(k),back,onDone:done,extra:tenseReport,again:()=>runStage(k,i)},mixSteps(20,tks.length>1?tks:TKEYS));}
  startSession({title:TN(k)+' · '+STAGES[i][0],back,onDone:done,extra:tenseReport,again:()=>runStage(k,i)},STAGES[i][2](k));}
function stageDots(k){const P=pathOf(k);return h('span',{class:'dots'},STAGES.map((s,i)=>h('i',{class:P[i]>=s[3]?'on':P[i]>0?'half':'',title:s[0]+': '+P[i]+'%'})));}
function showTensePath(k){nav('tenses');const t=TT(k);const P=pathOf(k);
  setMain(h('div',{class:'page'},h('button',{class:'main-btn ghost small',onclick:showTenses},'← Все времена'),h('h1',{},t.en),h('p',{class:'muted'},t.ru),tenseCard(t),h('h2',{},'Путь изучения'),h('div',{class:'stages'},STAGES.map((s,i)=>{const open=stageOpen(k,i);const pass=P[i]>=s[3];
      return h('div',{class:'stage'+(pass?' pass':'')+(open?'':' locked')},h('div',{class:'st-n'},pass?'✓':i+1),h('div',{class:'st-b'},h('b',{},s[0]),h('small',{class:'muted'},s[1]+(P[i]?' · лучший результат '+P[i]+'%':''))),
        h('button',{class:'main-btn small '+(open?'blue':'ghost'),disabled:!open,onclick:()=>runStage(k,i)},open?(P[i]?'Ещё раз':'Начать'):'🔒'));}))));}
// --- спринт
const IRR=GX.IRR.split(';').map(x=>{const [b,p,pp,ru]=x.split('|');return {b,p,pp,ru};});
const AUX=['do','does','did','am','is','are','was','were','have','has','had','will'];
function sprintQ(cfg){
  if(cfg.mode==='irr'){const v=rnd(IRR);const f=Math.random()<.5?'p':'pp';const right=v[f];const reg=v.b.replace(/e$/,'')+'ed';
    const pool=[...new Set([v.p,v.pp,reg,v.b].filter(x=>x!==right))];return {q:h('div',{},h('div',{class:'sp-big'},v.b),h('div',{class:'muted'},v.ru+' · '+(f==='p'?'V2 (Past Simple)':'V3 (Perfect, пассив)'))),a:right,o:shuffle([right,...shuffle(pool).slice(0,2)]),label:v.b+' → '+right};}
  const g=TS.gen(cfg.tenses&&cfg.tenses.length?cfg.tenses:TKEYS,cfg.mode==='aux'?['neg','q']:['aff','neg']);
  if(cfg.mode==='aux'){const i=g.toks.findIndex(t=>t.c==='a');if(i<0)return sprintQ(cfg);const w=g.toks[i].w;const right=w.toLowerCase();
    const sent=g.toks.map((t,j)=>j===i?'___':t.w).join(' ');const o=shuffle(AUX.filter(x=>x!==right)).slice(0,2);
    return {q:h('div',{class:'sp-sent'},sent.replace(/^___/,'___')),a:right,o:shuffle([right,...o]),tk:g.t.k,label:plain(g.toks)};}
  const vstr=t=>TS.verbPart(t,g.mode,g.subj[1],g.v).post.map(x=>x[1]).join(' ');const right=vstr(g.t);
  const ks=(cfg.tenses&&cfg.tenses.length>1?cfg.tenses.map(TT):[]).filter(t=>t&&t!==g.t);const others=shuffle([...ks,...similarTenses(g.t)]);const om={[right]:g.t.k};const o=[];
  for(const t of others){const v=vstr(t);if(v!==right&&!o.includes(v)){o.push(v);om[v]=t.k;}if(o.length>=2)break;}
  const toks=[];let gap=false;g.toks.forEach(t=>{if(t.c==='a'||t.c==='v'||t.c==='n'){if(!gap){toks.push('___');gap=true;}}else toks.push(t.w);});
  return {q:h('div',{},h('p',{class:'muted small'},g.t.use),h('div',{class:'sp-sent'},toks.join(' ').replace('___','___ ('+(g.mode==='neg'?'not ':'')+g.v.b+')'))),a:right,o:shuffle([right,...o]),om,tk:g.t.k,label:plain(g.toks)};}
function startSprint(cfg){markDay();fx('start');let i=0,score=0,streak=0,best=0,timer=null,t0=0;const errs=[];const times=[];
  const bar=h('div',{class:'sp-time'},h('i')),cnt=h('div',{class:'sp-cnt'}),card=h('div',{class:'sp-card'}),opts=h('div',{class:'options col'});
  const exit=h('button',{class:'icon-btn',onclick:()=>{clearTimeout(timer);session=null;(cfg.back||showTenses)();}},'×');
  setMain(h('div',{class:'session sprint'},h('div',{class:'session-top'},exit,h('div',{class:'progress'},h('i')),h('span',{class:'session-title'},cfg.title||'Спринт')),cnt,bar,card,opts),true);
  let cur=null,lock=false;
  const next=()=>{if(i>=cfg.n)return end();cur=sprintQ(cfg);lock=false;i++;$('.sprint .progress i').style.width=Math.round((i-1)/cfg.n*100)+'%';
    cnt.innerHTML='';cnt.append(h('span',{},i+' / '+cfg.n),h('span',{class:'tc-a'},'⚡ '+score));if(streak>=3)cnt.append(h('span',{class:'tc-p'},'🔥 '+streak));
    card.innerHTML='';card.append(cur.q);opts.innerHTML='';cur.o.forEach((o,k)=>opts.append(h('button',{class:'opt',onclick:e=>answer(o,e.currentTarget)},h('small',{},(k+1)+'  '),o)));
    const b=bar.firstChild;b.style.transition='none';b.style.width='100%';void b.offsetWidth;b.style.transition='width '+cfg.sec+'s linear';b.style.width='0%';
    t0=Date.now();timer=setTimeout(()=>answer(null,null),cfg.sec*1000);};
  const answer=(o,btn)=>{if(lock)return;lock=true;clearTimeout(timer);const ok=o===cur.a;times.push(Date.now()-t0);
    if(ok){score++;streak++;best=Math.max(best,streak);fx('tap');}else{streak=0;fx('wrong');errs.push(cur.label+(o?'  (вы: '+o+')':'  (время вышло)'));}
    S.answers++;if(ok)S.correct++;
    if(cur.tk){const p=S.ts[cur.tk]=S.ts[cur.tk]||{n:0,ok:0};p.n++;if(ok)p.ok++;else if(o&&cur.om&&cur.om[o]&&cur.om[o]!==cur.tk){const k=cur.tk+'>'+cur.om[o];S.conf[k]=(S.conf[k]||0)+1;}}
    [...opts.children].forEach(b=>{if(b.textContent.trim().endsWith(cur.a)&&b.lastChild.textContent===cur.a)b.classList.add('ok');});if(btn&&!ok)btn.classList.add('bad');
    setTimeout(next,ok?350:1100);};
  const end=()=>{session=null;fx('win');save();const acc=Math.round(score/cfg.n*100);const key=cfg.mode+(cfg.mode==='tenses'?':'+(cfg.tenses||[]).join(','):'');
    const rec=S.sprint[key]||0;if(score>rec)S.sprint[key]=score;save();if(cfg.onDone)cfg.onDone(acc);
    const avg=times.length?(times.reduce((a,b)=>a+b,0)/times.length/1000).toFixed(1):0;
    setMain(h('div',{class:'finish'},h('div',{class:'big-star'},'⚡'),h('h2',{},'Спринт завершён!'),
      h('div',{class:'stats'},h('div',{class:'stat y'},h('small',{},'ОЧКИ'),score+' / '+cfg.n),h('div',{class:'stat g'},h('small',{},'ТОЧНОСТЬ'),acc+'%'),h('div',{class:'stat p'},h('small',{},'СРЕДНЕЕ ВРЕМЯ'),avg+' с'),h('div',{class:'stat b'},h('small',{},'СЕРИЯ'),'🔥 '+best)),
      score>rec?h('p',{class:'tc-a'},'🏆 Новый рекорд!'):h('p',{class:'muted'},'Рекорд: '+rec),
      errs.length?h('div',{class:'report'},h('h3',{},'Ошибки'),errs.map(e=>h('div',{class:'fb-line'},e))):null,
      h('div',{class:'row'},h('button',{class:'main-btn ghost',onclick:()=>startSprint(cfg)},'Ещё раз'),h('button',{class:'main-btn blue',onclick:cfg.back||showTenses},'Продолжить'))),true);};
  session={back:()=>exit.click(),key:e=>{if(e.key==='Escape'){exit.click();return;}if(/^[1-3]$/.test(e.key)){const b=opts.children[+e.key-1];if(b){b.click();e.preventDefault();}}}};
  next();}
// --- экран «Времена»
function showTenses(){nav('tenses');
  const grid=h('div',{class:'path-grid'});['Present','Past','Future'].forEach(tm=>TS.T.filter(t=>t.time===tm).forEach(t=>{const p=S.ts[t.k];
    grid.append(h('button',{class:'pcard g-'+t.g.replace(/ /g,''),onclick:()=>showTensePath(t.k)},h('b',{},t.en),h('small',{class:'muted'},t.ru),stageDots(t.k),p?h('small',{},Math.round(p.ok/p.n*100)+'% верно · '+p.n):h('small',{class:'muted'},'ещё не начато')));}));
  const sec=S.set.sprintSec||4;
  const conf=Object.keys(S.conf).length?confList(S.conf,6):h('p',{class:'muted'},'Пока нет данных — пройдите микс-тест или спринт.');
  const accs=TKEYS.filter(k=>S.ts[k]).map(k=>accRow(TN(k),S.ts[k].ok,S.ts[k].n));
  setMain(h('div',{class:'page'},h('h1',{},'Времена'),
    h('p',{class:'muted'},'Каждое время проходит 5 этапов: формула → сравнение с похожим временем → контекст → спринт на скорость → микс-тест вслепую. Все этапы доступны сразу; спринт можно пропустить.'),
    h('h2',{},'Путь времени'),grid,
    h('h2',{},'⚖️ Пары времён'),h('p',{class:'muted small'},'Самые частые путаницы: сначала сравнение смысла, потом выбор формы в ситуации.'),
    h('div',{class:'pairs-grid'},PAIRS.map(p=>{const s=S.ps[p.id];return h('button',{class:'paircard',onclick:()=>startPair(p)},h('b',{},p.t),h('small',{class:'muted'},p.items.length+' ситуаций'+(s?' · '+Math.round(s.ok/s.n*100)+'% верно':'')));})),
    h('h2',{},'⚡ Спринт'),h('p',{class:'muted small'},'На ответ — '+sec+' с. Клавиши 1–3.'),
    h('div',{class:'row'},[['tenses','Формы всех времён'],['aux','Вспомогательные глаголы'],['irr','Неправильные глаголы']].map(([m,l])=>h('button',{class:'main-btn ghost',onclick:()=>startSprint({mode:m,tenses:TKEYS,n:20,sec,title:'Спринт: '+l})},l,h('small',{class:'muted'},'  🏆 '+(S.sprint[m+(m==='tenses'?':'+TKEYS.join(','):'')]||0)))),
      h('select',{class:'sel',onchange:e=>{S.set.sprintSec=+e.target.value;save();showTenses();}},[3,4,6,8].map(n=>{const o=h('option',{value:n},n+' сек');if(n===sec)o.selected=true;return o;}))),
    h('h2',{},'🎲 Микс-тест вслепую'),h('p',{class:'muted small'},'25 вопросов вперемешку: пары, сложные предложения, формы и задания из пройденных уроков. Тема не подсказывается.'),
    h('div',{class:'row'},h('button',{class:'main-btn blue',onclick:()=>startMix(25)},'▶ Начать микс-тест'),h('button',{class:'main-btn ghost',onclick:startCx},'Сложные предложения (when, if, since…)')),
    h('h2',{},'🔎 Найди ошибку в тексте'),h('div',{class:'pairs-grid'},GX.TEXTS.map(t=>h('button',{class:'paircard',onclick:()=>startText(t)},h('b',{},t.t),h('small',{class:'muted'},(t.x.match(/\{/g)||[]).length+' ошибки')))),
    h('h2',{},'🧭 Карта путаницы'),accs.length?h('div',{class:'report'},accs):null,conf,
    h('h2',{},'⏱️ Свободная тренировка'),h('button',{class:'main-btn ghost',onclick:showTrainer},'Открыть «Машину времени»')));}
// ======================================================= Слова v4: Anki + контекст + чтение + Quizlet + картинки
const DAY=864e5,IV=[0,1,3,7,16,35,80,180];
const now=()=>Date.now();
const CTX=window.CTX||{s:[],i:{},h:{}};const WS2=window.WS2||{};
const idOf=k=>/^\d+$/.test(String(k))?+k:k;
// --- поиск по словарю
const EN2ID={};Object.entries(SD.D).forEach(([id,d])=>{const k=d[0].toLowerCase().trim();const cur=EN2ID[k];if(cur==null||(SD.D[cur][10]&&!d[10]))EN2ID[k]=+id;});
const IRRB={};IRR.forEach(v=>{v.p.split(' / ').forEach(f=>{IRRB[f]=IRRB[f]||v.b;});IRRB[v.pp]=IRRB[v.pp]||v.b;});TS.V.forEach(v=>{[v.p,v.pp,v.s,v.ing].forEach(f=>{IRRB[f]=IRRB[f]||v.b;});});
function lemmas(w){w=w.toLowerCase().replace(/’/g,"'").replace(/^'+|'+$/g,'');const out=[];const add=x=>{if(x&&x.length>0&&!out.includes(x))out.push(x);};add(w);
  w=w.replace(/'s$/,'');add(w);if(IRRB[w])add(IRRB[w]);
  if(w.endsWith('ies'))add(w.slice(0,-3)+'y');if(w.endsWith('es'))add(w.slice(0,-2));if(w.endsWith('s')&&!w.endsWith('ss'))add(w.slice(0,-1));
  if(w.endsWith('ied'))add(w.slice(0,-3)+'y');if(w.endsWith('ed')){add(w.slice(0,-2));add(w.slice(0,-1));if(/(.)\1ed$/.test(w))add(w.slice(0,-3));}
  if(w.endsWith('ing')&&w.length>4){const b=w.slice(0,-3);add(b);add(b+'e');if(/(.)\1$/.test(b))add(b.slice(0,-1));}
  if(w.endsWith('er'))add(w.slice(0,-2));if(w.endsWith('est'))add(w.slice(0,-3));if(w.endsWith('ly'))add(w.slice(0,-2));return out;}
function lookup(w){const ls=lemmas(w);for(const l of ls){const edited=Object.keys(S.wordEdits||{}).find(id=>D(idOf(id))?.en.toLowerCase()===l);if(edited)return {id:idOf(edited),lemma:l};}for(const l of ls){const u=Object.keys(S.cards).find(k=>S.cards[k].en.toLowerCase()===l);if(u)return {id:u,lemma:l};}
  for(const l of ls){if(EN2ID[l]!=null)return {id:EN2ID[l],lemma:l};if(EN2ID['to '+l]!=null)return {id:EN2ID['to '+l],lemma:l};}
  for(const l of ls)if(CTX.h[l])return {h:CTX.h[l],lemma:l};return {lemma:ls[ls.length>1&&IRRB[ls[0]]?2:0]||ls[0]};}
function wordForms(b){const f=new Set([b,b+'s',b+'es',b+'ed',b+'d',b+'ing',b.replace(/e$/,'')+'ing',b.replace(/y$/,'ies'),b.replace(/y$/,'ied')]);
  IRR.filter(v=>v.b===b).forEach(v=>{v.p.split(' / ').forEach(x=>f.add(x));f.add(v.pp);});return [...f];}
function ctxFor(en,max){max=max||4;const words=en.toLowerCase().replace(/^(to|a|an|the) /,'').replace(/[^a-z' ]/g,' ').trim().split(/\s+/).filter(Boolean);if(!words.length)return [];let ids;
  if(words.length===1){const set=new Set();wordForms(words[0]).forEach(f=>(CTX.i[f]||[]).forEach(i=>set.add(i)));ids=[...set];}
  else{const ph=words.join(' ');ids=[];for(let i=0;i<CTX.s.length&&ids.length<max*4;i++)if(CTX.s[i][0].toLowerCase().includes(ph))ids.push(i);}
  return ids.sort((a,b)=>CTX.s[a][0].length-CTX.s[b][0].length).slice(0,max).map(i=>CTX.s[i]);}
function hlWord(sent,en){const words=en.toLowerCase().replace(/^(to|a|an|the) /,'').split(/\s+/);const forms=words.length===1?wordForms(words[0]):[words.join(' ')];
  const re=new RegExp('\\b('+forms.map(f=>f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length).join('|')+')\\b','gi');return esc(sent).replace(re,'<b class="hl">$1</b>');}
function ctxEl(w,max){const norm=s=>String(s||'').replace(/\[[^\]]*\]/g,m=>m.slice(1,-1)).toLowerCase().replace(/[^a-z0-9]/g,'');const cs=ctxFor(w.en,max).filter(c=>norm(c[0])!==norm(w.exen));const mine=S.ctx[w.id];if(!cs.length&&!mine)return null;return h('details',{class:'ctx-box extra-context'},h('summary',{},'Другие примеры'),mine?h('div',{class:'ctx-s'},h('span',{html:hlWord(mine,w.en)}),h('small',{class:'muted'},' · из вашего текста')):null,cs.map(c=>exampleBlock(c[0],c[1],w.en)));}
// --- планировщик (как в Anki: Снова / Трудно / Хорошо / Легко)
const ivlBox=i=>!i?0:i<2?1:i<5?2:i<10?3:i<21?4:i<45?5:i<90?6:7;
function srsGet(id){const e=S.srs[id];if(e&&e.ivl==null){e.ivl=e.b<=0?0:IV[Math.min(e.b,7)];e.ef=2.5;e.reps=e.b||0;e.lapses=e.n||0;}return e;}
function preview(e,g){return scheduleOutcome(e,g).days;}
const fmtIvl=d=>d<1/1440?Math.max(1,Math.round(d*86400))+' с':d<1/24?Math.max(1,Math.round(d*1440))+' мин':d<1?Math.round(d*24)+' ч':d<31?Math.round(d)+' дн':d<365?Math.round(d/30)+' мес':(d/365).toFixed(1)+' г';
function srsAnswer(id,g){const w=D(id);if(w){const existing=Object.keys(S.srs).find(k=>{const x=D(idOf(k));return x&&sameWord(x,w);});if(existing)id=idOf(existing);}if(g===true)g=3;if(g===false)g=1;let e=srsGet(id);const isNew=!e||!(e.reps>0);if(!e)e=S.srs[id]={ivl:0,ef:2.5,reps:0,lapses:0,a:now()};
  const wasReview=e.ivl>=1&&(!e.stage||e.stage==='review');const oldInterval=e.ivl;const outcome=scheduleOutcome(e,g);const d=outcome.days;
  if(g===1){if(wasReview)e.lapses++;e.ef=Math.max(1.3,(e.ef||2.5)-.2);e.ivl=0;}else if(g===2){e.ef=Math.max(1.3,(e.ef||2.5)-.15);e.ivl=d>=1?d:0;}else if(g===4){e.ef=(e.ef||2.5)+.15;e.ivl=d;}else e.ivl=d;
  if(wasReview&&g===1)e.oldInterval=oldInterval;e.ivl=outcome.ivl;e.stage=outcome.stage;e.stepIndex=outcome.stepIndex;if(e.stage==='review')delete e.oldInterval;
  e.due=now()+(e.ivl>=1?e.ivl*DAY:d*DAY);e.reps=(e.reps||0)+1;e.last=now();e.b=ivlBox(e.ivl);
  const t=today();S.hist[t]=(S.hist[t]||0)+1;S.rv=S.rv||{n:0,ok:0};if(wasReview){S.rv.n++;if(g>1)S.rv.ok++;if(S.reviewDay?.d!==t)S.reviewDay={d:t,n:0,ids:[]};if(!S.reviewDay.ids.includes(String(id))){S.reviewDay.ids.push(String(id));S.reviewDay.n++;}}S.reviewLog.push({id,t:now(),grade:g,interval:e.ivl,due:e.due,stage:e.stage});if(S.reviewLog.length>2000)S.reviewLog.splice(0,S.reviewLog.length-2000);
  if(isNew){if(S.newDay.d!==t)S.newDay={d:t,n:0};S.newDay.n++;}save();}
function srsAdd(id,learned=false){const w=D(id);if(w&&Object.keys(S.srs).some(k=>{const x=D(idOf(k));return x&&sameWord(x,w);}))return false;if(S.srs[id])return false;
 S.srs[id]=learned===true?{ivl:1,ef:2.5,reps:1,lapses:0,due:now()+DAY,b:1,a:now()}:{ivl:0,ef:2.5,reps:0,lapses:0,due:now(),b:0,a:now(),introduced:true};return true;}
const dueIds=()=>Object.keys(S.srs).filter(id=>{const e=srsGet(id);return e.due<=now()&&D(idOf(id))&&isAvailable(id);}).sort((a,b)=>S.srs[a].due-S.srs[b].due).map(idOf);
const learned=()=>Object.values(S.srs).filter(e=>(e.ivl||0)>=21).length;
const newLeftToday=()=>Math.max(0,S.set.newDayMax-(S.newDay.d===today()?S.newDay.n:0));
// --- наборы: Wordly, мои колоды, слова уроков
function setList(){const out=[];S.decks.forEach(d=>out.push({key:'d:'+d.id,title:d.name,desc:'Моя колода',img:'',ids:()=>[...new Set([...(d.ids||[]),...Object.keys(S.cards).filter(k=>S.cards[k].deck===d.id)])],deck:d}));
  SD.WT.forEach(t=>out.push({key:'t:'+t.id,title:t.t,desc:t.d,img:t.img,ids:()=>t.w,cat:t.s}));(SD.libraries||[]).forEach(b=>out.push({...b,library:true,ids:()=>b.ids}));return out;}
const setBy=key=>{if(key==='mine')return {key,title:'Мои слова',ids:()=>Object.keys(S.srs).map(idOf)};const m=key.match(/^l:(\d+)$/);if(m){const L=SD.L[m[1]];return {key,title:L.t,ids:()=>L.w};}return setList().find(s=>s.key===key);};
function newFromSets(){const out=[];S.sets.forEach(k=>{const st=setBy(typeof k==='number'?'t:'+k:k);if(st)st.ids().forEach(id=>{if(!S.srs[id]&&!out.includes(id)&&D(id)&&isAvailable(id))out.push(id);});});return out;}
// --- шаги
function wordStep(id){const w=D(id);const e=srsGet(id)||{b:0,ivl:0};const mode=S.set.revMode;
  if(mode==='cards'||(mode==='mix'&&e.ivl>=1&&Math.random()<.5))return {type:'flip',w,srs:id,sound:w.sound};
  const b=ivlBox(e.ivl);
  if(b<=1)return {type:'wchoice',w,dir:'en',srs:id,sound:w.sound};
  if(b===2)return {type:'wchoice',w,dir:'ru',srs:id};
  if(b===3)return {type:'wchoice',w,dir:'ru',srs:id,sound:w.sound};
  return {type:'wtype',w,srs:id,sound:w.sound};}
R.flip=(st,ctx)=>{const w=st.w;const dir=st.dir||(S.set.flipDir==='both'?(Math.random()<.5?'en':'ru'):S.set.flipDir||'en');const e=srsGet(st.srs);
  const front=h('div',{class:'fc-front'},dir==='en'?[h('div',{class:'w-en'},w.en,spk(w.sound)),w.tr?h('div',{class:'w-tr'},'['+w.tr+']'):null]:[w.img?img(w.img,'w-img sm'):null,h('div',{class:'w-en ru'},w.ru),h('small',{class:'muted'},'Вспомните английское слово')]);
  if(dir==='en')setTimeout(()=>voice(w.sound),200);
  const back=h('div',{class:'fc-back hidden'});let shown=false;
  const grades=h('div',{class:'grades hidden'},[['Снова','r'],['Трудно','o'],['Хорошо','g'],['Легко','b']].map(([l,c],i)=>h('button',{class:'gbtn '+c,onclick:()=>grade(i+1)},h('b',{},l),h('small',{},fmtIvl(preview(e,i+1))),h('i',{},String(i+1)))));
  const show=h('button',{class:'main-btn blue wide',onclick:()=>reveal()},'Показать ответ');
  const reveal=()=>{if(shown)return;shown=true;show.remove();back.classList.remove('hidden');grades.classList.remove('hidden');back.append(wordDetail(w,{compact:true,hideEn:dir==='en',noTr:dir==='en'}));if(dir==='ru')voice(w.sound);};
  const grade=g=>{if(shown)ctx.done({ok:g>1,grade:g,skipFb:true});};
  ctx.keys=ev=>{if(ev.key===' '||ev.key==='Enter'){if(!shown)reveal();else grade(3);return true;}if(shown&&/^[1-4]$/.test(ev.key)){grade(+ev.key);return true;}};
  return {mode:'auto',el:h('div',{class:'flip'},h('div',{class:'fc',onclick:e=>{if(!shown&&!e.target.closest('button'))reveal();}},front,back),show,grades,h('small',{class:'muted center'},'Пробел — показать · 1–4 — оценка')) };};
R.wdict=(st,ctx)=>R.wtype(st,ctx);
R.match=(st,ctx)=>{const ws=st.ws;const tiles=shuffle([...ws.map(w=>({w,side:'en',t:w.en})),...ws.map(w=>({w,side:'ru',t:w.ru}))]);let sel=null,left=ws.length,pen=0;const t0=Date.now();
  const clock=h('div',{class:'match-clock hidden'},'');const iv=setInterval(()=>{if(!clock.isConnected){clearInterval(iv);return;}clock.textContent=((Date.now()-t0)/1000+pen).toFixed(1)+' с';},100);
  const grid=h('div',{class:'match-grid'},tiles.map(x=>{const b=h('button',{class:'mtile',onclick:()=>{if(b.classList.contains('gone'))return;
    if(!sel){sel={x,b};b.classList.add('sel');if(x.side==='en')sayWord(x.w.en);return;}
    if(sel.b===b){b.classList.remove('sel');sel=null;return;}
    if(sel.x.w===x.w&&sel.x.side!==x.side){[b,sel.b].forEach(e=>{e.classList.remove('sel');e.classList.add('gone');});sel=null;fx('tap');
      if(--left===0){clearInterval(iv);const tm=((Date.now()-t0)/1000+pen);const key='match:'+(st.setKey||'');const rec=S.rec[key];if(!rec||tm<rec)S.rec[key]=Math.round(tm*10)/10;save();
        ctx.done({ok:pen===0,noRetry:true,msg:'Время: '+tm.toFixed(1)+' с'+(rec?(tm<rec?' · 🏆 новый рекорд!':' · рекорд '+rec+' с'):'')+(pen?' (штраф +'+pen+' с)':'')});}}
    else{fx('wrong');const a=sel.b;[a,b].forEach(e=>e.classList.add('bad'));setTimeout(()=>[a,b].forEach(e=>e.classList.remove('bad','sel')),450);sel=null;}}},x.t);return b;}));
  return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},'Подбор: найдите пары'),clock,grid,h('small',{class:'muted'},'Найдите английское слово и его перевод')) };};
R.pimg=(st,ctx)=>R.wchoice({...st,dir:st.mode==='img'?'en':'ru'},ctx);
// --- запуск
function startReview(){const ids=orderedReviewIds().slice(0,S.set.revPer);if(!ids.length){toast('Сейчас нечего повторять 🎉');return;}
  startSession({title:'Повторение слов',doneTitle:'Слова повторены!',kind:'rev',again:startReview,back:()=>showWords('today')},ids.map(wordStep));}
function startLearn(ids,back){const lim=Math.min(S.set.newPer,newLeftToday());if(lim<=0){toast('Лимит новых слов на сегодня достигнут. Можно повторить уже добавленные.');return;}ids=(ids||newFromSets()).filter(id=>!S.srs[id]&&isAvailable(id));if(S.set.newOrder==='random')ids=shuffle(ids);ids=ids.slice(0,lim);if(!ids.length){toast('Нет новых слов: выберите набор во вкладке «Наборы»');return;}
  const steps=[];ids.forEach(id=>steps.push({type:'word',w:D(id)}));shuffle(ids).forEach(id=>steps.push({type:'wchoice',w:D(id),dir:'en',srs:id,sound:D(id).sound}));
  shuffle(ids).forEach(id=>steps.push({type:'wchoice',w:D(id),dir:'ru',sound:D(id).sound}));
  startSession({title:'Новые слова',doneTitle:'Новые слова добавлены в повторение!',kind:'learn',back:back||(()=>showWords('today'))},steps);}
function setWords(st){return st.ids().map(D).filter(Boolean);}
function startSetMode(st,mode){const ws=setWords(st);if(ws.length<2){toast('В наборе слишком мало слов');return;}const back=()=>showSet(st.key);const sh=shuffle(ws);let steps=[];
  if(mode==='match'){for(let r=0;r<Math.min(3,Math.ceil(ws.length/6));r++){const part=sh.slice(r*6,r*6+6);if(part.length>=3)steps.push({type:'match',ws:part,setKey:st.key});}}
  else if(mode==='test')steps=sh.slice(0,15).map((w,i)=>[{type:'wchoice',w,dir:'en',sound:w.sound},{type:'wchoice',w,dir:'ru',sound:w.sound},{type:'wchoice',w,dir:'ru'},{type:'wtype',w,sound:w.sound}][i%4]);
  else if(mode==='spell')steps=sh.slice(0,15).map(w=>({type:'wtype',w,sound:w.sound}));
  else if(mode==='dict')steps=sh.slice(0,15).map(w=>({type:'wdict',w,sound:w.sound}));
  startSession({title:st.title,back,again:()=>startSetMode(st,mode)},steps);}
function imgPool(){const mine=Object.keys(S.srs).map(idOf).map(D).filter(Boolean);return mine.length>=8?mine:ALLD;}
function startDrops(){const pool=imgPool();const mine=pool.filter(w=>S.srs[w.id]);const src=shuffle(mine.length>=6?mine:pool);const steps=[];
  for(let i=0;i<20;i++){const w=src[i%src.length];steps.push({type:'pimg',w,pool,mode:i%2?'img':'name',sound:w.sound});}
  startSession({title:'Практика слов',doneTitle:'Практика завершена!',back:()=>showWords('today'),again:startDrops},steps);}
// --- карточка слова
function wordDetail(w,o){o=o||{};const note=S.notes[w.id]||'';const box=h('div',{class:'wdetail'});if(!o.noImg){const art=wordArtwork(w);if(art)box.append(art);}
  if(!o.hideEn)box.append(h('div',{class:'w-en'},w.en,spk(w.sound)),w.tr?h('div',{class:'w-tr'},'['+w.tr+']'):null);
  else if(w.tr&&!o.noTr)box.append(h('div',{class:'w-tr'},'['+w.tr+']'));
  box.append(h('div',{class:'w-ru'+(w.ru.length>70?' long-meaning':'')},w.ru));
  if(w.f2||w.f3)box.append(h('div',{class:'w-forms'},'Формы: ',h('b',{},w.en),' – ',h('b',{},w.f2),' – ',h('b',{},w.f3)));
  if(w.exen||w.exru)box.append(exampleBlock(w.exen,w.exru,null,!!SD.wordMeta?.[w.id]?.exampleAuto&&!S.wordEdits?.[w.id]?.exru));box.append(audioMaterials(w));const defs=definitionBlock(w),imported=importedContext(w);if(defs)box.append(defs);if(imported)box.append(imported);
  const nEl=h('div',{class:'w-note'+(note?'':' empty')},note?'💭 '+note:'💭 Добавить ассоциацию…');
  nEl.onclick=e=>{e.stopPropagation();const ta=h('textarea',{class:'type-input',rows:2,placeholder:'Например: «cat» — «кот в КАТере»'});ta.value=note;
    const sv=h('button',{class:'main-btn small blue',onclick:ev=>{ev.stopPropagation();const v=ta.value.trim();if(v)S.notes[w.id]=v;else delete S.notes[w.id];save();const nb=wordDetail(w,o);box.replaceWith(nb);}},'Сохранить');
    const ed=h('div',{class:'note-edit',onclick:ev=>ev.stopPropagation()},ta,sv);nEl.replaceWith(ed);setTimeout(()=>ta.focus(),30);};
  box.append(nEl);const c=ctxEl(w,o.compact?2:5);if(c)box.append(c);return box;}
function showWord(id,back){nav('words');const w=D(id);if(!w)return;const e=srsGet(id);back=back||(()=>showWords('mine'));
  const info=e?h('div',{class:'stats left'},h('div',{class:'stat b'},h('small',{},'ИНТЕРВАЛ'),e.ivl?fmtIvl(e.ivl):'изучается'),h('div',{class:'stat y'},h('small',{},'СЛЕДУЮЩИЙ ПОВТОР'),e.due<=now()?'сейчас':new Date(e.due).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})),
    h('div',{class:'stat g'},h('small',{},'ПОВТОРЕНИЙ'),e.reps||0),h('div',{class:'stat p'},h('small',{},'ЗАБЫВАЛ'),e.lapses||0)):h('p',{class:'muted'},'Это слово ещё не в повторении.');
  setMain(h('div',{class:'page'},h('button',{class:'main-btn ghost small',onclick:back},'← Назад'),h('div',{class:'wcard big'},wordDetail(w,{})),info,
    h('div',{class:'row'},e?h('button',{class:'main-btn ghost small',onclick:()=>{delete S.srs[id];save();showWord(id,back);}},'Убрать из повторения'):h('button',{class:'main-btn green small',onclick:()=>{srsAdd(id,false);save();showWord(id,back);}},'+ В повторение'),
      e?h('button',{class:'main-btn ghost small',onclick:()=>{S.srs[id]={ivl:0,ef:2.5,reps:0,lapses:0,due:now(),b:0,a:now()};save();showWord(id,back);}},'Сбросить прогресс'):null,
      h('button',{class:'main-btn ghost small',onclick:()=>{S.srs[id]={ivl:60,ef:2.7,reps:1,lapses:0,due:now()+60*DAY,b:6,a:now()};save();showWord(id,back);}},'Я это знаю'),
      w.user?h('button',{class:'main-btn ghost small',onclick:()=>showCardForm(id,null,back)},'✏️ Изменить'):null,
      w.user?h('button',{class:'main-btn ghost small',onclick:()=>{if(confirm('Удалить карточку?')){delete S.cards[id];delete S.srs[id];save();back();}}},'Удалить'):null,
      h('a',{class:'main-btn ghost small',href:'https://translate.google.com/?sl=en&tl=ru&op=translate&text='+encodeURIComponent(w.en),target:'_blank'},'Онлайн-перевод ↗'),cardManagement(w,back))));}
// --- своя карточка
function showCardForm(id,deckId,back,pre){nav('words');const c=id?{...S.cards[id]}:{en:'',ru:'',tr:'',ex:'',exru:'',note:'',deck:deckId||(S.decks[0]&&S.decks[0].id)||'',...(pre||{})};back=back||(()=>showWords('mine'));
  const f=k=>{const i=h(k==='ex'||k==='exru'?'textarea':'input',{class:'type-input',rows:2});i.value=c[k]||'';i.oninput=()=>{c[k]=i.value;if(k==='en')suggest();};return i;};
  const fen=f('en'),fru=f('ru'),ftr=f('tr'),fex=f('ex'),fexru=f('exru');const fnote=h('textarea',{class:'type-input',rows:2});fnote.value=id?(S.notes[id]||''):(c.note||'');
  const sug=h('div',{class:'muted small'});const suggest=()=>{sug.innerHTML='';const l=lookup(c.en.trim());const dw=l.id!=null&&typeof l.id==='number'?D(l.id):null;if(dw||l.h){sug.append('В словаре: ',h('b',{},dw?dw.en:l.lemma),' — '+(dw?dw.ru:l.h)+' ',h('button',{class:'tg',onclick:()=>{if(dw){fru.value=c.ru=dw.ru;ftr.value=c.tr=dw.tr||'';}else fru.value=c.ru=l.h;}},'Подставить'));}};
  const deckSel=h('select',{class:'sel'},S.decks.map(d=>{const o=h('option',{value:d.id},d.name);if(d.id===c.deck)o.selected=true;return o;}),h('option',{value:'__new'},'+ Новая колода…'));
  deckSel.onchange=()=>{if(deckSel.value==='__new'){const n=prompt('Название колоды');if(n){const d={id:'k'+Date.now(),name:n};S.decks.push(d);save();deckSel.insertBefore(h('option',{value:d.id,selected:true},n),deckSel.lastChild);deckSel.value=d.id;}else deckSel.value=c.deck||'';}c.deck=deckSel.value;};
  if(!S.decks.length){const d={id:'k1',name:'Мои карточки'};S.decks.push(d);c.deck=d.id;deckSel.prepend(h('option',{value:d.id,selected:true},d.name));}
  const L=(l,el)=>h('label',{class:'frm'},h('span',{},l),el);suggest();
  setMain(h('div',{class:'page narrow'},h('button',{class:'main-btn ghost small',onclick:back},'← Назад'),h('h1',{},id?'Изменить карточку':'Новая карточка'),
    L('Слово или фраза (EN)',fen),sug,L('Перевод',fru),L('Транскрипция (необязательно)',ftr),L('Пример (EN)',fex),L('Перевод примера',fexru),L('Ассоциация / подсказка',fnote),L('Колода',deckSel),
    h('div',{class:'row'},h('button',{class:'main-btn blue',onclick:()=>{c.en=c.en.trim();c.ru=c.ru.trim();if(!c.en||!c.ru){toast('Заполните слово и перевод');return;}c.deck=deckSel.value;
      if(!id){const existing=Object.keys(S.cards).find(k=>sameWord(S.cards[k],c))||Object.keys(SD.D).find(k=>sameWord({en:SD.D[k][0],ru:SD.D[k][2]},c));if(existing){srsAdd(idOf(existing),false);save();toast('Это слово уже есть: карточка не дублируется');showWord(idOf(existing));return;}}const nid=id||'u'+Date.now().toString(36);const note=fnote.value.trim();delete c.note;S.cards[nid]=c;if(note)S.notes[nid]=note;else delete S.notes[nid];if(!id)srsAdd(nid,false);
      try{save();localStorage.getItem(KEY);}catch(e){toast('Не хватает места для прогресса: сделайте экспорт');}toast(id?'Сохранено':'Карточка добавлена в повторение');back();}},'Сохранить'))));}
// --- импорт / экспорт CSV (Anki, Quizlet)
function parseCSV(txt){txt=txt.replace(/^\uFEFF/,'');const lines=txt.split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#'));if(!lines.length)return [];
  const sep=lines[0].includes('\t')?'\t':(lines[0].split(';').length>lines[0].split(',').length?';':',');
  const rows=lines.map(l=>{if(sep!==',')return l.split(sep);const out=[];let cur='',q=false;for(const ch of l){if(ch==='"'){q=!q;continue;}if(ch===','&&!q){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out;})
    .map(r=>r.map(x=>x.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').trim()));
  const lat=s=>/[a-z]/i.test(s)&&!/[а-яё]/i.test(s);const enCol=rows.filter(r=>lat(r[0]||'')).length>=rows.filter(r=>lat(r[1]||'')).length?0:1;
  const cyr=x=>/[а-яё]/i.test(x||'');return rows.filter(r=>r[0]&&r[1]).map(r=>{const c=cyr(r[0])&&!cyr(r[1])?1:!cyr(r[0])&&cyr(r[1])?0:enCol;return {en:r[c],ru:r[1-c],tr:(r[2]||'').replace(/^\[|\]$/g,''),ex:r[3]||'',note:r[4]||''};});}
function importCSV(){const i=h('input',{type:'file',accept:'.csv,.txt,.tsv'});i.onchange=()=>{const file=i.files[0];const r=new FileReader();r.onload=()=>{const rows=parseCSV(r.result);if(!rows.length){toast('Не удалось прочитать файл');return;}
  const name=prompt('Название колоды',file.name.replace(/\.\w+$/,''))||file.name;const d={id:'k'+Date.now(),name};S.decks.push(d);
  rows.forEach((x,j)=>{const duplicate=Object.keys(S.cards).find(k=>sameWord(S.cards[k],x))||Object.keys(SD.D).find(k=>sameWord({en:SD.D[k][0],ru:SD.D[k][2]},x));if(duplicate){d.ids=d.ids||[];if(!d.ids.includes(idOf(duplicate)))d.ids.push(idOf(duplicate));return;}const l=lookup(x.en);const dw=typeof l.id==='number'?D(l.id):null;const id='u'+Date.now().toString(36)+j;S.cards[id]={en:x.en,ru:x.ru,tr:x.tr||(dw&&dw.en.toLowerCase()===x.en.toLowerCase()?dw.tr:''),ex:x.ex,exru:'',deck:d.id};if(x.note)S.notes[id]=x.note;});
  if(!S.sets.includes('d:'+d.id))S.sets.push('d:'+d.id);save();toast('Импортировано карточек: '+rows.length+'. Колода добавлена в изучаемые');showSet('d:'+d.id);};r.readAsText(file);};i.click();}
function exportCSV(){const rows=Object.keys(S.srs).map(idOf).map(D).filter(Boolean).map(w=>[w.en,w.ru,w.tr,w.exen,S.notes[w.id]||''].map(x=>String(x||'').replace(/\t|\n/g,' ')).join('\t'));
  const a=h('a',{href:URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')],{type:'text/tab-separated-values'})),download:'wordly-words.tsv'});a.click();}
// --- чтение (как LingQ)
const STOP=new Set("a an the and or but if so to of in on at by for with from up out as is am are was were be been being do does did have has had i you he she it we they me him her us them my your his its our their this that these those there here what who which when where why how not no yes can will would should could must may might shall all some any very too just than then".split(' '));
function wordStatus(w){const l=lookup(w);const e=l.id!=null?srsGet(l.id):null;if(e)return (e.ivl||0)>=21?'kn':'lrn';if(S.known[l.lemma]||S.known[w.toLowerCase()]||STOP.has(w.toLowerCase()))return 'kn';return 'new';}
function cleanSrt(t){return t.replace(/\r/g,'').split('\n').filter(l=>!/^\d+$/.test(l.trim())&&!/-->/.test(l)).map(l=>l.replace(/<[^>]+>/g,'').replace(/\{[^}]+\}/g,'')).join('\n').replace(/\n{3,}/g,'\n\n');}
// Reading library: authored texts + explicit offline lexicon; no network translation.
const READ_LIBRARY=window.WORDLY_READ.books,READ_LEX=window.WORDLY_READ.lex;
const readCanon=x=>String(x||'').normalize('NFC').replace(/’/g,"'").toLowerCase().replace(/\s+/g,' ').trim();
let readingCleanup=null,readingDialog=null;
function readingState(){S.reading=S.reading||{items:{},filter:'A1',font:20};S.reading.items=S.reading.items||{};return S.reading;}
function readingItem(id){const r=readingState();return r.items[id]||(r.items[id]={paragraph:0,offset:0,finished:false,quiz:{},added:[]});}
function readingBook(id){return READ_LIBRARY.find(b=>b.id===id)||S.texts.find(b=>b.id===id);}
function readingWords(text){return String(text).match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)||[];}
const READ_BASE_WORDS=new Map(ALLD.map(w=>[readCanon(w.en)+'\u0000'+readCanon(w.ru),w]));
function readingFind(en,ru){const key=readCanon(en)+'\u0000'+readCanon(ru);const own=Object.keys(S.cards).find(id=>readCanon(S.cards[id].en)+'\u0000'+readCanon(S.cards[id].ru)===key);return own?D(own):READ_BASE_WORDS.get(key);}
function readingEntry(book,token,phrase=false){const key=readCanon(token);if(phrase&&book.phrases?.[key])return {...book.phrases[key],surface:token,phrase:true};const prepared=book.gloss?.[key]||READ_LEX[key];if(prepared)return {...prepared,surface:token,prepared:true};const l=lookup(token),w=l.id!=null?D(l.id):null;return w?{en:w.en,ru:w.ru,tr:w.tr,surface:token,local:true}:{en:token,ru:'',surface:token};}
function readingParts(text){if(typeof Intl.Segmenter==='function'){const seg=new Intl.Segmenter('en',{granularity:'word'});return [...seg.segment(text)].map(x=>({text:x.segment,word:x.isWordLike&&/[A-Za-z]/.test(x.segment)}));}return text.split(/([A-Za-z]+(?:['’][A-Za-z]+)?)/g).map((t,i)=>({text:t,word:!!(i%2)}));}
function showReaderList(){const r=readingState(),page=h('div',{class:'reading-library'});let filter=r.filter||'A1';const results=h('div',{class:'reading-grid'}),search=h('input',{class:'type-input',type:'search',placeholder:'Название или тема…','aria-label':'Поиск текста'});const tabs=h('div',{class:'subtabs reading-levels'});
 const draw=()=>{tabs.innerHTML='';for(const [k,label] of [['A1','A1 · Начальный'],['A2','A2 · Базовый'],['B1','B1 · Средний'],['B2','B2 · Выше среднего'],['C1','C1 · Продвинутый'],['mine','Мои тексты']])tabs.append(h('button',{class:'tg'+(filter===k?' on':''),onclick:()=>{filter=k;r.filter=k;save();draw();}},label));results.innerHTML='';const q=readCanon(search.value);const items=(filter==='mine'?S.texts:READ_LIBRARY.filter(x=>x.level===filter)).filter(b=>readCanon([b.title,b.ru,b.genre,b.focus].join(' ')).includes(q));
 if(!items.length)results.append(h('p',{class:'muted'},filter==='mine'?'Здесь будут тексты, которые вы вставите или загрузите ниже.':'По этому запросу ничего не найдено.'));
 for(const b of items){const st=readingItem(b.id),count=b.wordCount||readingWords(b.text).length,paras=(b.paragraphs||b.text.split(/\n+/)).length;const status=st.finished?'Прочитано':st.paragraph>0?'Продолжить · абзац '+(Math.min(st.paragraph,paras-1)+1):'Начать чтение';const card=h('article',{class:'reading-card'},h('div',{class:'reading-meta'},b.level||'Свой текст',' · ',b.genre||'Импорт',' · ',count+' слов'),h('h3',{},b.title),b.ru?h('p',{class:'muted'},b.ru):null,b.focus?h('p',{class:'reading-focus'},b.focus):null,h('div',{class:'reading-card-actions'},h('button',{class:'main-btn blue',onclick:()=>showReader(b.id)},status)));
 if(filter==='mine')card.lastChild.append(h('button',{class:'tg',onclick:()=>{if(!confirm('Удалить этот текст? Добавленные слова останутся.'))return;S.texts=S.texts.filter(t=>t.id!==b.id);delete r.items[b.id];save();draw();}},'Удалить'));results.append(card);}}
 search.oninput=draw;page.append(h('p',{class:'muted'},'Читайте в своём темпе. Нажмите на слово или подчёркнутое выражение — перевод можно сохранить в карточку вместе с примером.'),tabs,search,h('p',{class:'reading-note'},'50 авторских текстов: по 10 для A1, A2, B1, B2 и C1. Уровни — ориентир сложности.'),results);
 const title=h('input',{class:'type-input',placeholder:'Название текста','aria-label':'Название своего текста'}),text=h('textarea',{class:'type-input',rows:7,placeholder:'Вставьте английский текст…','aria-label':'Английский текст'}),file=h('input',{type:'file',accept:'.txt,.srt,.vtt',class:'reading-file','aria-label':'Загрузить текстовый файл'}),msg=h('p',{class:'muted','aria-live':'polite'});
 file.onchange=async()=>{try{const f=file.files[0];if(!f)return;if(f.size>1e6)throw Error('Файл больше 1 МБ. Разделите его на части.');let v=await f.text();if(/\.(srt|vtt)$/i.test(f.name))v=cleanSrt(v);text.value=v;title.value=title.value||f.name.replace(/\.[^.]+$/,'');}catch(e){msg.textContent=e.message;}};
 const add=()=>{let v=text.value.trim();if(v.length<5){msg.textContent='Сначала вставьте текст.';return;}if(v.length>60000){msg.textContent='До 60 000 символов за текст. Разделите его на части.';return;}if(/-->/.test(v))v=cleanSrt(v);const x={id:'r'+Date.now().toString(36),title:title.value.trim()||'Мой текст',text:v,at:Date.now()};S.texts.unshift(x);save();showReader(x.id);};
 page.append(h('details',{class:'reading-import rule-item'},h('summary',{},'Добавить свой текст'),h('p',{class:'muted'},'Для своих текстов используется доступный офлайн-словарь. Неизвестный перевод можно вписать вручную. Автоматического онлайн-перевода нет.'),title,text,h('label',{},'Файл .txt / .srt / .vtt',file),h('button',{class:'main-btn blue',onclick:add},'Открыть свой текст'),msg));draw();return page;}
function closeReadingDialog(){if(!readingDialog)return;const d=readingDialog;readingDialog=null;d.cleanup?.();d.el.remove();d.backdrop.remove();for(const el of d.locked)el.removeAttribute('aria-hidden');d.opener?.focus({preventScroll:true});}
function readingSaveWord(book,entry,sentence,ru){const en=entry.en,existing=readingFind(en,ru);let id=existing?.id;if(id==null){id='uread'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);if(!S.decks.some(d=>d.id==='kread'))S.decks.push({id:'kread',name:'Из чтения'});S.cards[id]={en,ru,tr:entry.tr||'',ex:sentence,exru:'',deck:'kread',source:{book:book.id,title:book.title,surface:entry.surface}};}S.ctx[id]=sentence;const added=srsAdd(id,false);const st=readingItem(book.id);if(!st.added.includes(String(id)))st.added.push(String(id));save();markDay();return {id,added};}
function openReadingWord(book,token,sentence,opener,phrase=false){closeReadingDialog();const entry=readingEntry(book,token,phrase);const existing=entry.ru?readingFind(entry.en,entry.ru):null;const isIn=existing&&S.srs[existing.id];const backdrop=h('div',{class:'reading-backdrop',onclick:closeReadingDialog});const panel=h('section',{class:'reading-dialog',role:'dialog','aria-modal':'true','aria-labelledby':'reading-word-title',tabindex:'-1'});const message=h('p',{class:'reading-status','aria-live':'polite'});
 panel.append(h('div',{class:'reading-dialog-head'},h('span',{class:'reading-meta'},entry.phrase?'Выражение из текста':'Слово из текста'),h('button',{class:'icon-btn','aria-label':'Закрыть перевод',onclick:closeReadingDialog},'×')),h('h2',{id:'reading-word-title'},entry.en),readCanon(entry.en)!==readCanon(token)?h('p',{class:'muted'},'В тексте: '+token):null);
 const input=h('input',{class:'type-input',value:entry.ru,'aria-label':'Перевод для карточки',placeholder:'Введите перевод'});panel.append(entry.ru?h('p',{class:'reading-translation'},entry.ru):h('p',{class:'muted'},'Этого значения нет в офлайн-словаре. Впишите перевод для карточки.'),h('div',{class:'reading-context'},h('small',{class:'muted'},'ПРИМЕР ИЗ ТЕКСТА'),h('p',{},sentence)));
 if(entry.phrase){const parts=[...new Set(readingWords(token).map(readCanon))];panel.append(h('details',{class:'reading-details'},h('summary',{},'Отдельные слова выражения'),h('div',{class:'row'},parts.map(w=>h('button',{class:'tg',onclick:()=>openReadingWord(book,w,sentence,opener)},w)))));}
 if(!entry.proper){panel.append(h('details',{class:'reading-details',open:!entry.ru},h('summary',{},'Уточнить перевод для карточки'),input));const add=h('button',{class:'main-btn blue wide',disabled:!!isIn,onclick:()=>{const ru=input.value.trim();if(!ru){message.textContent='Сначала введите перевод.';input.focus();return;}const res=readingSaveWord(book,entry,sentence,ru);message.textContent=res.added?'Добавлено в набор «Из чтения» и повторение.':'Карточка уже есть в повторении. Пример сохранён.';add.textContent='✓ В повторении';add.disabled=true;opener?.classList.add('reading-added');}} ,isIn?'✓ Уже в повторении':'+ Добавить в словарь и повторение');input.oninput=()=>{const known=readingFind(entry.en,input.value.trim());add.disabled=!!(known&&S.srs[known.id]);add.textContent=add.disabled?'✓ Уже в повторении':'+ Добавить в словарь и повторение';message.textContent='';};panel.append(add,message);}else panel.append(h('p',{class:'muted'},'Имя персонажа: карточка для него не создаётся.'));
 panel.append(h('button',{class:'tg',onclick:closeReadingDialog},'Продолжить чтение'));const header=panel.firstElementChild,content=h('div',{class:'reading-dialog-body'}),actions=h('div',{class:'reading-dialog-actions'});for(const child of [...panel.children].slice(1)){if(child.matches('button.main-btn,button.tg,.reading-status'))actions.append(child);else content.append(child);}panel.append(content,actions);
 const locked=[main(),$('#nav'),document.querySelector('header')].filter(Boolean);document.body.append(backdrop,panel);readingDialog={el:panel,backdrop,locked,opener};panel.focus({preventScroll:true});for(const el of locked)el.setAttribute('aria-hidden','true');}

function readerSentence(book,text){const out=h('span',{class:'reading-sentence'});const phrases=Object.keys(book.phrases||{}).sort((a,b)=>b.length-a.length);const pattern=phrases.length?new RegExp('\\b('+phrases.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','gi'):null;const renderPlain=t=>{for(const part of readingParts(t)){if(!part.word){let rest=part.text;const last=out.lastChild,closing=rest.match(/^[.,!?;:)"”’]+/);if(closing&&last?.nodeType===1&&last.classList.contains('reading-word')){last.append(closing[0]);rest=rest.slice(closing[0].length);}if(rest)out.append(rest);continue;}const entry=readingEntry(book,part.text),found=entry.ru?readingFind(entry.en,entry.ru):null;const el=h('button',{class:'reading-word'+(found&&S.srs[found.id]?' reading-added':''),'aria-label':'Перевод: '+part.text,onclick:()=>openReadingWord(book,part.text,text.trim(),el)},part.text);out.append(el);}};
 if(!pattern){renderPlain(text);return out;}let offset=0;for(const m of text.matchAll(pattern)){renderPlain(text.slice(offset,m.index));const el=h('button',{class:'reading-word reading-expression','aria-label':'Перевод выражения: '+m[0],onclick:()=>openReadingWord(book,m[0],text.trim(),el,true)},m[0]);out.append(el);offset=m.index+m[0].length;}renderPlain(text.slice(offset));return out;}
function readingQuiz(book){if(!book.questions?.length)return null;const st=readingItem(book.id);st.quiz=st.quiz||{};const section=h('details',{class:'reading-quiz rule-item'},h('summary',{},'Проверить понимание · 3 вопроса (необязательно)'),h('p',{class:'muted'},'Без таймера и штрафов. К ответам можно вернуться после чтения.'));
 book.questions.forEach((q,i)=>{const feedback=h('p',{class:'reading-quiz-feedback','aria-live':'polite'}),choices=h('div',{class:'reading-quiz-options'});const update=()=>{const answer=st.quiz[i];for(const [j,b] of [...choices.children].entries()){b.classList.toggle('chosen',answer===j);b.setAttribute('aria-pressed',String(answer===j));}feedback.textContent=answer==null?'':(answer===q.answer?'Верно. ':'Пока неверно. ')+q.why;feedback.className='reading-quiz-feedback '+(answer==null?'':answer===q.answer?'tc-v':'tc-n');};q.options.forEach((o,j)=>choices.append(h('button',{class:'tg',onclick:()=>{st.quiz[i]=j;save();update();}},o)));section.append(h('fieldset',{class:'reading-question'},h('legend',{},(i+1)+'. '+q.q),choices,feedback));update();});return section;}
function showReader(id){const book=readingBook(id);if(!book)return showWords('read');nav('words');const r=readingState(),st=readingItem(id),paras=book.paragraphs||book.text.split(/\n+/).filter(Boolean);const page=h('article',{class:'reading-page',style:'--reading-top-pad:'+getComputedStyle(main()).paddingTop}),body=h('div',{class:'reader reader-v4',style:'--reading-font:'+(r.font||20)+'px'});page.append(h('div',{class:'reading-topbar'},h('button',{class:'tg',onclick:()=>showWords('read')},'← Библиотека чтения')),h('div',{class:'reading-meta'},book.level||'Мой текст',' · ',book.genre||'Импорт',' · ',(book.wordCount||readingWords(book.text).length)+' слов'),h('h1',{},book.title),book.ru?h('p',{class:'muted'},book.ru):null,book.focus?h('p',{class:'reading-focus'},book.focus):null);
 const font=h('select',{class:'sel','aria-label':'Размер текста',onchange:e=>{r.font=+e.target.value;body.style.setProperty('--reading-font',r.font+'px');save();}},[18,20,22,24].map(n=>{const o=h('option',{value:n},n+' px');o.selected=(r.font||20)===n;return o;}));const progress=h('span',{class:'reading-location','aria-live':'polite'});page.append(h('div',{class:'reading-toolbar'},h('label',{},'Текст ',font),h('button',{class:'tg',onclick:()=>{main().scrollTop=0;st.paragraph=0;st.offset=0;save();}},'К началу'),progress));
 paras.forEach((par,i)=>{const p=h('p',{'data-paragraph':i});for(const sent of par.match(/[^.!?]+[.!?]*["”’)]*\s*/g)||[par])p.append(readerSentence(book,sent));body.append(p);});page.append(h('p',{class:'reading-note'},'Слово → перевод → карточка. Подчёркнутые выражения переводятся целиком.'),body,readingQuiz(book));const finish=h('button',{class:'main-btn blue wide',onclick:()=>{st.finished=true;save();markDay();finish.textContent='✓ Текст прочитан';toast('Текст отмечен как прочитанный.');}},st.finished?'✓ Текст прочитан':'Отметить как прочитанный');page.append(h('div',{class:'reading-end'},finish,h('p',{class:'muted'},'Слова из текста находятся в «Слова → Мои слова» и в наборе «Из чтения».'),h('button',{class:'tg',onclick:()=>{S.wtab='today';showWords('today');}},'Открыть повторение слов')));setMain(page);
 let timer=null,live=true;const flush=()=>{if(!live)return;const mainRect=main().getBoundingClientRect();let index=0;const ps=[...body.querySelectorAll(':scope > p')];for(let i=0;i<ps.length;i++){if(ps[i].getBoundingClientRect().top<mainRect.top+Math.max(60,page.querySelector('.reading-topbar').getBoundingClientRect().height+parseFloat(getComputedStyle(main()).paddingTop)+8))index=i;else break;}const p=ps[index];st.paragraph=index;st.offset=Math.max(0,mainRect.top+Math.max(60,page.querySelector('.reading-topbar').getBoundingClientRect().height+parseFloat(getComputedStyle(main()).paddingTop)+8)-p.getBoundingClientRect().top)/Math.max(1,p.getBoundingClientRect().height);progress.textContent='Абзац '+(index+1)+' / '+ps.length;};
 const onscroll=()=>{flush();clearTimeout(timer);timer=setTimeout(save,450);};main().addEventListener('scroll',onscroll,{passive:true});readingCleanup=()=>{flush();clearTimeout(timer);save();live=false;main().removeEventListener('scroll',onscroll);closeReadingDialog();};
 const savedIndex=Math.min(st.paragraph||0,paras.length-1),savedOffset=Math.max(0,Math.min(.98,st.offset||0));requestAnimationFrame(()=>{if(!live)return;const p=body.querySelector('[data-paragraph="'+savedIndex+'"]');if(savedIndex||savedOffset){main().scrollTop+=p.getBoundingClientRect().top-main().getBoundingClientRect().top-Math.max(60,page.querySelector('.reading-topbar').getBoundingClientRect().height+parseFloat(getComputedStyle(main()).paddingTop)+8)+savedOffset*p.getBoundingClientRect().height;}flush();});}

// --- страница «Слова»
const WTABS=[['today','Сегодня'],['sets','Наборы'],['mine','Мои слова'],['dict','Словарь'],['read','Чтение'],['expressions','Выражения'],['stats','Статистика']];
function goalEl(){const sec=S.time[today()]||0;const pc=Math.min(100,Math.round(sec/60/S.set.goalMin*100));
  return h('div',{class:'goal'},h('div',{class:'ring',style:'--p:'+pc},h('span',{},Math.floor(sec/60)+'/'+S.set.goalMin)),h('div',{},h('b',{},pc>=100?'Цель на сегодня выполнена 🎉':'Цель: '+S.set.goalMin+' минут в день'),h('small',{class:'muted'},'Засчитывается время в уроках и тренировках · серия '+streakDays()+' дн.')));}
function forecast(days){const out=Array(days).fill(0);const t0=new Date();t0.setHours(23,59,59,999);Object.values(S.srs).forEach(e=>{const d=Math.max(0,Math.ceil((e.due-t0.getTime())/DAY));if(d<days)out[d]++;});return out;}
function bars(vals,labels){const mx=Math.max(1,...vals);return h('div',{class:'bars'},vals.map((v,i)=>h('div',{class:'bar',title:labels[i]+': '+v},h('i',{style:'height:'+Math.round(v/mx*100)+'%'}),h('small',{},v||''),h('em',{},labels[i]))));}
function showWords(tab){nav('words');tab=tab||S.wtab||'today';S.wtab=tab;const page=h('div',{class:'page'});
  page.append(h('h1',{},'Слова'),h('div',{class:'subtabs'},WTABS.map(([k,l])=>h('button',{class:'tg'+(k===tab?' on':''),onclick:()=>showWords(k)},l))));
  const due=dueIds();
  if(tab==='today')page.append(swipeHub());
  else if(tab==='classic'){page.append(h('button',{class:'tg',onclick:()=>showWords('today')},'← Карточки со свайпами'));const nw=newFromSets();const left=newLeftToday();const learning=Object.values(S.srs).filter(e=>!(e.ivl>=1)).length;
    const sel=(k,opts)=>h('select',{class:'sel',onchange:e=>{S.set[k]=e.target.value;save();}},opts.map(([v,l])=>{const o=h('option',{value:v},l);if(S.set[k]===v)o.selected=true;return o;}));
    if(!Object.keys(S.srs).length&&!nw.length){
 const first=NODES.find(n=>n.k==='L'&&n.lv.id===S.level)||NODES.find(n=>n.k==='L');
 page.append(h('div',{class:'daily-card word-start'},h('small',{},'ПЕРВЫЕ СЛОВА'),h('h2',{},'Начнём с шести слов?'),h('p',{},'Возьмите слова первого урока или выберите тему, которая нужна вам сейчас.'),h('button',{class:'main-btn blue wide',onclick:()=>startLearn(first.d.w.slice(0,6))},'Начать учить слова'),h('button',{class:'tg wide secondary-action',onclick:()=>showWords('sets')},'Выбрать тему')),h('p',{class:'muted'},'Сначала познакомимся со словами, затем проверим, что удалось вспомнить. Повторения появятся после добавления карточек.'),h('button',{class:'tg',onclick:startListening},'Аудирование · записи слов'));
 }else page.append(goalEl(),
      h('div',{class:'stats left'},h('div',{class:'stat y'},h('small',{},'К ПОВТОРЕНИЮ'),due.length),h('div',{class:'stat o'},h('small',{},'ИЗУЧАЮТСЯ'),learning),h('div',{class:'stat b'},h('small',{},'ВСЕГО'),Object.keys(S.srs).length),h('div',{class:'stat g'},h('small',{},'ЗАКРЕПЛЯЮТСЯ (21+ дн)'),learned())),
      h('div',{class:'row'},h('button',{class:'main-btn blue',disabled:!orderedReviewIds().length,onclick:startReview},'▶ Повторить ('+Math.min(orderedReviewIds().length,S.set.revPer)+')'),
        h('button',{class:'main-btn green',disabled:!nw.length||!left,onclick:()=>startLearn()},'✚ Новые слова ('+Math.min(nw.length,S.set.newPer,left)+')'),
        h('button',{class:'main-btn ghost',onclick:startDrops},'Текстовая практика')),
      h('p',{class:'muted small'},'Впервые проверено сегодня: '+(S.set.newDayMax-left)+' из '+S.set.newDayMax+' · новые слова берутся из отмеченных наборов ('+S.sets.length+').'),
      h('div',{class:'row'},h('label',{class:'chk'},'Повторение: ',sel('revMode',[['mix','Смешанное'],['cards','Карточки (самооценка)'],['tasks','Только задания']])),
        h('label',{class:'chk'},'Карточки: ',sel('flipDir',[['en','EN → RU'],['ru','RU → EN'],['both','Обе стороны'],['write','Ввод ответа']]))),
      h('button',{class:'tg',onclick:startListening},'Аудирование · записи слов'),h('h3',{},'Прогноз повторений на неделю'),bars(forecast(7),['сег','+1','+2','+3','+4','+5','+6']),
      h('p',{class:'muted small'},'Повторений закрепления сегодня: '+(S.reviewDay?.d===today()?S.reviewDay.n:0)+' из '+S.set.reviewDayMax+'. Короткие шаги обучения доступны независимо от этого лимита.'),h('button',{class:'tg',onclick:showSettings},'Настроить повторения'),h('p',{class:'muted small'},'Карточки работают с самооценкой: после ответа оцените себя — «Снова», «Трудно», «Хорошо» или «Легко». Интервал растёт отдельно для каждого слова: трудные слова возвращаются чаще, лёгкие — реже.'));}
  else if(tab==='sets'){page.append(h('details',{class:'swipe-tools'},h('summary',{},'Свои наборы и импорт'),h('div',{class:'row'},h('button',{class:'main-btn ghost small',onclick:()=>{const n=prompt('Название колоды');if(n){S.decks.push({id:'k'+Date.now(),name:n});save();showWords('sets');}}},'+ Новая колода'),
      h('button',{class:'main-btn ghost small',onclick:importCSV},'Импорт CSV (Anki / Quizlet)'),h('button',{class:'main-btn ghost small',onclick:()=>showCardForm()},'+ Новая карточка'))));
    const setSearch=h('input',{class:'search',type:'search',placeholder:'Тема или слово: тело, shoulder…','aria-label':'Поиск по наборам и словам'});page.append(h('p',{class:'muted'},SD.WT.length+' тематических наборов и '+(SD.libraries||[]).filter(x=>x.key.startsWith('b:')).length+' коллекций из Anki. Выражения — в отдельной вкладке.'),setSearch);const setNodes=[],groupNodes=[];const noSets=h('p',{class:'muted',hidden:true},'Не найдено. Попробуйте другую тему или слово.');const card=st=>{const ids=st.ids();const on=S.sets.includes(st.key)||(st.key.startsWith('t:')&&S.sets.includes(+st.key.slice(2)));const known=ids.filter(id=>S.srs[id]).length;
      const node=h('div',{class:'set'+(on?' on':''),role:'group','aria-label':'Набор '+st.title,onclick:()=>openSwipeSet(st.key)},st.img?img(st.img,'set-img'):h('div',{class:'set-img noimg'},'🗂'),h('div',{class:'set-b'},h('b',{},st.title),h('small',{class:'muted'},ids.length+' слов · в повторении '+known),
        h('div',{class:'row'},h('button',{class:'tg'+(on?' on':''),onclick:e=>{e.stopPropagation();openSwipeSet(st.key);}},on?'Продолжить':'+ Учить'),h('button',{class:'tg',onclick:e=>{e.stopPropagation();showSet(st.key);}},'Обзор'))));setNodes.push({node,text:(st.title+' '+st.desc+' '+ids.map(id=>{const w=D(id);return w?w.en+' '+w.ru:'';}).join(' ')).toLowerCase()});return node;};
    if(S.decks.length){const heading=h('h3',{},'Мои колоды'),grid=h('div',{class:'sets'},setList().filter(s=>s.deck).map(card));page.append(heading,grid);groupNodes.push({heading,grid});}
    SD.WS.forEach(ws=>{const ts=setList().filter(s=>s.cat===ws.id);if(ts.length){const heading=h('h3',{},ws.t),grid=h('div',{class:'sets'},ts.map(card));page.append(heading,grid);groupNodes.push({heading,grid});}});const libraries=setList().filter(s=>s.library&&!s.key.startsWith('e:'));if(libraries.length){const heading=h('h3',{},'Коллекции из Anki'),grid=h('div',{class:'sets'},libraries.map(card));page.append(heading,grid);groupNodes.push({heading,grid});}page.append(noSets);setSearch.oninput=()=>{const q=setSearch.value.trim().toLowerCase();setNodes.forEach(x=>x.node.hidden=!!q&&!x.text.includes(q));groupNodes.forEach(g=>{const empty=Array.from(g.grid.children).every(n=>n.hidden);g.heading.hidden=empty;g.grid.hidden=empty;});noSets.hidden=setNodes.some(x=>!x.node.hidden);};}
  else if(tab==='mine'){const search=h('input',{class:'search',placeholder:'Поиск по моим словам…'});const flt=h('select',{class:'sel'},[['all','Все'],['due','К повторению'],['lrn','Изучаются'],['mat','Длинный интервал'],['paused','Приостановленные'],['buried','Отложенные']].map(([v,l])=>h('option',{value:v},l)));const list=h('div',{class:'wlist'});
    const draw=()=>{const q=search.value.trim().toLowerCase();list.innerHTML='';const f=flt.value;
      const items=Object.keys(S.srs).map(id=>({w:D(idOf(id)),e:srsGet(id)})).filter(x=>x.w&&(!q||x.w.en.toLowerCase().includes(q)||x.w.ru.toLowerCase().includes(q))&&(f==='all'||(f==='due'&&x.e.due<=now())||(f==='lrn'&&!(x.e.ivl>=21))||(f==='mat'&&x.e.ivl>=21)||(f==='paused'&&S.cardFlags[x.w.id]?.suspended)||(f==='buried'&&S.cardFlags[x.w.id]?.buriedUntil>today()))).sort((a,b)=>a.e.due-b.e.due);
      items.slice(0,400).forEach(({w,e})=>list.append(h('div',{class:'wrow',onclick:()=>showWord(w.id)},spk(w.sound),h('b',{},w.en),h('span',{class:'muted wtr'},w.tr?'['+w.tr+']':''),h('span',{},w.ru),boxBar(ivlBox(e.ivl)),
        h('small',{class:'muted wdue'},e.due<=now()?'сейчас':fmtIvl((e.due-now())/DAY)),h('span',{},S.notes[w.id]?'💭':''))));
      if(!items.length)list.append(h('p',{class:'muted'},'Пусто. Пройдите урок, выберите набор или добавьте свою карточку.'));else if(items.length>400)list.append(h('p',{class:'muted small'},'Показаны первые 400 — уточните поиск.'));};
    search.oninput=draw;flt.onchange=draw;draw();
    page.append(h('div',{class:'row'},search,flt),h('div',{class:'row'},h('button',{class:'main-btn ghost small',onclick:()=>showCardForm()},'+ Своя карточка'),h('button',{class:'main-btn ghost small',onclick:exportCSV},'⇩ Экспорт (TSV для Anki / Quizlet)'),h('button',{class:'main-btn ghost small',onclick:()=>startSetMode(setBy('mine'),'match')},'Подбор пар'),h('button',{class:'main-btn ghost small',onclick:()=>showSet('mine')},'Все режимы')),list);}
  else if(tab==='dict'){const search=h('input',{class:'search',placeholder:'Поиск по словарю Wordly: английский или русский…'});const list=h('div',{class:'wlist'});
    const all=Object.keys(SD.D);const draw=()=>{const q=search.value.trim().toLowerCase();list.innerHTML='';if(q.length<2){list.append(h('p',{class:'muted'},'Введите хотя бы 2 буквы.'));return;}
      const res=[];for(const id of all){const d=SD.D[id];const en=d[0].toLowerCase(),ru=d[2].toLowerCase();const sc=en===q||ru===q?0:en.startsWith(q)||ru.startsWith(q)?1:en.includes(q)||ru.includes(q)?2:9;if(sc<9)res.push([sc,en.length,+id]);}
      res.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const seen=new Set();res.slice(0,120).forEach(([,,id])=>{const w=D(id);const k=w.en.toLowerCase()+'|'+w.ru;if(seen.has(k))return;seen.add(k);
        list.append(h('div',{class:'wrow',onclick:()=>showWord(id,()=>showWords('dict'))},spk(w.sound),h('b',{},w.en),h('span',{class:'muted wtr'},w.tr?'['+w.tr+']':''),h('span',{},w.ru),
          S.srs[id]?h('small',{class:'tc-v'},'✓'):h('button',{class:'tg',onclick:e=>{e.stopPropagation();srsAdd(id,false);save();draw();nav('words');}},'+'),h('span',{}),h('span',{})));});
      if(!res.length)list.append(h('p',{class:'muted'},'Не найдено. ',h('button',{class:'tg',onclick:()=>showCardForm(null,null,()=>showWords('dict'),/[a-z]/i.test(q)?{en:search.value.trim()}:{ru:search.value.trim()})},'Создать свою карточку')));};
    search.oninput=draw;draw();page.append(search,list);setTimeout(()=>search.focus(),50);}
  else if(tab==='read')page.append(showReaderList());
  else if(tab==='expressions')page.append(expressionList());
  else if(tab==='stats'){const cnt={n:0,l:0,y:0,m:0};Object.values(S.srs).forEach(e=>{if(!e.reps)cnt.n++;else if(!(e.ivl>=1))cnt.l++;else if(e.ivl<21)cnt.y++;else cnt.m++;});
    const days=[];for(let i=83;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));}
    const mx=Math.max(1,...days.map(d=>S.hist[d]||0));const rv=S.rv||{n:0,ok:0};
    const tm=days.slice(-14);
    page.append(h('div',{class:'stats left'},h('div',{class:'stat p'},h('small',{},'НОВЫЕ'),cnt.n),h('div',{class:'stat y'},h('small',{},'ИЗУЧАЮТСЯ'),cnt.l),h('div',{class:'stat b'},h('small',{},'МОЛОДЫЕ (<21 дн)'),cnt.y),h('div',{class:'stat g'},h('small',{},'ЗРЕЛЫЕ (21+ дн)'),cnt.m),h('div',{class:'stat o'},h('small',{},'УДЕРЖАНИЕ'),rv.n?Math.round(rv.ok/rv.n*100)+'%':'—')),
      h('h3',{},'Повторения за 12 недель'),h('div',{class:'heat'},days.map(d=>h('i',{title:d+': '+(S.hist[d]||0),style:'opacity:'+(S.hist[d]?.25+.75*S.hist[d]/mx:1)+';background:'+(S.hist[d]?'var(--g)':'#26262e')}))),
      h('h3',{},'Минуты занятий (14 дней)'),bars(tm.map(d=>Math.round((S.time[d]||0)/60)),tm.map(d=>d.slice(8))),
      h('h3',{},'Прогноз на 30 дней'),bars(forecast(30),Array.from({length:30},(_,i)=>i%5?'':String(i))),
      h('p',{class:'muted small'},'Удержание — доля повторений «вспомнил» среди слов с интервалом от 1 дня. Хороший показатель — 85–90%.'));}
  setMain(page);}
function toggleSet(key){const i=S.sets.indexOf(key);const j=key.startsWith('t:')?S.sets.indexOf(+key.slice(2)):-1;if(i>=0||j>=0){S.sets=S.sets.filter(x=>x!==key&&x!==+key.slice(2));if(S.swipe?.activeKey===key){const next=S.sets[0];S.swipe.activeKey=typeof next==='number'?'t:'+next:next||null;}}else S.sets.push(key);save();}
function boxBar(b){return h('span',{class:'boxbar',title:'Уровень '+b+' / 7'},[1,2,3,4,5,6,7].map(i=>h('i',{class:i<=b?'on':''})));}
function showBrowse(key){const st=setBy(key);const ws=st?setWords(st):[];if(!ws.length){toast('В этом наборе пока нет слов');return;}let i=0,flipped=false,order=ws.slice();const card=h('div',{class:'fc big'});
  const draw=()=>{const w=order[i];card.innerHTML='';card.append(flipped?wordDetail(w,{compact:true}):h('div',{class:'fc-front'},w.img?img(w.img,'w-img sm'):null,h('div',{class:'w-en'},w.en,spk(w.sound)),w.tr?h('div',{class:'w-tr'},'['+w.tr+']'):null,h('small',{class:'muted'},'нажмите, чтобы перевернуть')));cnt.textContent=(i+1)+' / '+order.length;};
  const cnt=h('div',{class:'muted center'});card.onclick=e=>{if(e.target.closest('button,.w-note,textarea'))return;flipped=!flipped;draw();};
  const go=d=>{i=(i+d+order.length)%order.length;flipped=false;draw();};
  session={back:()=>exit.click(),key:e=>{if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key===' '){e.preventDefault();flipped=!flipped;draw();}else if(e.key==='Escape'){session=null;showSet(key);}}};
  setMain(h('div',{class:'page narrow'},h('button',{class:'main-btn ghost small',onclick:()=>{session=null;showSet(key);}},'← '+st.title),cnt,card,
    h('div',{class:'row center'},h('button',{class:'main-btn ghost',onclick:()=>go(-1)},'←'),h('button',{class:'main-btn ghost',onclick:()=>{order=shuffle(order);i=0;flipped=false;draw();}},'🔀'),h('button',{class:'main-btn ghost',onclick:()=>go(1)},'→')),
    h('small',{class:'muted center'},'← → — листать · пробел — перевернуть')));draw();}
function showSet(key){nav('words');const st=setBy(key);if(!st)return showWords('sets');const ws=setWords(st);const on=S.sets.includes(key)||(key.startsWith('t:')&&S.sets.includes(+key.slice(2)));const nNew=ws.filter(w=>!S.srs[w.id]).length;
  const modes=[['browse','🃏 Карточки','листать и переворачивать'],['match','🧩 Подбор','найти пары слов'+(S.rec['match:'+key]?' · рекорд '+S.rec['match:'+key]+' с':'')],['test','📝 Тест','разные вопросы'],['spell','✍️ Правописание','написать слово по переводу'],['dict','✍️ Письменная практика','написать перевод']];
  setMain(h('div',{class:'page'},h('button',{class:'main-btn ghost small',onclick:()=>showWords(key==='mine'?'mine':'sets')},'← Наборы'),
    h('div',{class:'hero-l'},st.img?img(st.img,'lv-img'):null,h('div',{},h('h1',{},st.title),st.desc?h('p',{class:'muted'},st.desc):null)),
    h('div',{class:'row'},key!=='mine'?h('button',{class:'main-btn green',disabled:!nNew||!newLeftToday(),onclick:()=>{if(!on)toggleSet(key);startLearn(ws.map(w=>w.id),()=>showSet(key));}},'✚ Учить новые ('+Math.min(nNew,S.set.newPer,newLeftToday())+' из '+nNew+')'):null,
      key!=='mine'?h('button',{class:'main-btn ghost',onclick:()=>{toggleSet(key);showSet(key);}},on?'✓ В изучаемых':'+ В изучаемые'):null,
      st.deck?h('button',{class:'main-btn ghost',onclick:()=>showCardForm(null,st.deck.id,()=>showSet(key))},'+ Карточка'):null,
      st.deck?h('button',{class:'main-btn ghost small',onclick:()=>{const n=prompt('Новое название',st.deck.name);if(n){st.deck.name=n;save();showSet(key);}}},'Переименовать'):null,
      st.deck?h('button',{class:'main-btn ghost small',onclick:()=>{if(confirm('Удалить колоду и её карточки?')){Object.keys(S.cards).forEach(k=>{if(S.cards[k].deck===st.deck.id){delete S.cards[k];delete S.srs[k];}});S.decks=S.decks.filter(d=>d!==st.deck);toggleSet(key);save();showWords('sets');}}},'Удалить'):null),
    h('div',{class:'swipe-set-launch'},h('p',{class:'muted'},'Свайп вправо — знаю, влево — пока не знаю. Набор и остановка сохраняются.'),h('div',{class:'swipe-set-choices'},h('button',{class:'main-btn blue',onclick:()=>openSwipeSet(key)},'Учить свайпами'),h('button',{class:'tg',onclick:()=>openSwipeSet(key,'free')},'Свободная практика'))),h('h3',{},'Режимы тренировки'),h('div',{class:'pairs-grid'},modes.map(([m,l,d])=>h('button',{class:'paircard',disabled:ws.length<2,onclick:()=>m==='browse'?showBrowse(key):startSetMode(st,m)},h('b',{},l),h('small',{class:'muted'},d)))),
    h('h3',{},'Слова ('+ws.length+')'),libraryVocabularyList(ws,()=>showSet(key))));}
// ---------- повторение грамматики (ошибки возвращаются через 1, 3, 7 дней)
const GIV=[1,3,7];
function gAnswer(key,ok,inMist){const i=S.mist.indexOf(key);let e=S.gs[key];
  if(!ok){S.gs[key]={b:0,due:now()+DAY};if(i<0)S.mist.push(key);return;}
  if(!e){if(i>=0&&inMist){S.gs[key]={b:1,due:now()+GIV[1]*DAY};}return;}
  if(e.due<=now()||inMist){e.b++;if(e.b>=GIV.length){delete S.gs[key];if(i>=0)S.mist.splice(i,1);}else e.due=now()+GIV[e.b]*DAY;}}
const gDue=()=>S.mist.filter(k=>!S.gs[k]||S.gs[k].due<=now());
// ---------- сессия
function startSession(meta,steps){
  markDay();fx('start');
  const resumed=meta.id&&S.resume&&S.resume.id===meta.id;const queue=resumed?S.resume.steps.map(restoreStep):steps.slice();const log=[];let pos=resumed?S.resume.pos:0,firstTotal=resumed?(S.resume.firstTotal||0):0,firstOk=resumed?(S.resume.firstOk||0):0,streak=0,best=0;const t0=Date.now();
  const root=h('div',{class:'session'});const bar=h('div',{class:'progress'},h('i'));
  const exitBtn=h('button',{class:'icon-btn',title:'Выйти (Esc)',onclick:()=>{{tick();save();session=null;(meta.back||showMap)();}}},'×');
  root.append(h('div',{class:'session-top'},exitBtn,bar,h('span',{class:'session-title'},meta.title)));
  const body=h('div',{class:'session-body'}),foot=h('div',{class:'session-foot'});root.append(body,foot);setMain(root,true);
  let cur=null,ready=false,phase='answer',stepCtx=null;
  const btn=h('button',{class:'main-btn'},'Проверить');const fb=h('div',{class:'feedback hidden'});foot.append(fb,btn);
  const upd=()=>{bar.firstChild.style.width=Math.round(pos/queue.length*100)+'%';};
  let lastT=Date.now();const tick=()=>{const n=Date.now();const d=Math.min(60e3,n-lastT);lastT=n;const k=today();S.time[k]=(S.time[k]||0)+d/1000;};
  function next(){stopMedia();if(pos>=queue.length||(meta.until&&Date.now()>meta.until))return finish();
    upd();if(meta.id){S.resume={id:meta.id,pos,steps:queue.map(packStep),firstTotal,firstOk};save();}phase='answer';ready=false;lastChoice='';fb.className='feedback hidden';fb.innerHTML='';const st=queue[pos];
    stepCtx={setReady:v=>{ready=v;btn.disabled=!v;},done:res=>result(st,{user:lastChoice,...res}),enter:()=>btn.click(),keys:null};
    try{cur=R[st.type](st,stepCtx);}catch(err){console.error(err,st);body.innerHTML='';body.append(h('p',{},'Задание не удалось открыть. Оно не засчитано. Экспортируйте прогресс и сообщите тип: '+st.type));btn.textContent='Вернуться';btn.style.display='';btn.disabled=false;btn.onclick=meta.back||showToday;return;}
    body.innerHTML='';body.classList.remove('show-colors');body.classList.toggle('always-colors',S.set.highlight==='always');body.append(h('div',{class:'step anim'},cur.el));body.scrollTop=0;if(cur.mode!=='continue'&&st.type!=='flip'){body.append(h('button',{class:'tg hint-btn',onclick:()=>{body.classList.toggle('show-colors');let extra=body.querySelector('.hint-extra');if(!extra){extra=h('div',{class:'hint-extra'},legendEl(st.g?.toks||st.ans||st.toks||[]),st.tense?formulaEl({f:st.tense.f[0]},true):null);body.append(extra);}extra.classList.toggle('hidden',!body.classList.contains('show-colors'));if(st.rid)toast('Проверьте порядок слов и форму глагола');else if(st.tense)toast('Подумайте: факт, процесс или результат к моменту?');}},'Подсказка'),h('button',{class:'tg solution-btn',onclick:()=>result(st,{ok:false,reveal:true,user:lastChoice,...solutionFor(st)})},'Показать ответ'));}if(cur.mode==='continue')body.classList.add('show-colors');
    if(cur.mode==='continue'){btn.textContent='Продолжить';btn.className='main-btn blue';btn.disabled=false;btn.style.display='';phase='cont';}
    else if(cur.mode==='check'){btn.textContent='Проверить';btn.className='main-btn blue';btn.disabled=!ready;btn.style.display='';}
    else btn.style.display='none';}
  function result(st,res){
    if(phase==='result')return;
    if(!res.ok&&!res.skipFb){recordError(st,res);if(!st._missed&&!res.reveal&&!res.noRetry){st._missed=true;if(meta.id&&S.resume)S.resume.steps=queue.map(packStep);tick();save();fb.innerHTML='';fb.className='feedback bad';fb.append(h('div',{class:'fb-head'},'Пока неверно'),h('p',{},retryHint(st)),h('button',{class:'tg',onclick:()=>next()},'Повторить попытку'),h('button',{class:'tg',onclick:()=>result(st,{...res,reveal:true})},'Показать ответ'));phase='retry';btn.style.display='none';body.querySelectorAll('.opt,.tile,input,textarea').forEach(e=>e.disabled=true);return;}}
    body.classList.add('show-colors');if(res.reveal||res.noRetry&&!res.ok)body.querySelectorAll('.opt').forEach(b=>{if(b.dataset.correct==='true'){b.classList.add('ok');b.setAttribute('aria-label','Правильный ответ: '+b.textContent);}});phase='result';if(!st.retry){firstTotal++;if(res.ok&&!st._missed)firstOk++;}
    S.answers++;if(res.ok)S.correct++;
    if(res.ok){streak++;best=Math.max(best,streak);}else streak=0;
    // No forced retry queue: solution + continue is always available.
    if(st.srs&&(!st.retry||st.type==='flip'))srsAnswer(st.srs,res.grade||(res.ok&&!st._missed&&!res.reveal?3:1));
    tick();
    if(st.key&&!st.retry)gAnswer(st.key,res.ok,meta.mistakes);
    const tk=st.tk||(st.g&&st.g.t&&st.g.t.k);
    if(tk&&!st.retry){const p=S.ts[tk]=S.ts[tk]||{n:0,ok:0};p.n++;if(res.ok)p.ok++;if(!res.ok&&res.chosenTk&&res.chosenTk!==tk){const k=tk+'>'+res.chosenTk;S.conf[k]=(S.conf[k]||0)+1;}}
    if(st.pair&&!st.retry){const p=S.ps[st.pair]=S.ps[st.pair]||{n:0,ok:0};p.n++;if(res.ok)p.ok++;}
    log.push({first:!st.retry,ok:res.ok,tk,ch:res.chosenTk});
    save();if(res.skipFb){fx('tap');pos++;upd();return next();}
    fx(res.ok?'correct':'wrong');
    const snd=st.sound||(res.word&&res.word.sound);if(snd&&st.type!=='quick')voice(snd,450);
    fb.innerHTML='';fb.className='feedback '+(res.ok?'ok':'bad');
    if(res.ok&&streak>=3)fb.append(h('div',{class:'streak'},streak+' верных ответов подряд! 🔥'));
    fb.append(h('div',{class:'fb-head'},res.ok?(st._missed?'Верно после повторной попытки':'Верно'):'Разберём ответ',snd&&st.type!=='quick'?spk(snd):null));
    if(res.node)fb.append(h('div',{class:'fb-line'},res.node));
    if(res.msg)fb.append(h('div',{class:'fb-line'},res.msg));
    if(res.ans)fb.append(h('div',{class:'fb-line'},res.ok?'':'Правильно: ',ansEl(res.ans,true)));
    if(res.tr)fb.append(h('div',{class:'fb-line muted'},res.tr));
    if(res.toks)fb.append(h('div',{class:'fb-line'},res.ok?'':'Правильно: ',sentenceEl(res.toks)));
    if(res.correctText)fb.append(h('div',{class:'fb-line'},res.correctText));
    if(res.word)fb.append(h('div',{class:'fb-line'},h('b',{},res.word.en),res.word.tr?' ['+res.word.tr+']':'',' — '+res.word.ru));
    if(!res.ok){const explanation=answerExplanation(st,res);if(explanation&&explanation!==res.msg)fb.append(h('p',{class:'fb-line'},explanation));if(st.w?.exen)fb.append(h('div',{class:'feedback-example'},exampleBlock(st.w.exen,st.w.exru)));}if((st.rid&&SD.R[st.rid])||st.tense){const exb=h('button',{class:'explain-btn',onclick:()=>{exb.replaceWith(h('div',{class:'explain'},st.tense?tenseCard(st.tense,true):ruleBox(st.rid,true)));}},'Подробнее · связанное правило');fb.append(exb);
      }
    btn.style.display='';btn.disabled=false;btn.textContent='Далее';btn.className='main-btn blue';pos++;if(meta.id){S.resume={id:meta.id,pos,steps:queue.map(packStep),firstTotal,firstOk};save();}upd();}
  btn.onclick=()=>{if(btn.disabled)return;if(phase==='cont'){const st=queue[pos];if(st.type==='word'&&st.w){srsAdd(st.w.id);save();}tick();pos++;next();}else if(phase==='answer'&&cur.mode==='check'){result(queue[pos],{user:[...body.querySelectorAll('.answer-line .tile')].map(e=>e.textContent).join(' ')||lastChoice,...cur.check()});}else if(phase==='result')next();};
  session={back:()=>exitBtn.click(),key:e=>{if(e.key==='Escape'){exitBtn.click();return;}
    const tag=document.activeElement.tagName;const typing=tag==='TEXTAREA'||tag==='INPUT';
    if(phase==='answer'&&stepCtx&&stepCtx.keys&&!typing&&stepCtx.keys(e)){e.preventDefault();return;}
    if(e.key==='Enter'&&!typing){e.preventDefault();btn.click();}}};
  function finish(){if(meta.id)delete S.resume;session=null;fx('win');tick();save();const _x=0;const acc=firstTotal?Math.round(firstOk/firstTotal*100):100;const sec=Math.round((Date.now()-t0)/1000);
    const verified=firstTotal>0&&acc>=MASTERY_THRESHOLD;const stars=verified?(acc>=90?3:2):0;let added=0;
    if(meta.id){const prev=lessonStatus(meta.id);S.lessonProgress[meta.id]={completed:true,mastered:!!prev.mastered||verified,legacy:false,bestAccuracy:firstTotal?(prev.legacy?acc:Math.max(prev.bestAccuracy||0,acc)):(prev.bestAccuracy??null),lastAccuracy:firstTotal?acc:null,lastFirstTotal:firstTotal,attempts:(prev.attempts||0)+1,finishedAt:Date.now()};S.stars[meta.id]=Math.max(S.stars[meta.id]||0,stars);if(firstTotal)S.acc[meta.id]=Math.max(S.acc[meta.id]||0,acc);}
    if(meta.words)meta.words.forEach(id=>{if(srsAdd(id))added++;});save();if(meta.onDone)meta.onDone(acc,log);
    const time=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
    setMain(h('div',{class:'finish'},h('div',{class:'finish-check'},'✓'),
      h('h2',{},meta.kind==='lesson'?'Урок завершён':meta.kind==='cp'?'Проверка завершена':meta.doneTitle||'Готово!'),
      meta.kind==='lesson'?h('p',{class:'muted'},'В уроке — ',h('span',{class:'tc-v'},(meta.words||[]).length+' '+plural((meta.words||[]).length,'слово','слова','слов')),' и ',h('span',{class:'tc-v'},meta.rules+' '+plural(meta.rules,'правило','правила','правил')),' грамматики'):null,
      meta.id?h('div',{class:'assessment-note'+(verified?' confirmed':'')},h('b',{},verified?'Освоение подтверждено в этом занятии':firstTotal?'Материал стоит закрепить':'Освоение пока не проверено'),h('p',{},firstTotal?'Верные ответы с первой попытки: '+firstOk+' из '+firstTotal+'. Для подтверждения нужно не меньше '+MASTERY_THRESHOLD+'%. Просмотр ответа и исправленная попытка не считаются первым верным ответом.':'В этом занятии не было проверяемых заданий.'),!verified&&lessonStatus(meta.id).mastered?h('p',{class:'muted'},'Успешный результат прошлого занятия сохранён.'):null):null,
      added?h('p',{class:'muted'},'📚 '+added+' '+plural(added,'слово добавлено','слова добавлены','слов добавлено')+' в повторение'):null,
      
      h('div',{class:'stats'},h('div',{class:'stat y'},h('small',{},'ОТВЕТЫ'),firstOk+' / '+firstTotal),h('div',{class:'stat p'},h('small',{},'ВРЕМЯ'),'⏱ '+time),h('div',{class:'stat g'},h('small',{},'С ПЕРВОЙ ПОПЫТКИ'),firstTotal?acc+'%':'—'),best>=3?h('div',{class:'stat b'},h('small',{},'СЕРИЯ'),'🔥 '+best):null),
      meta.extra?meta.extra(log):null,
      h('div',{class:'row'},meta.again?h('button',{class:'main-btn ghost',onclick:meta.again},'Повторить'):null,h('button',{class:'main-btn blue',onclick:meta.back||showMap},'Продолжить'))),true);}
  next();}
const plural=(n,a,b,c)=>{n=Math.abs(n)%100;const m=n%10;if(n>10&&n<20)return c;if(m>1&&m<5)return b;if(m===1)return a;return c;};
function startNode(n){
  if(n.k==='L')startSession({id:n.key,kind:'lesson',title:'Урок '+n.num+'. '+n.title,words:n.d.w,rules:n.d.r.length,again:()=>startNode(n)},lessonSteps(n));
  else if(n.k==='C')startSession({id:n.key,kind:'cp',title:n.lv.t+' · '+n.title,doneTitle:n.title+' пройден!',again:()=>startNode(n)},cpSteps(n));
  else startSession({id:n.key,kind:'dlg',title:n.title,doneTitle:'Диалог завершён!',again:()=>startNode(n)},dialogSteps(n.d));}
// ---------- экраны
const main=()=>$('#main');
function setMain(el,sess){if(swipeCleanup){const cleanup=swipeCleanup;swipeCleanup=null;cleanup();}stopMedia();main().innerHTML='';main().append(el);document.body.classList.toggle('in-session',!!sess);main().scrollTop=0;window.scrollTo(0,0);}
function toast(t){const e=h('div',{class:'toast'},t);document.body.append(e);setTimeout(()=>e.remove(),2600);}
function nav(active){$('#nav').innerHTML='';const due=dueIds().length;
  [['map','🗺️','Уроки',showMap,0],['words','📚','Слова',showWords,due],['tenses','🎯','Времена',showTenses,0],['rules','📘','Правила',showRules,0],['mist','🩹','Ошибки',showMistakes,gDue().length],['set','⚙️','',showSettings,0]]
    .forEach(([k,ic,l,f,n])=>$('#nav').append(h('button',{class:'nav-btn'+(k===active?' on':'')+(n?' due':''),onclick:()=>{session=null;f();}},h('span',{class:'ni'},ic),l?h('span',{class:'nl'},l):null,n?h('span',{class:'badge'},n):null)));
  $('#streak').innerHTML='';$('#streak').append(h('span',{title:'Дней подряд'},'🔥 '+streakDays()),h('span',{title:'Всего верных ответов'},'✔ '+S.correct));}
function levelProgress(lv){const done=lv.list.filter(n=>S.stars[n.key]).length;return {done,total:lv.list.length,pct:Math.round(done/lv.list.length*100)};}
function showMap(){nav('map');const lv=LV.find(l=>l.id===S.level)||LV[0];
  const tabs=h('div',{class:'level-tabs'},LV.map(l=>{const p=levelProgress(l);return h('button',{class:'lvl'+(l===lv?' on':''),style:'--lc:'+l.c,onclick:()=>{S.level=l.id;save();showMap();}},h('b',{},l.t),h('span',{class:'lvl-bar'},h('i',{style:'width:'+p.pct+'%'})),h('small',{},p.done+' / '+p.total));}));
  const nextN=lv.list.find(n=>!S.stars[n.key]);const path=h('div',{class:'path'});
  lv.list.forEach((n,i)=>{const off=[0,1,0,-1][i%4]*100;const st=S.stars[n.key]||0;
    const cls='node2 k'+n.k+(st?' done':'')+(n===nextN?' next':'');
    const face=n.k==='L'?[img(n.d.img,'n-img'),h('span',{class:'n-num'},n.num)]:n.k==='C'?[h('div',{class:'n-emoji'},'🚩')]:[h('div',{class:'n-emoji'},'💬')];
    const label=n.k==='L'?[h('small',{},'Урок '+n.num),h('div',{class:'n-title'},n.title)]:n.k==='C'?[h('div',{class:'n-title big'},n.title),h('small',{},'Оценка полученных знаний')]:[h('small',{},n.d.h),h('div',{class:'n-title'},n.d.d)];
    path.append(h('div',{class:'node-wrap',style:'--off:'+(off/100)},
      h('button',{class:cls,onclick:()=>startNode(n)},h('div',{class:'n-circle'},face,n===nextN?h('span',{class:'go'},st?'Повторить':'Начать'):null),
        h('div',{class:'n-stars'},[1,2,3].map(k=>h('span',{class:k<=st?'on':''},'★'))),h('div',{class:'n-label'},label))));});
  const p=levelProgress(lv);const due=dueIds().length;
  setMain(h('div',{class:'map',style:'--lc:'+lv.c},tabs,
    h('div',{class:'hero'},h('div',{class:'hero-l'},img(lv.img,'lv-img'),h('div',{},h('h1',{},lv.t),h('p',{class:'muted'},lv.d+' · пройдено '+p.done+' из '+p.total))),
      h('div',{class:'row'},due?h('button',{class:'main-btn ghost',onclick:startReview},'📚 Повторить слова ('+due+')'):null,
        nextN?h('button',{class:'main-btn blue',onclick:()=>startNode(nextN)},'▶ Продолжить: '+nextN.title):h('span',{class:'muted'},'Уровень пройден 🎉'))),path));
  if(nextN)setTimeout(()=>{const e=$('.node2.next');if(e)e.scrollIntoView({block:'center',behavior:'smooth'});},80);}
// --- правила
function showRules(){nav('rules');
  const search=h('input',{class:'search',placeholder:'Поиск по правилам: does, have, since…'});const list=h('div',{});
  const grid=h('div',{class:'tgrid'});['Present','Past','Future'].forEach(tm=>TS.T.filter(t=>t.time===tm).forEach(t=>grid.append(tenseCard(t))));
  const drawList=()=>{const q=search.value.trim().toLowerCase();list.innerHTML='';
    LV.forEach(lv=>{const sec=h('div',{class:'rule-level'},h('h2',{},lv.t));let any=false;
      lv.list.filter(n=>n.k==='L').forEach(n=>{const txt=(n.title+' '+n.d.r.map(r=>SD.R[r].m).join(' ')).toLowerCase().replace(/[;*#]/g,'');if(q&&!txt.includes(q))return;any=true;
        sec.append(h('details',{class:'rule-item',open:!!q},h('summary',{},'Урок '+n.num+'. '+n.title),n.d.r.map(r=>ruleBox(r,true)),h('button',{class:'main-btn small blue',onclick:()=>startNode(n)},'Пройти урок')));});
      if(any)list.append(sec);});};
  search.oninput=drawList;drawList();
  setMain(h('div',{class:'page'},h('h1',{},'Справочник'),h('h2',{},'Правила курса'),search,list,
    h('h2',{},'12 времён английского (шпаргалка)'),h('p',{class:'muted'},'Время = «когда» (Present / Past / Future) × «как» (Simple — факт, Continuous — процесс, Perfect — результат к моменту, Perfect Continuous — процесс до момента).'),grid));}
// --- ошибки
function showMistakes(){nav('mist');
  const items=S.mist.map(k=>({k,t:keyText(k)})).filter(o=>o.t);const due=gDue().filter(k=>keyStep(k));
  const run=(keys,title)=>startSession({title,mistakes:true,doneTitle:'Ошибки проработаны!',back:showMistakes},shuffle(keys).slice(0,20).map(keyStep).filter(Boolean));
  setMain(h('div',{class:'page'},h('h1',{},'🩹 Работа над ошибками'),
    h('p',{class:'muted'},items.length?'Задания, в которых вы ошиблись, возвращаются на повторение через 1, 3 и 7 дней. После трёх верных ответов подряд задание считается освоенным и уходит из списка.':'Ошибок нет — отлично! Они появятся здесь автоматически.'),
    items.length?h('div',{class:'row'},h('button',{class:'main-btn blue',disabled:!due.length,onclick:()=>run(due,'Повторение ошибок')},'▶ На сегодня ('+Math.min(20,due.length)+')'),
      h('button',{class:'main-btn ghost',onclick:()=>run(items.map(o=>o.k),'Все ошибки')},'Все ошибки ('+items.length+')'),
      h('button',{class:'main-btn ghost',onclick:()=>{if(confirm('Очистить список ошибок?')){S.mist=[];S.gs={};save();showMistakes();}}},'Очистить')):null,
    h('div',{class:'mist-list'},items.slice().reverse().map(o=>{const g=S.gs[o.k];return h('div',{class:'mist'},spk(o.t.snd),o.t.main,h('span',{class:'muted'},' — '+o.t.sub),
      h('small',{class:'muted'},o.t.src+(g?' · повтор '+(g.due<=now()?'сегодня':new Date(g.due).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}))+' · '+boxBarG(g.b):'')));}))));}
const boxBarG=b=>'●'.repeat(b)+'○'.repeat(3-b);
// Wordly UI layer. Course mechanics and SRS are retained.
S.set=Object.assign({theme:'telegram',highlight:'hint',speechRate:1},S.set);
if(!S.wordlyVersion){S.set.revMode='cards';S.wordlyVersion=1;}
S.errorDetails=S.errorDetails||{};
let lastChoice='',activeTab='today';
document.addEventListener('click',e=>{const b=e.target.closest('.opt,.tile,.mtile,.fx-w,.fx-n');if(b)lastChoice=b.textContent;},true);
function applyTheme(){const tg=window.Telegram?.WebApp;const choice=S.set.theme||'telegram';const systemDark=tg?tg.colorScheme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;const theme=choice==='telegram'?(systemDark?'dark':'light'):(['light','dark','coffee','forest','cherry','violet'].includes(choice)?choice:'light');document.documentElement.dataset.theme=theme;document.documentElement.dataset.highlight=S.set.highlight;const vars=getComputedStyle(document.documentElement);const hex=k=>vars.getPropertyValue(k).trim();const bg=hex('--bg');const head=theme==='light'?bg:hex('--header-bg');tg?.setHeaderColor(head.startsWith('#')?head:bg);tg?.setBackgroundColor(bg);}
function sameWord(a,b){const canonical=v=>String(v||'').normalize('NFC').replace(/’/g,"'").toLowerCase().replace(/\s+/g,' ').trim();return canonical(a.en)===canonical(b.en)&&canonical(a.ru)===canonical(b.ru);}
function packStep(st){return JSON.parse(JSON.stringify(st));}
function restoreStep(st){st=packStep(st);if(st.tense?.k)st.tense=TT(st.tense.k);if(st.g?.t?.k)st.g.t=TT(st.g.t.k);return st;}
function solutionFor(st){if(st.ans)return {ans:st.ans};if(st.w)return {word:st.w};if(st.g)return {toks:st.g.toks,msg:st.g.t.use};if(st.type==='insert')return {ans:st.toks.map(t=>({w:t.gap?st.a+(t.tail||''):t.w,c:t.c}))};if(st.type==='pick')return {correctText:st.sent.replace('___',st.a),msg:st.why};if(st.type==='tf')return {correctText:st.a?'Предложение верно':'В предложении есть ошибка',msg:'Сравните с правилом ниже.'};if(st.q)return {correctText:st.q[1]};if(st.type==='fix')return {correctText:parseText(st.text.x).map(p=>p.err?p.r:p.t).join('')};return {msg:'Разберите задание по связанному правилу.'};}
function retryHint(st){
 if(st.w)return st.type==='wtype'?'Вспомните английское слово и проверьте написание.':'Вспомните значение слова. Можно посмотреть перевод и пример.';
 if(st.type==='dlgq')return 'Прочитайте последнюю реплику и выберите ответ по её смыслу.';
 if(st.type==='tname')return 'Определите: это факт, процесс или результат? Затем выберите название времени.';
 const rule=st.rid&&SD.R[st.rid];if(st.rid===11001)return 'С I используется am; с he / she / it — is; с you / we / they — are. Найдите подлежащее и попробуйте ещё раз.';if(rule?.short)return rule.short+' Попробуйте применить это правило ещё раз.';
 if(st.tense||st.g?.t)return (st.tense||st.g.t).use+' Проверьте форму глагола.';
 if(st.type==='tf')return 'Проверьте, соответствует ли предложение изученному правилу.';
 return 'Сравните условие задания и свой ответ. Можно повторить попытку или открыть решение.';
}
function answerExplanation(st,res){
 if(st.w)return st.type==='wtype'?'Сравните написание вашего ответа с английским словом выше.':'Запомните значение слова в примере, а не только пару переводов.';
 if(st.why)return st.why;
 const rule=st.rid&&SD.R[st.rid];if(st.rid===11001)return 'Форма be зависит от подлежащего: I am; he / she / it is; you / we / they are.';if(rule?.short)return rule.short;
 const tense=st.tense||st.g?.t;if(tense)return tense.use;
 if(st.type==='dlgq')return 'Этот перевод соответствует последней реплике собеседника.';
 if(st.type==='fix')return 'Сравните исправленный текст с исходным: изменены места с ошибками.';
 return '';
}
function recordError(st,res){if(!st.key){const stable=packStep(st);delete stable._missed;const src=JSON.stringify(stable);let hash=2166136261;for(const ch of src)hash=Math.imul(hash^ch.charCodeAt(0),16777619);st.key='saved:'+(hash>>>0);}
 const old=S.errorDetails[st.key];S.errorDetails[st.key]={step:packStep(st),user:res.user||lastChoice||'Ответ просмотрен',at:Date.now(),previous:old?.user};gAnswer(st.key,false,false);save();}
const baseKeyStep=keyStep;keyStep=function(k){const d=S.errorDetails[k];if(!d)return baseKeyStep(k);const st=restoreStep(d.step);delete st._missed;return st;};
const baseLessonSteps=lessonSteps;lessonSteps=function(n){return baseLessonSteps(n).flatMap(st=>st.type==='quick'?st.rows.map((row,i)=>{const ts=parseAns(row[0]);return {type:'insert',key:'quick:'+st.rid+':'+row[0],rid:st.rid,sound:row[3],colored:true,toks:ts.map(t=>({...t,gap:/^\(.+\)$/.test(t.w),w:t.w.replace(/^\(|\)$/g,'')})),a:ts.find(t=>/^\(.+\)$/.test(t.w))?.w.replace(/^\(|\)$/g,'')||'',o:[row[2]],tr:row[1]};}):[st]);};
// Only explicit source tags are parsed. No heuristic POS guessing.
parse=function(str){return String(str).trim().split(/\s+/).flatMap(raw=>{const m=raw.match(/^([svanqtop]):(.+)$/);return (m?m[2]:raw).split('_').filter(Boolean).map(w=>({w,c:m?m[1]:null}));});};
function choice(ctx,title,prompt,options,right,feedback){let used=false;const buttons=h('div',{class:'options col'},shuffle([...new Set(options)]).map(o=>h('button',{class:'opt','data-correct':String(o===right),onclick:e=>{if(used)return;used=true;e.currentTarget.classList.add(o===right?'ok':'bad');e.currentTarget.setAttribute('aria-label',(o===right?'Верный ответ: ':'Ваш ответ, неверно: ')+o);buttons.querySelectorAll('button').forEach(b=>b.disabled=true);ctx.done({ok:o===right,user:o,...feedback(o)});}},o)));ctx.keys=e=>{if(/^[1-9]$/.test(e.key)){buttons.children[+e.key-1]?.click();return true;}};return {mode:'auto',el:h('div',{},h('h3',{class:'step-title'},title),prompt,buttons)};}
R.insert=(st,ctx)=>choice(ctx,'Выберите правильную форму',h('div',{class:'choice-sent'},taskEl(st.toks,{colored:true})),[st.a,...st.o],st.a,()=>solutionFor(st));
R.pick=(st,ctx)=>choice(ctx,'Выберите правильную форму',h('div',{},st.ctxt?h('p',{class:'muted'},st.ctxt):null,h('div',{class:'choice-sent'},st.sent.replace('___','…'))),[st.a,...st.o],st.a,o=>({...solutionFor(st),chosenTk:st.otk?.[o]}));
R.wchoice=(st,ctx)=>{const w=st.w,dir=st.dir||'en',tgt=dir==='en'?'ru':'en';return choice(ctx,dir==='listen'?'Что вы услышали?':'Выберите перевод',h('div',{class:'w-q'},dir==='listen'?spk(w.sound,true):h('div',{class:'w-en'},dir==='en'?w.en:w.ru),dir==='en'?spk(w.sound):null),[w[tgt],...distract(w,tgt,3)],w[tgt],()=>({word:w,noRetry:true}));};
R.wlisten=(st,ctx)=>R.wchoice({...st,dir:'listen'},ctx);
R.pimg=(st,ctx)=>R.wchoice({...st,dir:st.mode==='img'?'en':'ru'},ctx);
R.tf=(st,ctx)=>choice(ctx,'Есть ли ошибка?',h('div',{class:'choice-sent'},st.text),['Верно','Есть ошибка'],st.a?'Верно':'Есть ошибка',()=>solutionFor(st));
R.dlgq=(st,ctx)=>choice(ctx,'Что вам сказали?',chatEl([...st.hist,{who:'them',en:st.q[0]}]),[st.q[1],st.q[4]].filter(Boolean),st.q[1],()=>({msg:st.q[0]+' — '+st.q[1]}));
R.tname=(st,ctx)=>{const g=st.g;return choice(ctx,'Какое это время?',h('div',{class:'choice-sent'},sentenceEl(g.toks)),[g.t.en,...similarTenses(g.t).map(t=>t.en)],g.t.en,o=>({toks:g.toks,msg:g.t.use,chosenTk:TS.T.find(t=>t.en===o)?.k}));};
R.tform=(st,ctx)=>{const g=st.g,vstr=t=>TS.verbPart(t,g.mode,g.subj[1],g.v).post.map(x=>x[1]).join(' '),right=vstr(g.t);let gap=false;const toks=g.toks.flatMap(t=>{if(['a','v','n'].includes(t.c)){if(gap)return [];gap=true;return [{w:'… ('+g.v.b+')',c:null}];}return [t];});return choice(ctx,'Выберите форму для заданного смысла',h('div',{},h('p',{class:'muted'},g.t.use),h('p',{class:'muted small'},modeName[g.mode]),h('div',{class:'choice-sent'},sentenceEl(toks))),[right,...similarTenses(g.t).map(vstr)],right,()=>({toks:g.toks,msg:g.t.use}));};
// All three Anki modes use the same scheduling algorithm and four grades.
R.flip=(st,ctx)=>{const w=st.w,dir=S.set.flipDir||'en',written=dir==='write',ru=dir==='ru'||written||dir==='both'&&Math.random()<.5;const front=h('div',{class:'fc-front'},wordArtwork(w),h('div',{class:'eyebrow'},ru?'Русский → английский':'Английский → русский'),h('div',{class:'w-en'},ru?w.ru:w.en),spk(w.sound));const back=h('div',{class:'fc-back hidden'});const input=written?h('input',{class:'type-input',placeholder:'Ваш ответ',autocomplete:'off',spellcheck:'false','aria-label':'Ответ по-английски'}):null;let shown=false,graded=false;const entry=srsGet(st.srs);
 const grades=h('div',{class:'grades hidden'},['Снова','Трудно','Хорошо','Легко'].map((label,i)=>h('button',{class:'gbtn grade-'+i,onclick:()=>grade(i+1)},h('b',{},label),h('small',{},fmtIvl(preview(entry,i+1))))));const button=h('button',{class:'main-btn blue wide',onclick:reveal},'Показать ответ');
 function reveal(){if(shown)return;shown=true;if(input){input.blur();input.disabled=true;}button.remove();back.classList.remove('hidden');grades.classList.remove('hidden');if(written)back.append(h('p',{class:matches(input.value,[w.en])?'tc-v':'tc-n'},matches(input.value,[w.en])?'Ответ совпадает':'Ваш ответ: '+(input.value||'—')));back.append(wordDetail(w,{compact:true,hideEn:!ru,noImg:true}));}
 function grade(g){if(!shown||graded)return;graded=true;ctx.done({ok:g>1,grade:g,skipFb:true,user:input?.value});}
 ctx.keys=e=>{if(e.key===' '||e.key==='Enter'){reveal();return true;}if(shown&&/^[1-4]$/.test(e.key)){grade(+e.key);return true;}};if(input)input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();reveal();}};
 return {mode:'auto',el:h('div',{class:'flip'},h('div',{class:'fc'},front,input,back),button,grades)};};
R.rule=(st)=>{const r=SD.R[st.rid],l=SD.L[r.l];return {mode:'continue',el:h('div',{class:'rule-step'},h('div',{class:'eyebrow'},'Правило '+st.num+' / '+st.of),ruleContent(st.rid,false),h('details',{},h('summary',{},'Подробнее · нюансы и ещё примеры'),h('div',{class:'rule-extra'},h('p',{},r.detail),l.examples.slice(1).map(e=>ruleExample(e,false)))),legendEl(Object.keys(TAGS).map(c=>({c}))))};};
function navIcon(k){const paths={today:'<path d="M3 10l9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',map:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1zm0 0v15"/>',words:'<rect x="7" y="3" width="14" height="17" rx="2"/><path d="M3 7v12a3 3 0 003 3h11M11 8h6m-6 4h6"/>',tenses:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',rules:'<path d="M4 6h16M4 12h16M4 18h16"/>'};return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+paths[k]+'</svg>';}
function nav(active){activeTab=active==='mist'?'rules':active;const items=[['today','⌂','Сегодня',showToday],['map','☷','Уроки',showMap],['words','▣','Слова',()=>showWords('today')],['tenses','◷','Времена',showTenses],['rules','≡','Справочник',showRules]];$('#nav').replaceChildren(...items.map(([k,ic,label,fn])=>h('button',{class:'nav-btn'+(k===activeTab?' on':''),'aria-current':k===activeTab?'page':null,onclick:()=>{session=null;fn();}},h('span',{class:'ni','aria-hidden':'true',html:navIcon(k)}),h('span',{class:'nl'},label))));$('#streak').textContent='Серия · '+streakDays();window.WordlyBridge?.updateBack();}
function showToday(){session=null;nav('today');const resume=S.resume&&nodeBy(S.resume.id);const next=resume||NODES.find(n=>n.lv.id===S.level&&!lessonStatus(n.key).completed)||NODES.find(n=>!lessonStatus(n.key).completed)||NODES[0];const due=dueIds().length,err=gDue().length;
 const lessons=NODES.filter(n=>n.k==='L');const completed=lessons.filter(n=>lessonStatus(n.key).completed).length,mastered=lessons.filter(n=>lessonStatus(n.key).mastered).length;
 setMain(h('div',{class:'page today'},h('div',{class:'eyebrow'},'АНГЛИЙСКИЙ В ВАШЕМ РИТМЕ'),h('h1',{},'Сегодня'),h('p',{class:'muted'},'Цель — '+S.set.goalMin+' минут. Выберите, с чего начать.'),h('div',{class:'daily-card'},h('small',{},resume?'ПРОДОЛЖИТЬ УРОК':'СЛЕДУЮЩИЙ УРОК'),h('h2',{},next.title),h('p',{},next.lv.t+' · слова и практика грамматики'),h('button',{class:'main-btn blue wide',onclick:()=>startNode(next)},resume?'Продолжить урок':'Начать урок'),h('p',{class:'daily-caption'},'Повторение слов и работа с ошибками — на ваш выбор.')),
 h('h2',{},'Ещё на сегодня'),h('div',{class:'today-links'},h('button',{class:'action-card',onclick:()=>due?startReview():showWords('today')},h('b',{},due?'Повторить слова':'Добавить новые слова'),h('span',{class:'muted'},due?due+' к повторению':'Выбрать тему или слова урока')),h('button',{class:'action-card',onclick:showMistakes},h('b',{},'Разобрать ошибки'),h('span',{class:'muted'},err?err+' на сегодня':S.mist.length?'Нет ошибок к повторению сегодня':'Пока нет сохранённых ошибок')),h('button',{class:'action-card',onclick:showMap},h('b',{},'Выбрать другой урок'),h('span',{class:'muted'},'Все уровни доступны')),swipeTodayLink()),goalEl(),h('div',{class:'stats'},h('div',{class:'stat'},h('small',{},'УРОКОВ ЗАВЕРШЕНО'),completed),h('div',{class:'stat'},h('small',{},'ОСВОЕНИЕ ПОДТВЕРЖДЕНО'),mastered))));}
function showMap(){session=null;nav('map');const lv=LV.find(l=>l.id===S.level)||LV[0];setMain(h('div',{class:'page'},h('div',{class:'eyebrow'},'КУРС · ЧЕТЫРЕ УРОВНЯ'),h('h1',{},'Уроки'),grammarLinkCard(),mediaLinkCard(),h('p',{class:'muted'},'Любой урок доступен сразу. «Завершён» означает, что вы дошли до конца; «Освоение подтверждено» — не меньше 70% верных ответов с первой попытки.'),h('div',{class:'level-tabs'},LV.map(l=>{const lessons=l.list.filter(n=>n.k==='L');return h('button',{class:'lvl'+(l===lv?' on':''),onclick:()=>{S.level=l.id;save();showMap();}},h('b',{},l.t),h('small',{},lessons.filter(n=>lessonStatus(n.key).completed).length+' / '+lessons.length+' завершено'),h('small',{class:'muted'},lessons.filter(n=>lessonStatus(n.key).mastered).length+' подтверждено'));})),h('h2',{},lv.t),h('div',{class:'lesson-list'},lv.list.map(n=>{const p=lessonStatus(n.key);return h('button',{class:'lesson-row'+(p.mastered?' done':p.completed?' completed':''),onclick:()=>startNode(n)},h('span',{class:'lesson-index','aria-hidden':'true'},p.mastered?'✓':n.k==='L'?n.num:n.k==='C'?'Т':'Д'),h('span',{},h('b',{},n.title),h('small',{class:'muted'},S.resume?.id===n.key?'Продолжить · шаг '+(S.resume.pos+1):lessonStatusText(n.key)||(n.k==='L'?n.d.w.length+' '+plural(n.d.w.length,'слово','слова','слов')+' · '+n.d.r.length+' '+plural(n.d.r.length,'правило','правила','правил'):n.k==='C'?'Проверка знаний':'Учебный диалог'))),h('span',{class:'muted','aria-hidden':'true'},'›'));}))));}
function showRules(){session=null;nav('rules');const search=h('input',{class:'search',placeholder:'Тема, правило или время…','aria-label':'Поиск правил'}),filter=h('select',{class:'sel','aria-label':'Уровень правил'},h('option',{value:''},'Все уровни'),LV.map(l=>h('option',{value:l.id},l.t))),list=h('div',{});function draw(){list.replaceChildren();LV.filter(l=>!filter.value||String(l.id)===filter.value).forEach(l=>{const found=l.list.filter(n=>n.k==='L'&&(n.title+' '+n.d.r.map(r=>SD.R[r].m).join(' ')).toLowerCase().includes(search.value.toLowerCase()));if(found.length)list.append(h('h2',{},l.t),...found.map(n=>h('details',{class:'rule-item'},h('summary',{},n.title),...n.d.r.map(r=>ruleBox(r)),h('button',{class:'tg',onclick:()=>startNode(n)},'Открыть урок'))));});}search.oninput=filter.onchange=draw;draw();setMain(h('div',{class:'page'},h('h1',{},'Справочник'),h('button',{class:'action-card wide',onclick:showMistakes},h('b',{},'Мои ошибки'),h('span',{class:'muted'},S.mist.length+' сохранено · '+gDue().length+' на сегодня')),h('details',{class:'rule-item'},h('summary',{},'Шпаргалка · 12 времён'),h('div',{class:'tgrid'},TS.T.map(t=>tenseCard(t)))),h('h2',{},'Правила курса'),h('div',{class:'row'},search,filter),list));}
function showMistakes(){session=null;nav('rules');const keys=S.mist.filter(k=>keyStep(k)),due=gDue().filter(k=>keyStep(k));const run=ks=>startSession({title:'Повторение ошибок',mistakes:true,back:showMistakes},ks.slice(0,20).map(keyStep));setMain(h('div',{class:'page'},h('button',{class:'tg',onclick:showRules},'← Справочник'),h('h1',{},'Мои ошибки'),h('p',{class:'muted'},'Сначала новая попытка. Решение — после ответа. Повторение через 1, 3 и 7 дней; новая ошибка возвращает к первому этапу.'),h('div',{class:'row'},h('button',{class:'main-btn blue',disabled:!due.length,onclick:()=>run(due)},'Повторить сегодня · '+due.length),h('button',{class:'tg',disabled:!keys.length,onclick:()=>run(keys)},'Повторить все')),h('div',{class:'mist-list'},keys.map(k=>{const st=keyStep(k),d=S.errorDetails[k];const prompt=st.sent||(typeof st.text==='string'?st.text:st.text?.t)||st.w?.ru||(st.toks?srcText(st.toks):st.g?plain(st.g.toks):'Сохранённое задание');return h('div',{class:'mist'},h('b',{},prompt.replace('___','…')),d?h('p',{class:'muted'},'Ваш ответ: '+d.user):null,h('small',{class:'muted'},'Повторение: '+new Date(S.gs[k]?.due||Date.now()).toLocaleDateString('ru-RU')),h('div',{class:'row'},h('button',{class:'tg',onclick:()=>run([k])},'Ответить заново'),st.rid?h('button',{class:'tg',onclick:()=>{nav('rules');setMain(h('div',{class:'page'},h('button',{class:'tg',onclick:showMistakes},'← Ошибки'),ruleBox(st.rid)));}},'Связанное правило'):st.tense?h('button',{class:'tg',onclick:()=>showTensePath(st.tense.k)},'Связанное время'):null));})),!keys.length?h('p',{class:'muted'},'Здесь появятся задания, которые стоит повторить.'):null));}
function downloadJSON(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=h('a',{href:url,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportProgress(){downloadJSON({format:'wordly-progress',version:3,courseId:COURSE_ID,exportedAt:new Date().toISOString(),state:S},'wordly-progress-'+today()+'.json');}
function validState(x){if(!x||Array.isArray(x)||typeof x!=='object')throw Error('Ожидается объект прогресса');for(const k of ['srs','stars','cards','set','gs','lessonProgress'])if(x[k]!=null&&(typeof x[k]!=='object'||Array.isArray(x[k])))throw Error('Неверное поле '+k);for(const k of ['days','mist','decks','sets'])if(x[k]!=null&&!Array.isArray(x[k]))throw Error('Неверное поле '+k);for(const e of Object.values(x.srs||{}))if(typeof e!=='object'||!Number.isFinite(e.due))throw Error('Неверный срок повторения');return x;}
function importProgress(){const input=h('input',{type:'file',accept:'.json'});input.onchange=async()=>{try{const text=await input.files[0].text();if(text.length>16e6)throw Error('Файл слишком большой');const json=JSON.parse(text),data=validState(json.format==='wordly-progress'?json.state:json);
if(data.courseId!==COURSE_ID){const cards=Object.entries(data.cards||{}).filter(([id,c])=>id.startsWith('u')&&typeof c.en==='string'&&typeof c.ru==='string');if(!cards.length)throw Error('Это другой курс. Его уроки и ошибки не переносятся. Можно импортировать собственные слова через CSV.');if(!confirm('В файле другой курс. Перенести только собственные слова? Старые уроки, ошибки и интервалы не будут импортированы.'))return;localStorage.setItem('wordly-backup-before-import',JSON.stringify(S));for(const [id,c] of cards){if(Object.values(S.cards).some(x=>sameWord(x,c))||ALLD.some(x=>sameWord(x,c)))continue;const nid='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);S.cards[nid]={en:c.en,ru:c.ru,tr:c.tr||'',ex:c.ex||'',exru:c.exru||'',deck:S.decks[0]?.id||''};srsAdd(nid,false);}save();showToday();toast('Собственные слова перенесены. Новый курс начинается отдельно.');return;}
if(!confirm('Заменить прогресс содержимым файла? Текущая копия будет сохранена локально.'))return;localStorage.setItem('wordly-backup-before-import',JSON.stringify(S));S={...S,...data,set:{...S.set,...data.set},courseId:COURSE_ID,wordlyVersion:2};S.grammar=S.grammar||{};S.mediaLibrary=S.mediaLibrary||[];S.wordEdits=S.wordEdits||{};S.cardFlags=S.cardFlags||{};S.reviewLog=S.reviewLog||[];S.errorDetails=S.errorDetails||{};S.lessonProgress=data.lessonProgress||{};ensureLessonProgress();save();applyTheme();showToday();toast('Прогресс импортирован.');}catch(e){toast('Импорт отменён: '+e.message);}};input.click();}
function showSettings(){session=null;nav('settings');const select=(key,label,values)=>h('label',{class:'setting-row'},h('span',{},label),h('select',{class:'sel',onchange:e=>{S.set[key]=['goalMin','newPer','revPer'].includes(key)?+e.target.value:e.target.value;save();applyTheme();}},values.map(([v,l])=>{const o=h('option',{value:v},l);o.selected=String(S.set[key])===String(v);return o;})));setMain(h('div',{class:'page narrow'},h('button',{class:'tg',onclick:showToday},'← Сегодня'),h('h1',{},'Настройки'),scheduleSettingsBlock(),mediaSettingsBlock(),h('h2',{},'Оформление и занятие'),select('theme','Оформление',[['telegram','Тема Telegram / системы'],['light','Светлая'],['dark','Тёмная'],['coffee','Кофейная'],['forest','Зелёная'],['cherry','Тёмная вишня'],['violet','Фиолетовая']]),select('highlight','Подсветка ролей слов',[['hint','По кнопке «Подсказка»'],['always','Постоянно'],['off','Отключена']]),h('div',{class:'legend'},Object.entries(TAGS).filter(([k,v])=>v).map(([k,v])=>h('span',{class:'chip c-'+k},v))),select('goalMin','Цель дня · минуты',[[5,'5'],[10,'10'],[15,'15'],[20,'20'],[30,'30']]),select('flipDir','Направление карточек',[['en','Английский → русский'],['ru','Русский → английский'],['both','Обе стороны'],['write','Ввод ответа']]),select('newPer','Новых слов за занятие',[[6,'6'],[10,'10'],[15,'15'],[20,'20'],[24,'24']]),select('revPer','Карточек за занятие повторения',[[10,'10'],[20,'20'],[30,'30'],[50,'50']]),h('p',{class:'muted'},Object.keys(SD.D).length+' словарных карточек, включая '+(SD.expressions||[]).length+' выражений. Аудио из Anki доступно у '+Object.keys(SD.audio||{}).length+' карточек. Переводы новых примеров могут быть автоматическими, их можно исправлять.'),imageCreditsBlock(),h('h2',{},'Сохранение и перенос'),h('p',{class:'muted',id:'sync-status'},window.WordlySync?.status||'Прогресс хранится на этом устройстве. Автоматическая синхронизация не подключена.'),h('div',{class:'row'},h('button',{class:'main-btn blue',onclick:exportProgress},'Экспорт прогресса'),h('button',{class:'tg',onclick:importProgress},'Импорт прогресса'),h('button',{class:'tg',onclick:()=>{const b=localStorage.getItem('wordly-backup-before-import');if(b)downloadJSON(JSON.parse(b),'wordly-before-import.json');else toast('Копии до импорта пока нет');}},'Копия до импорта'),window.WordlySync?.enabled?h('button',{class:'tg',onclick:()=>window.WordlySync.sync()},'Синхронизировать'):null),h('h2',{},'Без интернета'),h('p',{class:'muted'},'Локальная версия: распакуйте архив целиком и открывайте index.html рядом с папкой assets. Для сайта нужен весь архив. На HTTPS оболочка и просмотренные изображения кэшируются; офлайн-доступ к аудио гарантирован только при наличии файлов на устройстве. Запуск из Telegram без сети не гарантирован.'),h('details',{},h('summary',{},'О новом курсе'),h('p',{class:'muted'},'64 урока Wordly, 50 текстов, 6082 словарные карточки и 1632 импортированных грамматических задания. Аудио — из ваших файлов; видеоуроков в исходниках нет, для своих файлов есть медиатека. Планировщик Wordly — не FSRS. История Anki автоматически не переносилась.'))));}
// Consistent in-app and Telegram back navigation, including non-tab views.
const oldSetMain=setMain;setMain=function(el,sess){oldSetMain(el,sess);applyTheme();window.WordlyBridge?.updateBack();};
window.WordlyBridge={back(){if(session?.back){session.back();return;}const back=[...document.querySelectorAll('#main button')].find(b=>b.textContent.trim().startsWith('←'));if(back){back.click();return;}showToday();},updateBack(){const tg=window.Telegram?.WebApp;if(!tg)return;if(activeTab==='today'&&!session)tg.BackButton.hide();else tg.BackButton.show();}};

const sourceTenseCard=tenseCard;
const tenseDetails={
 PrS:'После does / doesn’t основной глагол стоит в начальной форме: does she work, не does she works. Глагол be образует вопрос и отрицание без do.',
 PrC:'am / is / are + форма на -ing. Глаголы состояния (know, understand, want) обычно не используются в Continuous; для временного поведения возможны исключения.',
 PaS:'После did / didn’t используется начальная форма: did she go, не did she went. Was / were не требуют did.',
 PaC:'was / were + форма на -ing. Процесс в прошлом может быть фоном для короткого события в Past Simple.',
 PrP:'have / has + третья форма. Смысл — связь с настоящим: результат, опыт или период, который ещё продолжается. Закончившийся конкретный момент обычно требует Past Simple.',
 PrPC:'have / has been + форма на -ing. Важна длительность или видимый сейчас результат процесса. Для глаголов состояния чаще нужен Present Perfect.',
 PaP:'had + третья форма. Есть две точки в прошлом: это действие произошло раньше второй. Не каждое упоминание прошлого требует Past Perfect.',
 PaPC:'had been + форма на -ing. Процесс длился до другой точки в прошлом. Сравните завершённый результат (Perfect) и длительность процесса.',
 FuS:'will + начальная форма. Это не единственный способ говорить о будущем: планы и договорённости также выражаются going to и Present Continuous.',
 FuC:'will be + форма на -ing. Представляем процесс в конкретный будущий момент, а не только факт будущего действия.',
 FuP:'will have + третья форма. К будущему моменту результат уже будет готов. В придаточных времени после when / by the time обычно не ставят will.',
 FuPC:'will have been + форма на -ing. Длительность измеряется до будущей точки отсчёта. Для состояний чаще используется Future Perfect.'};
tenseCard=function(t,compact){if(!t)return null;const example=TS.sentence(t,'aff',['she',3],TS.V[0],t.m.find(m=>!m.md||m.md.includes('aff'))||t.m[0]);return h('div',{class:'tcard'},h('div',{class:'tc-head'},h('b',{},t.en),h('span',{class:'muted'},t.ru)),h('p',{},t.use),timeline(t.tl),formulaEl({f:t.f[0]},true),h('p',{},sentenceEl(example.toks)),h('details',{},h('summary',{},'Подробнее · отрицание, вопрос, нюансы'),formulaEl({f:t.f[1]},true),formulaEl({f:t.f[2]},true),h('p',{},tenseDetails[t.k]),h('p',{class:'muted'},'Маркеры — ориентир, а не единственная причина выбора времени: '+t.mk)),legendEl(example.toks));};


const fullShowTenses=showTenses;showTenses=function(){fullShowTenses();const page=main().firstElementChild;const atlas=h('details',{class:'rule-item tense-atlas'},h('summary',{},'12 времён · сравнить на общей шкале'),h('p',{class:'muted'},'Везде одна ось: прошлое → сейчас → будущее. Точка — событие, полоса — процесс, ромб — точка отсчёта.'),h('div',{class:'timeline-atlas'},TS.T.map(t=>h('section',{class:'atlas-card'},h('h3',{},t.en),h('p',{class:'muted'},t.ru),timeline(t.tl),h('button',{class:'tg',onclick:()=>showTensePath(t.k)},'Изучить это время')))));const intro=page.querySelector(':scope > p');if(intro)intro.after(atlas);else page.prepend(atlas);const headings=[...page.querySelectorAll(':scope > h2')];const start=headings[2];if(start){const details=h('details',{class:'rule-item'},h('summary',{},'Дополнительные режимы и результаты'));let node=start;while(node){const next=node.nextSibling;details.append(node);node=next;}page.append(details);}};

const readingPreviousSetMain=setMain;setMain=function(el,sess){if(readingCleanup){const cleanup=readingCleanup;readingCleanup=null;cleanup();}readingPreviousSetMain(el,sess);};
const readingPreviousBack=window.WordlyBridge.back;window.WordlyBridge.back=function(){if(readingDialog){closeReadingDialog();return;}readingPreviousBack();};
document.addEventListener('keydown',e=>{if(!readingDialog)return;if(e.key==='Escape'){e.preventDefault();closeReadingDialog();return;}if(e.key==='Tab'){const items=[...readingDialog.el.querySelectorAll('button:not(:disabled),input,summary,a,select')].filter(el=>el.getClientRects().length);if(!items.length){e.preventDefault();return;}const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===readingDialog.el)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===readingDialog.el)){e.preventDefault();first.focus();}}});
window.addEventListener('pagehide',()=>{if(readingCleanup)readingCleanup();});

$('#settings-button').onclick=showSettings;

window.addEventListener('pagehide',()=>save());

document.addEventListener('keydown',e=>{if(session)session.key(e);});
window.addEventListener('DOMContentLoaded',()=>{applyTheme();showToday();});
if(!window.WORDLY_SINGLE&&/^https?:/.test(location.protocol)&&'serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
// Wordly scheduler: explicit learning steps + SM-2-like review intervals, not FSRS.
function learningDelays(key){const vals=String(S.set[key]||'').trim().split(/\s+/).map(t=>{const m=t.match(/^(\d+(?:\.\d+)?)(m|h|d)$/);return m?+m[1]*(m[2]==='m'?1:m[2]==='h'?60:1440):NaN;});return vals.length&&vals.every(x=>Number.isFinite(x)&&x>0)?vals:[10];}
function scheduleOutcome(e,g){e={...(e||{})};const stage=e.stage||(e.ivl>=1?'review':'learning'),learn=stage!=='review',steps=learningDelays(stage==='relearning'?'relearnSteps':'learnSteps'),index=Math.max(0,e.stepIndex||0),cap=Number(S.set.maxInterval)||3650,modifier=(Number(S.set.intervalPercent)||100)/100;let days=0,nextStage=stage,nextIndex=index,ivl=0;
 if(learn){if(g===1){days=steps[0]/1440;nextIndex=0;}else if(g===2){days=(steps[index]||steps.at(-1))/1440;if(index===0&&steps.length>1)days=(steps[0]+steps[1])/2880;}else if(g===4){days=Math.max(Number(S.set.easyInterval)||4,stage==='relearning'?(e.oldInterval||1)*.8:0);nextStage='review';nextIndex=0;}else if(index+1<steps.length){nextIndex=index+1;days=steps[nextIndex]/1440;}else{days=stage==='relearning'?Math.max(1,(e.oldInterval||1)*(Number(S.set.lapsePercent)||50)/100):(Number(S.set.graduateInterval)||1);nextStage='review';nextIndex=0;}}
 else{const i=Math.max(1,e.ivl||1);if(g===1){nextStage='relearning';nextIndex=0;days=learningDelays('relearnSteps')[0]/1440;}else{days=Math.max(i+1,i*(g===2?1.2:g===4?(e.ef||2.5)*1.3:(e.ef||2.5))*modifier);}}
 if(nextStage==='review'){days=Math.min(cap,Math.max(1,days));ivl=Math.round(days*10)/10;days=ivl;}return {days,stage:nextStage,stepIndex:nextIndex,ivl};}
function reviewLeftToday(){const d=S.reviewDay;return Math.max(0,(Number(S.set.reviewDayMax)||100)-(d?.d===today()?d.n:0));}
function isAvailable(id){const f=S.cardFlags?.[id];return !f?.suspended&&!(f?.buriedUntil&&f.buriedUntil>today());}
function orderedReviewIds(){let ids=dueIds();const scope=S.set.reviewScope||'all';if(scope==='expressions')ids=ids.filter(id=>SD.wordMeta?.[id]?.kind==='expression');if(scope==='words')ids=ids.filter(id=>SD.wordMeta?.[id]?.kind!=='expression');if(scope==='selected'){const allowed=new Set();S.sets.forEach(key=>setBy(typeof key==='number'?'t:'+key:key)?.ids().forEach(id=>allowed.add(String(id))));ids=ids.filter(id=>allowed.has(String(id)));}const order=S.set.reviewOrder||'due';if(order==='random')ids=shuffle(ids);else if(order==='hard')ids.sort((a,b)=>(S.srs[b].lapses||0)-(S.srs[a].lapses||0)||S.srs[a].due-S.srs[b].due);else ids.sort((a,b)=>S.srs[a].due-S.srs[b].due);const learning=ids.filter(id=>S.srs[id].stage==='relearning'||(S.srs[id].ivl||0)<1),introduced=learning.filter(id=>!(S.srs[id].reps>0)),ongoing=learning.filter(id=>S.srs[id].reps>0),reviews=ids.filter(id=>!learning.includes(id)).slice(0,reviewLeftToday());return [...ongoing,...introduced.slice(0,newLeftToday()),...reviews];}
function scheduleSettingsBlock(){const box=h('section',{class:'scheduler-settings'}),number=(key,label,min,max,help)=>{const inp=h('input',{class:'type-input',type:'number',min,max,value:S.set[key],'aria-label':label,onchange:()=>{const v=Math.round(Number(inp.value));if(!Number.isFinite(v)||v<min||v>max){inp.value=S.set[key];toast('Введите число от '+min+' до '+max);return;}S.set[key]=v;save();}});return h('label',{class:'setting-number'},h('span',{},label,help?h('small',{class:'muted'},help):null),inp);},select=(key,label,values)=>h('label',{class:'setting-row'},h('span',{},label),h('select',{class:'sel','aria-label':label,onchange:e=>{S.set[key]=e.target.value;save();}},values.map(([value,l])=>{const o=h('option',{value},l);o.selected=S.set[key]===value;return o;}))),steps=(key,label)=>{const i=h('input',{class:'type-input',value:S.set[key],'aria-label':label,onchange:()=>{if(!/^\d+(?:\.\d+)?[mhd](?:\s+\d+(?:\.\d+)?[mhd]){0,7}$/.test(i.value.trim())||i.value.trim().split(/\s+/).some(t=>parseFloat(t)<=0)){i.value=S.set[key];toast('Формат: 1m 10m. Допустимы минуты m, часы h, дни d.');return;}S.set[key]=i.value.trim();save();}});return h('label',{class:'setting-number'},h('span',{},label),i);};
 box.append(h('h2',{},'Повторения'),h('p',{class:'muted'},'Планировщик Wordly: шаги изучения и SM-2-подобные интервалы. Это не FSRS и не точная копия Anki. Изменения применяются к следующим оценкам, старые сроки не пересчитываются.'),h('div',{class:'preset-row'},[['Спокойно',5,50],['Обычно',10,100],['Интенсивно',20,200]].map(([name,n,r])=>h('button',{class:'tg',onclick:()=>{S.set.newDayMax=n;S.set.reviewDayMax=r;save();showSettings();}},h('b',{},name),h('small',{class:'muted'},n+' новых · '+r+' повторений')))),number('newDayMax','Новых карточек в день',0,200,'Отдельно от размера занятия'),number('reviewDayMax','Повторений в день',1,2000,'Лимит уникальных карточек закрепления; короткие шаги обучения не блокируются'),select('revMode','Как проверять память',[['cards','Карточки с самооценкой'],['mix','Карточки и тесты'],['test','Только тесты']]),select('newOrder','Порядок новых карточек',[['source','По порядку в наборе'],['random','Случайно']]),select('reviewOrder','Порядок повторений',[['due','Сначала раньше назначенные'],['hard','Сначала часто забываемые'],['random','Случайно']]),select('reviewScope','Какие карточки повторять',[['all','Все добавленные'],['selected','Из отмеченных наборов'],['words','Только слова'],['expressions','Только выражения']]),h('details',{class:'advanced-settings'},h('summary',{},'Дополнительно · интервалы и шаги'),h('p',{class:'muted'},'m — минуты, h — часы, d — дни. «Снова» возвращает к первому шагу; «Хорошо» двигает дальше. Не меняйте интервалы ради красивой статистики.'),steps('learnSteps','Шаги новых карточек'),steps('relearnSteps','Шаги после забывания'),number('graduateInterval','Интервал после изучения · дни',1,60),number('easyInterval','Интервал «Легко» для новых · дни',1,90),number('intervalPercent','Множитель интервала · %',50,200,'Меньше — чаще повторения'),number('lapsePercent','Интервал после восстановления · %',10,100),number('maxInterval','Максимальный интервал · дни',1,36500)),h('p',{class:'muted'},'«Снова» — не вспомнил; «Трудно» — вспомнил с усилием; «Хорошо» — вспомнил; «Легко» — вспомнил сразу. После просмотра подсказки лучше честно выбрать «Снова».'));return box;}
function definitionBlock(w){const m=SD.wordMeta?.[w.id];if(!m?.meaningEn&&!m?.extra)return null;return h('details',{class:'word-definition'},h('summary',{},'Значение и заметки'),m.meaningEn?h('p',{},m.meaningEn):null,m.meaningRu?h('p',{class:'muted'},m.meaningRu):null,m.extra?h('p',{class:'muted'},m.extra):null,h('small',{class:'muted'},'Источник: '+(m.sourceModel||'Anki')),(m.translationAuto||m.meaningAuto)&&!S.wordEdits?.[w.id]?.ru?h('p',{class:'auto-notice muted'},'Часть русских пояснений переведена автоматически. При необходимости исправьте карточку.'):null);}
function importedContext(w){const m=SD.wordMeta?.[w.id];if(!m)return null;const nodes=[];if(m.moreExamples?.length)nodes.push(h('details',{class:'ctx-box'},h('summary',{},'Ещё примеры'),m.moreExamples.map(c=>exampleBlock(c[0],c[1],null,c[2]))));if(m.dialogue)nodes.push(h('details',{class:'ctx-box'},h('summary',{},'Мини-диалог'),exampleBlock(m.dialogue[0],m.dialogue[1],null,true)));if(m.kind==='expression'&&m.caption)nodes.push(h('details',{class:'ctx-box'},h('summary',{},'Ситуация на картинке'),exampleBlock(m.caption[0],m.caption[1],null,true)));return nodes.length?h('div',{class:'imported-context'},nodes):null;}
function expressionList(){const ids=SD.expressions||[],query=h('input',{type:'search',class:'search',placeholder:'Выражение или значение…','aria-label':'Поиск выражений'}),filter=h('select',{class:'sel','aria-label':'Категория выражений'},h('option',{value:''},'Все выражения'),['Устойчивые сочетания','Фразовые глаголы','Разговорные выражения'].map(x=>h('option',{value:x},x))),list=h('div',{class:'vocab-list'}),counter=h('p',{class:'muted'});const draw=()=>{const q=query.value.toLowerCase().trim(),found=ids.map(D).filter(w=>(!filter.value||SD.wordMeta[w.id].category===filter.value)&&(!q||(w.en+' '+w.ru).toLowerCase().includes(q)));list.replaceChildren(...found.map(w=>vocabRow(w,()=>showWords('expressions'))));counter.textContent='Найдено '+found.length+' из '+ids.length;if(!found.length)list.append(h('p',{class:'muted'},'Не найдено. Попробуйте другое выражение.'));};query.oninput=filter.onchange=draw;draw();return h('section',{},h('h2',{},'Выражения'),h('p',{class:'muted'},'Учите сочетание целиком: значение, иллюстрация, примеры и мини-диалог. Здесь не только идиомы.'),h('div',{class:'expression-collections'},(SD.libraries||[]).filter(x=>x.key.startsWith('e:')).map(x=>h('button',{class:'action-card',onclick:()=>showSet(x.key)},h('b',{},x.title),h('span',{class:'muted'},x.ids.length+' выражений · открыть подборку')))),query,filter,counter,list);}
function editBuiltIn(id,back){nav('words');const w=D(id),fields={},form=h('div',{class:'page narrow'},h('button',{class:'tg',onclick:back},'← Назад'),h('h1',{},'Изменить карточку'),h('p',{class:'muted'},'Изменения сохраняются на этом устройстве и входят в экспорт прогресса. Исходная карточка и её интервал не удаляются.'));for(const [k,label] of [['en','Слово или выражение'],['ru','Русское значение'],['tr','Транскрипция'],['exen','Пример на английском'],['exru','Перевод примера']]){const i=h(k.startsWith('ex')?'textarea':'input',{class:'type-input',rows:3,'aria-label':label});i.value=w[k]||'';fields[k]=i;form.append(h('label',{class:'frm'},h('span',{},label),i));}form.append(h('div',{class:'row'},h('button',{class:'main-btn blue',onclick:()=>{if(!fields.en.value.trim()||!fields.ru.value.trim()){toast('Заполните слово и значение');return;}S.wordEdits[id]=Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value.trim()]));save();showWord(id,back);}},'Сохранить изменения'),h('button',{class:'tg',onclick:()=>{if(confirm('Восстановить исходный текст? Интервал повторения сохранится.')){delete S.wordEdits[id];save();showWord(id,back);}}},'Исходный текст')));setMain(form);}
function cardManagement(w,back){const id=w.id,f=S.cardFlags[id]||{};const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};return h('details',{class:'card-management'},h('summary',{},'Управление карточкой'),!w.user?h('button',{class:'tg',onclick:()=>editBuiltIn(id,back)},'Редактировать карточку'):null,h('button',{class:'tg',onclick:()=>{S.cardFlags[id]={...f,suspended:!f.suspended};save();showWord(id,back);}},f.suspended?'Вернуть в повторение':'Приостановить'),h('button',{class:'tg',onclick:()=>{S.cardFlags[id]={...f,buriedUntil:f.buriedUntil>today()?null:tomorrow()};save();showWord(id,back);}},f.buriedUntil>today()?'Вернуть сегодня':'Отложить до завтра'),f.suspended?h('p',{class:'muted'},'Приостановлена: не появляется в новых словах и повторениях. Прогресс сохранён.'):null,f.buriedUntil>today()?h('p',{class:'muted'},'Отложена до завтра.'):null,(S.srs[id]?.lapses||0)>=8?h('p',{class:'muted'},'Карточка часто забывается. Попробуйте другой пример или уточните значение.'):null);}
function libraryVocabularyList(ws,back){const search=h('input',{class:'search',type:'search',placeholder:'Поиск внутри набора…','aria-label':'Поиск внутри набора'}),list=h('div',{class:'vocab-list'}),count=h('p',{class:'muted'}),more=h('button',{class:'tg wide'},'Показать ещё 40');let limit=40;const draw=()=>{const q=search.value.toLowerCase().trim(),matches=ws.filter(w=>!q||(w.en+' '+w.ru).toLowerCase().includes(q));list.replaceChildren(...matches.slice(0,limit).map(w=>vocabRow(w,back)));count.textContent='Показано '+Math.min(limit,matches.length)+' из '+matches.length;more.hidden=matches.length<=limit;if(!matches.length)list.append(h('p',{class:'muted'},'Не найдено.'));};search.oninput=()=>{limit=40;draw();};more.onclick=()=>{limit+=40;draw();};draw();return h('div',{},search,count,list,more);}

function startListening(){const all=ALLD.filter(w=>w.sound&&isAvailable(w.id));const mine=all.filter(w=>S.srs[w.id]);const pool=mine.length>=4?mine:all;const steps=shuffle(pool).slice(0,10).map(w=>({type:'wlisten',w}));if(!steps.length){toast('Нет доступных записей.');return;}startSession({title:'Аудирование · практика слов',doneTitle:'Аудирование завершено',back:()=>showWords('today'),again:startListening},steps);}
// Stage 2: imported grammar, source recordings and a personal media player.
S.grammar=S.grammar&&typeof S.grammar==='object'&&!Array.isArray(S.grammar)?S.grammar:{};
S.mediaLibrary=Array.isArray(S.mediaLibrary)?S.mediaLibrary:[];
let currentAudio=null,grammarSearch='',grammarSource='all',grammarFilter='all';
const grammarData=window.WORDLY_GRAMMAR||[];
const GINDEX=new Map(grammarData.map(g=>[g.id,g]));
const GNAMES=['Grammar · Exercises','Grammar · Activities','Advanced Grammar'];
function stopMedia(){if(currentAudio){currentAudio.pause();currentAudio=null;}document.querySelectorAll('audio,video').forEach(el=>el.pause());if('speechSynthesis' in window)speechSynthesis.cancel();}
function play(source,button){if(!source)return;stopMedia();const a=new Audio(source);currentAudio=a;a.playbackRate=Number(S.set.speechRate)||1;if(button){button.setAttribute('aria-busy','true');button.disabled=true;}const finish=()=>{if(button){button.removeAttribute('aria-busy');button.disabled=false;}};a.onended=finish;a.onerror=()=>{finish();toast('Не удалось открыть аудио. Для HTML сохраните рядом папку assets; на сайте проверьте соединение.');};a.play().then(finish).catch(()=>{finish();toast('Аудио недоступно. Проверьте папку assets или попробуйте ещё раз.');});return a;}
function voice(source){if(S.set.voice&&source)play(source);}
function spk(source,big){return source?h('button',{type:'button',class:'tg audio-speak'+(big?' large':''),'aria-label':'Прослушать слово',title:'Запись из Anki',onclick:e=>{e.stopPropagation();play(source,e.currentTarget);}},'▶',big?' Слушать':''):null;}
function sourceAudio(source,label){const status=h('span',{class:'muted small',role:'status'}),a=h('audio',{controls:true,preload:'none',src:source,'aria-label':label});a.onplay=()=>{if(currentAudio&&currentAudio!==a)currentAudio.pause();currentAudio=a;a.playbackRate=Number(S.set.speechRate)||1;};a.onerror=()=>{status.textContent='Аудио недоступно. Проверьте папку assets или соединение.';};return h('div',{class:'audio-track'},h('span',{class:'muted small'},label),a,status);}
function audioMaterials(w){const a=SD.audio?.[w.id],m=SD.wordMeta?.[w.id];const panel=h('details',{class:'word-audio'},h('summary',{},'Аудиоматериалы'));
 if(S.wordEdits?.[w.id]?.en&&SD.D[w.id]?.[0]&&cleanW(w.en)!==cleanW(SD.D[w.id][0]))panel.append(h('p',{class:'muted small'},'Записи относятся к исходному слову: '+SD.D[w.id][0]+'.'));
 if(a){const names={word:'Слово / выражение',meaning:'Значение на английском',example:'Пример из Anki',example2:'Ещё один пример',dialogue:'Мини-диалог',caption:'Подпись к иллюстрации'};Object.entries(names).forEach(([role,label])=>{(a[role]||[]).forEach(src=>{if(role==='example'&&(a.sourceExampleDifferent||S.wordEdits?.[w.id]?.exen))panel.append(h('p',{class:'muted small'},'Запись исходного примера; текст карточки был изменён.',a.sourceExample?h('span',{class:'source-example'},a.sourceExample):null));panel.append(sourceAudio(src,label));});});}
 if(!a?.word?.length){const supported='speechSynthesis' in window;panel.append(h('p',{class:'muted small'},'В исходных файлах нет записи этого слова.'),supported?h('button',{class:'tg',onclick:()=>{stopMedia();const u=new SpeechSynthesisUtterance(w.en);u.lang='en-US';u.rate=Number(S.set.speechRate)||1;const v=speechSynthesis.getVoices().find(v=>/^en[-_]/i.test(v.lang));if(v)u.voice=v;u.onerror=()=>toast('Системная озвучка недоступна на этом устройстве.');speechSynthesis.speak(u);}},'Системная озвучка · не запись Anki'):null);}
 return panel;
}
function grammarProgress(g){return S.grammar[g.id]||{};}
function grammarDue(g){const p=grammarProgress(g);return p.lastCorrect===false||!!(p.due&&p.due<=Date.now());}
function grammarInstruction(g){return g.mode==='choice'?(g.multi?'Выберите все верные варианты.':'Выберите один верный вариант.'):'Заполните каждый пропуск. Сокращённые и полные формы принимаются, если они есть в ключе.';}
function grammarAnswerText(g){return g.answers.map((a,i)=>(g.answers.length>1?(i+1)+'. ':'')+a.join(' / ')).join('\n');}
function grammarAnswerSentence(g){return g.parts.map(p=>typeof p==='string'?p:esc(g.answers[p.gap][0])).join('');}
function grammarUnitKey(g){return g.source+'::'+g.unit;}
function prioritiseGrammar(list){return list.slice().sort((a,b)=>{const pa=grammarProgress(a),pb=grammarProgress(b);return Number(!!pa.attempts)-Number(!!pb.attempts)||Number(grammarDue(b))-Number(grammarDue(a))||(pa.lastAt||0)-(pb.lastAt||0);});}
function grammarLinkCard(){return h('button',{class:'action-card wide grammar-entry',onclick:showGrammar},h('b',{},'Грамматика · практика из Anki'),h('span',{class:'muted'},grammarData.length+' заданий · пропуски, выбор ответа и повторение ошибок'));}
function mediaLinkCard(){return h('button',{class:'action-card wide',onclick:showMediaLibrary},h('b',{},'Медиатека · своё видео и аудио'),h('span',{class:'muted'},'Открыть файл или прямую ссылку · без загрузки на сервер'));}
function showGrammar(){stopMedia();session=null;nav('map');const page=h('div',{class:'page'},h('button',{class:'tg',onclick:showMap},'← Уроки'),h('h1',{},'Грамматика'),h('p',{class:'muted'},grammarData.length+' заданий из ваших Anki-колод. Это импортированные разделы, а не полные учебники.'),h('p',{class:'muted small'},'Упражнения и Activities: времена и основные конструкции; Advanced: углублённая практика времён. Точный уровень CEFR источником не указан.'));
 const search=h('input',{class:'search',type:'search',placeholder:'Найти тему: perfect, future, past…','aria-label':'Поиск грамматической темы'});search.value=grammarSearch;
 const source=h('select',{class:'sel','aria-label':'Источник грамматики'},h('option',{value:'all'},'Все источники'),GNAMES.map((n,i)=>h('option',{value:i},n)));source.value=grammarSource;
 const filter=h('select',{class:'sel','aria-label':'Отбор упражнений'},[['all','Все задания'],['new','Не пройдены'],['errors','Последние ошибки'],['due','Пора повторить']].map(([v,l])=>h('option',{value:v},l)));filter.value=grammarFilter;
 const size=h('select',{class:'sel','aria-label':'Заданий в тренировке'},[5,10,15,20].map(n=>h('option',{value:n},n+' заданий')));size.value=String(S.set.grammarPer||10);size.onchange=()=>{S.set.grammarPer=+size.value;save();};
 const count=h('p',{class:'muted',role:'status'}),list=h('div',{class:'grammar-units'}),mix=h('button',{class:'main-btn blue'},'Начать смешанную тренировку');let found=[];
 const draw=()=>{grammarSearch=search.value;grammarSource=source.value;grammarFilter=filter.value;const q=search.value.toLowerCase().trim();found=grammarData.filter(g=>{const p=grammarProgress(g);return (source.value==='all'||String(g.source)===source.value)&&(!q||(g.unit+' '+g.category+' '+g.rubric).toLowerCase().includes(q))&&(filter.value==='all'||filter.value==='new'&&!p.attempts||filter.value==='errors'&&p.lastCorrect===false||filter.value==='due'&&grammarDue(g));});count.textContent='По фильтру: '+found.length+' · пройдено: '+grammarData.filter(g=>grammarProgress(g).attempts).length+' · к повторению: '+grammarData.filter(grammarDue).length;mix.disabled=!found.length;
 const units=new Map();found.forEach(g=>{const key=grammarUnitKey(g);if(!units.has(key))units.set(key,[]);units.get(key).push(g);});list.replaceChildren();for(const a of units.values()){const g=a[0],done=a.filter(x=>grammarProgress(x).attempts).length;list.append(h('button',{class:'action-card wide',onclick:()=>startGrammar(prioritiseGrammar(a).map(x=>x.id),g.unit)},h('b',{},g.unit),h('span',{class:'muted'},GNAMES[g.source]+' · '+g.category),h('span',{class:'muted small'},a.length+' заданий · пройдено '+done)));}if(!found.length)list.append(h('p',{class:'muted'},'Нет заданий по этому фильтру.'));};
 search.oninput=source.onchange=filter.onchange=draw;mix.onclick=()=>startGrammar(prioritiseGrammar(shuffle(found)).map(g=>g.id),'Смешанная практика');
 page.append(S.grammarResume?.ids?.length?h('button',{class:'main-btn green wide',onclick:()=>startGrammar(null,null,true)},S.grammarResume.answered&&S.grammarResume.pos===S.grammarResume.ids.length-1?'Показать итог тренировки':'Продолжить тренировку · '+((S.grammarResume.pos||0)+1)+' / '+S.grammarResume.ids.length):null,h('div',{class:'row'},source,filter),search,h('div',{class:'row'},size,mix),count,h('p',{class:'muted small'},'Сначала предлагаются непройденные задания темы, затем повторения. Фильтры позволяют выбрать только ошибки или новые.'),list,h('details',{class:'rule-item'},h('summary',{},'Как сохраняется результат'),h('p',{class:'muted'},'Проверка по ключам исходных карточек. Просмотр решения не считается верным ответом. Ошибки можно повторить сразу; после успешного исправления они назначаются через 1, 3 и 7 дней. Это отдельная практика, не FSRS и не перенос расписания Anki. Часть аудиозаписей содержит готовые ответы.')));draw();setMain(page);
}
function grammarCheck(g,values){if(g.mode==='choice'){const selected=new Set(values);return selected.size===g.correct.length&&g.correct.every(v=>selected.has(v));}return values.length===g.answers.length&&g.answers.every((alts,i)=>matches(String(values[i]||''),alts));}
function grammarRecord(g,ok,reveal,answer){const p=grammarProgress(g);const elapsed=Math.min(300,Math.max(0,(Date.now()-(g._openedAt||Date.now()))/1000));S.time[today()]=(S.time[today()]||0)+elapsed;const wasError=p.lastCorrect===false||p.hadError;const stage=ok?Math.min(3,(p.repeatStage||0)+1):0;S.grammar[g.id]={...p,attempts:(p.attempts||0)+1,correct:(p.correct||0)+(ok?1:0),lastCorrect:ok,lastAt:Date.now(),lastAnswer:answer,revealed:!!reveal,hadError:wasError||!ok,repeatStage:stage,due:Date.now()+(ok?[1,3,7][Math.max(0,stage-1)]*864e5:0)};save();}
function startGrammar(ids,title,resume){stopMedia();markDay();let state;if(resume&&S.grammarResume)state=S.grammarResume;else{const limit=S.set.grammarPer||10;state={ids:(ids||grammarData.map(g=>g.id)).filter(id=>GINDEX.has(id)).slice(0,limit),pos:0,ok:0,revealed:0,title:title||'Грамматическая практика',started:Date.now()};S.grammarResume=state;save();}if(!state.ids.length){toast('Нет заданий для тренировки.');return;}nav('map');const root=h('div',{class:'session grammar-session'}),bar=h('div',{class:'progress'},h('i')),counter=h('span',{class:'grammar-counter muted small'}),exit=h('button',{class:'icon-btn','aria-label':'Выйти и сохранить тренировку',onclick:()=>{stopMedia();session=null;save();showGrammar();}},'×');root.append(h('div',{class:'session-top'},exit,bar,counter));const body=h('div',{class:'session-body'}),foot=h('div',{class:'session-foot'});root.append(body,foot);setMain(root,true);let answered=false,inputs=[],selected=new Set(),g,submit;
 const close=()=>exit.click();session={back:close,key:e=>{if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&submit&&!submit.disabled&&!(e.target.tagName==='BUTTON'&&e.target!==submit)){e.preventDefault();submit.click();}}};
 function finish(){stopMedia();session=null;delete S.grammarResume;save();nav('map');const errors=state.ids.filter(id=>grammarProgress(GINDEX.get(id)).lastCorrect===false);setMain(h('div',{class:'page narrow grammar-finish'},h('div',{class:'big-emoji','aria-hidden':'true'},state.ok===state.ids.length?'✓':'→'),h('h1',{},'Практика завершена'),h('p',{class:'muted'},'Верно: '+state.ok+' из '+state.ids.length+'. Просмотренных решений: '+state.revealed+'.'),h('p',{class:'muted'},errors.length?'Ошибки сохранены. Их можно разобрать сейчас или вернуться позже.':'Можно выбрать следующую тему или вернуться к словам.'),h('div',{class:'row'},errors.length?h('button',{class:'main-btn blue',onclick:()=>startGrammar(errors,'Работа над ошибками')},'Повторить ошибки'):null,h('button',{class:'tg',onclick:showGrammar},'К темам'),h('button',{class:'tg',onclick:()=>startGrammar(shuffle(state.ids),state.title)},'Пройти ещё раз'))));}
 function draw(){if(state.pos>=state.ids.length)return finish();g=GINDEX.get(state.ids[state.pos]);g._openedAt=Date.now();answered=false;inputs=[];selected=new Set();stopMedia();bar.firstChild.style.width=(state.pos/state.ids.length*100)+'%';counter.textContent=(state.pos+1)+' / '+state.ids.length;body.replaceChildren();foot.replaceChildren();const instruction=h('div',{class:'grammar-instructions'},h('div',{class:'eyebrow'},GNAMES[g.source]),h('h2',{},g.unit),h('p',{class:'muted'},grammarInstruction(g)),h('p',{class:'grammar-rubric'},g.rubric));
 const prompt=h('div',{class:'grammar-prompt'});for(const part of g.parts){if(typeof part==='string')prompt.append(h('span',{html:part}));else if(g.mode==='choice')prompt.append(h('span',{class:'blank grammar-gap'},'…'));else{const input=h('input',{type:'text',class:'grammar-input','aria-label':'Пропуск '+(part.gap+1),autocomplete:'off',spellcheck:'false',autocapitalize:'off',placeholder:String(part.gap+1)});inputs[part.gap]=input;prompt.append(input);}}
 const optionbox=h('div',{class:'options col'});if(g.mode==='choice'){shuffle(g.options).forEach(v=>{const b=h('button',{class:'opt','aria-pressed':'false',onclick:()=>{if(answered)return;if(selected.has(v))selected.delete(v);else{if(!g.multi)selected.clear();selected.add(v);}for(const el of optionbox.children){const on=selected.has(el.dataset.value);el.classList.toggle('selected',on);el.setAttribute('aria-pressed',String(on));}submit.disabled=!selected.size;},'data-value':v},v);optionbox.append(b);});}
 const listening=/\blisten\b/i.test(g.rubric);const support=h('div',{class:'grammar-support'});if(g.options.length&&g.mode==='type')support.append(h('details',{class:'rule-item'},h('summary',{},'Слова и варианты из источника'),h('p',{class:'grammar-bank'},g.options.join(' · '))));if(g.audio?.task?.length)support.append(h('details',{class:'rule-item',open:listening},h('summary',{},listening?'Аудиозапись задания':'Аудиозапись · может содержать ответ'),h('p',{class:'muted small'},listening?'Сначала прослушайте запись, затем ответьте. Расшифровку можно открыть отдельно.':'Для проверки без подсказки сначала ответьте. Запись может содержать готовую форму ответа.'),...g.audio.task.map(s=>sourceAudio(s,'Запись задания')),g.transcript?h('details',{},h('summary',{},'Расшифровка'),h('p',{class:'source-example'},g.transcript)):null));
 body.append(instruction,...g.images.filter(Boolean).map(src=>h('img',{src,class:'grammar-image',alt:'Иллюстрация к упражнению',loading:'lazy'})),prompt,optionbox,support);
 const status=h('div',{class:'grammar-feedback',role:'status',hidden:true});submit=h('button',{class:'main-btn blue wide',disabled:true},'Проверить');const reveal=h('button',{class:'tg',onclick:()=>answer(true)},'Показать ответ');const ready=()=>submit.disabled=!inputs.every(i=>i.value.trim());inputs.forEach(i=>i.oninput=ready);submit.onclick=()=>answered?next():answer(false);foot.append(status,h('div',{class:'row'},reveal),submit);
 function answer(show){if(answered)return;answered=true;const values=g.mode==='choice'?[...selected]:inputs.map(x=>x.value);const ok=!show&&grammarCheck(g,values);if(ok)state.ok++;if(show)state.revealed++;grammarRecord(g,ok,show,values);state.answered=true;save();inputs.forEach(i=>i.disabled=true);for(const b of optionbox.children){b.disabled=true;const correct=g.correct.includes(b.dataset.value);b.classList.toggle('ok',correct);b.classList.toggle('bad',selected.has(b.dataset.value)&&!correct);if(correct)b.append(' ✓');}prompt.querySelectorAll('.grammar-gap').forEach(el=>el.textContent=g.answers[0][0]);status.hidden=false;status.className='grammar-feedback '+(ok?'ok':'bad');status.replaceChildren(h('b',{},ok?'Верно':'Разбор ответа'),h('div',{class:'grammar-solution',html:grammarAnswerSentence(g)}),h('p',{class:'source-example muted'},'Принимаемые ответы:\n'+grammarAnswerText(g)),h('p',{class:'muted small'},show?'Решение просмотрено; ответ не засчитан как верный.':ok?'Результат сохранён.':'Ошибка сохранена для повторения. Сравните форму и время с ключом.'));reveal.hidden=true;submit.textContent=state.pos===state.ids.length-1?'Завершить':'Далее';submit.disabled=false;status.scrollIntoView({block:'nearest',behavior:'auto'});}
 function next(){state.pos++;delete state.answered;save();draw();}
 }
 // A reload after a checked answer resumes at the next exercise, not as a second scored attempt.
 if(state.answered){state.pos++;delete state.answered;save();}draw();
}
let localMediaURL=null;
function showMediaLibrary(){stopMedia();session=null;nav('map');if(localMediaURL){URL.revokeObjectURL(localMediaURL);localMediaURL=null;}const page=h('div',{class:'page narrow'},h('button',{class:'tg',onclick:showMap},'← Уроки'),h('h1',{},'Медиатека'),h('p',{class:'muted'},'В ваших Anki-файлах есть аудио, но нет видеоуроков. Здесь можно открыть своё видео или аудио.'),h('p',{class:'muted small'},'Файлы не загружаются на сервер. Локальный файл нужно выбирать заново после закрытия страницы. Прогресс просмотра сохраняется на этом устройстве.'));
 const playerbox=h('div',{class:'media-player-box'}),file=h('input',{type:'file',accept:'video/*,audio/*','aria-label':'Выберите видео или аудио'}),url=h('input',{class:'search',type:'url',placeholder:'https://…/lesson.mp4','aria-label':'Прямая ссылка на медиа'}),msg=h('p',{class:'muted small',role:'status'}),saved=h('div',{class:'media-saved'});
 function openMedia(src,label,key,kind){stopMedia();const video=kind==='audio'?h('audio',{controls:true,preload:'metadata',src}):h('video',{controls:true,playsinline:true,preload:'metadata',src});video.className='personal-player';let last=0;video.onloadedmetadata=()=>{const time=S.mediaPositions?.[key]||0;if(time>0&&time<video.duration)video.currentTime=time;};video.ontimeupdate=()=>{if(Date.now()-last<5000)return;last=Date.now();S.mediaPositions=S.mediaPositions||{};S.mediaPositions[key]=video.currentTime;save();};video.onpause=()=>{S.mediaPositions=S.mediaPositions||{};S.mediaPositions[key]=video.currentTime;save();};video.onerror=()=>msg.textContent='Не удалось воспроизвести файл. Нужна прямая ссылка на поддерживаемый MP4/WebM/аудиофайл, не страница YouTube. H.264 + AAC обычно подходят для Telegram.';playerbox.replaceChildren(h('h2',{},label),video);msg.textContent='Автозапуск отключён — нажмите воспроизведение.';playerbox.scrollIntoView({block:'start',behavior:'auto'});}
 file.onchange=()=>{const f=file.files?.[0];if(!f)return;if(localMediaURL)URL.revokeObjectURL(localMediaURL);localMediaURL=URL.createObjectURL(f);openMedia(localMediaURL,f.name,'file:'+f.name+':'+f.size,f.type.startsWith('audio/')?'audio':'video');};
 function drawSaved(){saved.replaceChildren(...S.mediaLibrary.map((item,i)=>h('div',{class:'media-saved-row'},h('button',{class:'tg',onclick:()=>openMedia(item.url,item.title,item.url,item.kind)},item.title),h('button',{class:'tg','aria-label':'Удалить ссылку '+item.title,onclick:()=>{S.mediaLibrary.splice(i,1);save();drawSaved();}},'Удалить'))));}
 const open=h('button',{class:'main-btn blue',onclick:()=>{try{const u=new URL(url.value);if(u.protocol!=='https:')throw Error();if(!/\.(mp4|webm|m4v|mp3|m4a|ogg|wav)(?:$|\?)/i.test(u.href)){msg.textContent='Нужна прямая HTTPS-ссылка на MP4/WebM или аудиофайл, не ссылка на страницу.';return;}const kind=/\.(mp3|m4a|ogg|wav)(?:$|\?)/i.test(u.href)?'audio':'video';const title=decodeURIComponent(u.pathname.split('/').pop()||'Медиа');if(!S.mediaLibrary.some(x=>x.url===u.href)){S.mediaLibrary.push({url:u.href,title,kind});save();drawSaved();}openMedia(u.href,title,u.href,kind);}catch{msg.textContent='Введите корректную HTTPS-ссылку.';}}},'Открыть и сохранить ссылку');
 drawSaved();page.append(h('h2',{},'Файл с устройства'),file,h('h2',{},'Прямая ссылка'),url,open,msg,playerbox,h('h2',{},'Сохранённые ссылки'),saved,h('details',{class:'rule-item'},h('summary',{},'О видео и приватности'),h('p',{class:'muted'},'Ссылки сохраняются в прогрессе и попадают в его экспорт. Не добавляйте секретные ссылки. Воспроизведение зависит от формата и разрешений сервера. Внешние ссылки требуют интернета. Telegram и обычный браузер не синхронизируют локальный прогресс автоматически.')));setMain(page);
}
function mediaSettingsBlock(){const auto=h('input',{type:'checkbox','aria-label':'Автоматически проигрывать запись слова'});auto.checked=!!S.set.voice;auto.onchange=()=>{S.set.voice=auto.checked;save();};const speed=h('select',{class:'sel','aria-label':'Скорость аудио'},[0.75,1,1.25,1.5].map(v=>h('option',{value:v},v+'×')));speed.value=String(S.set.speechRate||1);speed.onchange=()=>{S.set.speechRate=+speed.value;if(currentAudio)currentAudio.playbackRate=+speed.value;save();};return h('div',{class:'media-settings'},h('h2',{},'Аудио и видео'),h('label',{class:'chk'},auto,' Автоматически проигрывать запись слова'),h('label',{class:'setting-row'},h('span',{},'Скорость аудио'),speed),h('p',{class:'muted small'},'Первый запуск звука может требовать нажатия. Записи не генерируются: используются файлы Anki. Если записи слова нет, доступна отдельная системная озвучка. Видео — только ваши файлы или ссылки.'),h('button',{class:'tg',onclick:showMediaLibrary},'Открыть медиатеку'));}
window.addEventListener('pagehide',stopMedia);

// Wordly swipe mode. A new UI over the existing scheduler; no DuoCards code or assets.
let swipeCleanup=null;
function swipeState(){if(!S.swipe||typeof S.swipe!=='object'||Array.isArray(S.swipe))S.swipe={};if(!S.swipe.runs||typeof S.swipe.runs!=='object')S.swipe.runs={};S.swipe.direction=S.swipe.direction==='ru'?'ru':'en';return S.swipe;}
function swipeSetOn(key){return S.sets.includes(key)||key.startsWith('t:')&&S.sets.includes(+key.slice(2));}
function swipeEnsureSet(key){if(key!=='mine'&&!swipeSetOn(key))S.sets.push(key);swipeState().activeKey=key;save();}
function swipeSig(w){const n=v=>String(v||'').normalize('NFC').replace(/’/g,"'").toLowerCase().replace(/\s+/g,' ').trim();return n(w.en)+'|'+n(w.ru);}
function swipeCanonicalMap(){const out=new Map();for(const k of Object.keys(S.srs)){const w=D(idOf(k));if(w&&!out.has(swipeSig(w)))out.set(swipeSig(w),idOf(k));}return out;}
function swipeSetIDs(key){const st=setBy(key);if(!st)return [];const canonical=swipeCanonicalMap(),ids=[],seen=new Set();for(let id of st.ids()){const w=D(id);if(!w)continue;id=canonical.get(swipeSig(w))??id;const sig=String(id);if(!seen.has(sig)){seen.add(sig);ids.push(id);}}return ids;}
function swipeCanRate(id){if(!D(id)||!isAvailable(id))return 'unavailable';const e=srsGet(id);if(!e||!(e.reps>0))return newLeftToday()>0?'ready':'newLimit';if(e.due>now())return 'future';if(e.stage==='relearning'||(e.ivl||0)<1)return 'ready';return reviewLeftToday()>0?'ready':'reviewLimit';}
function swipePool(key){let ids=swipeSetIDs(key).filter(isAvailable),fresh=[],review=[],waiting=[];for(const id of ids){const e=srsGet(id);if(!e||!(e.reps>0))fresh.push(id);else if(e.due<=now())review.push(id);else waiting.push(id);}if(S.set.newOrder==='random')fresh=shuffle(fresh);if(S.set.reviewOrder==='random')review=shuffle(review);else review.sort((a,b)=>S.set.reviewOrder==='hard'?(S.srs[b].lapses||0)-(S.srs[a].lapses||0)||S.srs[a].due-S.srs[b].due:S.srs[a].due-S.srs[b].due);
 // Daily limits apply to first ratings and mature reviews, not short learning steps.
 const learning=review.filter(id=>S.srs[id].stage==='relearning'||(S.srs[id].ivl||0)<1),mature=review.filter(id=>!learning.includes(id)).slice(0,reviewLeftToday());const due=[...learning,...mature].slice(0,Math.max(1,Number(S.set.revPer)||20));return {ids:[...due,...fresh.slice(0,Math.min(Number(S.set.newPer)||10,newLeftToday()))],fresh,review,waiting,all:ids};}
function swipeRunKey(key,mode){return mode+'|'+key;}
function swipePending(key){const r=swipeState().runs[swipeRunKey(key,'planned')];return r&&!r.finished&&r.queue?.length?r:null;}
function swipeResumeMode(key){const ss=swipeState(),r=ss.runs[swipeRunKey(key,'free')];return ss.activeKey===key&&ss.activeMode==='free'&&r&&!r.finished&&r.queue?.length?'free':'planned';}
function swipeNextAt(key){const times=swipeSetIDs(key).map(srsGet).filter(e=>e?.reps>0&&e.due>now()).map(e=>e.due);return times.length?Math.min(...times):null;}
function swipeWhen(time){if(!time)return '';const dt=time-now();return dt<=0?'сейчас':dt<DAY?'через '+fmtIvl(dt/DAY):new Date(time).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}
function swipeTodayLink(){const key=swipeState().activeKey,st=key&&setBy(key);return st?h('button',{class:'action-card swipe-today',onclick:()=>openSwipeSet(key,swipeResumeMode(key))},h('b',{},'Продолжить слова'),h('span',{class:'muted'},'Учу: '+st.title)):null;}
function swipeHub(){const ss=swipeState(),active=ss.activeKey&&setBy(ss.activeKey),box=h('section',{class:'swipe-hub'});box.append(h('p',{class:'muted'},'Выберите набор и учите карточками. Вправо — знаю, влево — пока не знаю.'));
 if(active){const p=swipePool(active.key),mode=swipeResumeMode(active.key),r=mode==='free'?ss.runs[swipeRunKey(active.key,mode)]:swipePending(active.key),next=swipeNextAt(active.key);box.append(h('div',{class:'swipe-hero'},h('div',{class:'eyebrow'},'СЕЙЧАС УЧУ'),h('h2',{},active.title),h('p',{class:'muted'},r?(mode==='free'?'Свободная практика сохранена':'Тренировка сохранена')+' · осталось карточек: '+r.queue.length:p.ids.length?'Доступно сейчас: '+p.ids.length+' · новых в наборе: '+p.fresh.length:next?'Следующее повторение '+swipeWhen(next):'Можно начать свободную практику или выбрать ещё один набор.'),h('button',{class:'main-btn blue wide',onclick:()=>openSwipeSet(active.key,mode)},r?'Продолжить карточки':p.ids.length?'Учить карточки':'Открыть набор'),h('div',{class:'row'},h('button',{class:'tg',onclick:()=>showWords('sets')},'Другой набор'),h('button',{class:'tg',onclick:()=>showSet(active.key)},'Слова и режимы'))));}
 else box.append(h('div',{class:'swipe-hero'},h('div',{class:'eyebrow'},'ВАШИ СЛОВА'),h('h2',{},'С какого набора начнём?'),h('p',{class:'muted'},'После выбора сразу появятся карточки. Набор и место остановки сохранятся.'),h('button',{class:'main-btn blue wide',onclick:()=>showWords('sets')},'Выбрать набор')));
 const studied=S.sets.map(k=>setBy(typeof k==='number'?'t:'+k:k)).filter(Boolean).filter((st,i,a)=>a.findIndex(x=>x.key===st.key)===i);if(studied.length){box.append(h('h2',{},'Я учу'),...studied.map(st=>{const p=swipePool(st.key);return h('div',{class:'swipe-study-row'},h('button',{class:'action-card',onclick:()=>openSwipeSet(st.key)},h('b',{},st.title),h('span',{class:'muted'},p.ids.length?'Сейчас: '+p.ids.length+' карточек':'По плану сейчас нет карточек')),h('button',{class:'tg',onclick:()=>showSet(st.key),'aria-label':'Обзор набора '+st.title},'Обзор'));}));}
 box.append(h('details',{class:'rule-item'},h('summary',{},'Как работают свайпы'),h('p',{},'Сначала вспомните ответ и откройте перевод. Свайп вправо — «Хорошо» в планировщике; влево — «Снова». Знакомое слово получает больший интервал, забытое вернётся раньше. Не нужно нажимать «Легко» для каждого знакомого слова.'),h('p',{class:'muted'},'Лимиты и интервалы берутся из ваших настроек. Свободная практика не меняет расписание. Если жест неудобен, используйте две кнопки или стрелки на клавиатуре.'),h('button',{class:'tg',onclick:showSettings},'Настройки повторений')),h('details',{class:'rule-item'},h('summary',{},'Другие способы практики'),h('div',{class:'row'},h('button',{class:'tg',onclick:()=>showWords('classic')},'Классический режим'),h('button',{class:'tg',onclick:startListening},'Аудирование'),h('button',{class:'tg',onclick:()=>showSet('mine')},'Все мои карточки'))));return box;
}
function swipeFingerprint(){return JSON.stringify({answers:S.answers,correct:S.correct,newDay:S.newDay,reviewDay:S.reviewDay,hist:S.hist,rv:S.rv,logLength:S.reviewLog.length,last:S.reviewLog.at(-1)});}
function swipeSnapshot(run,id,mode){if(mode==='free')return {run:JSON.parse(JSON.stringify({...run,undo:null})),id,mode};return {run:JSON.parse(JSON.stringify({...run,undo:null})),id,mode,srs:S.srs[id]?JSON.parse(JSON.stringify(S.srs[id])):null,newDay:JSON.parse(JSON.stringify(S.newDay)),reviewDay:S.reviewDay?JSON.parse(JSON.stringify(S.reviewDay)):null,hist:JSON.parse(JSON.stringify(S.hist)),rv:S.rv?JSON.parse(JSON.stringify(S.rv)):null,reviewLog:S.reviewLog.slice(),answers:S.answers,correct:S.correct};}
function swipeUndo(run){const u=run.undo;if(!u)return false;if(u.mode==='planned'&&(JSON.stringify(S.srs[u.id])!==u.afterSrs||swipeFingerprint()!==u.afterGlobal)){run.undo=null;save();toast('После этой оценки прогресс изменился. Отмена недоступна.');return false;}if(u.mode==='planned'){if(u.srs)S.srs[u.id]=u.srs;else delete S.srs[u.id];S.newDay=u.newDay;S.reviewDay=u.reviewDay;S.hist=u.hist;S.rv=u.rv;S.reviewLog=u.reviewLog;S.answers=u.answers;S.correct=u.correct;}const before=u.run;Object.keys(run).forEach(k=>delete run[k]);Object.assign(run,before,{undo:null});save();return true;}
function openSwipeSet(key,mode='planned',restart=false){const st=setBy(key);if(!st){toast('Набор не найден. Выберите другой.');return showWords('sets');}swipeEnsureSet(key);const ss=swipeState(),rk=swipeRunKey(key,mode);ss.activeMode=mode;let run=ss.runs[rk];if(restart||!run||run.finished||!Array.isArray(run.queue)){const p=swipePool(key),ids=mode==='free'?shuffle(p.all).slice(0,Math.max(10,Number(S.set.revPer)||20)):p.ids;run=ss.runs[rk]={key,mode,queue:ids.map(id=>({id})),initial:ids.length,done:0,yes:0,no:0,seen:{},started:Date.now(),revealed:false,finished:false,undo:null};}save();renderSwipe(st,run);}
function renderSwipe(st,run){stopMedia();nav('words');const root=h('div',{class:'session swipe-session'}),bar=h('div',{class:'progress'},h('i')),counter=h('span',{class:'small muted swipe-counter'}),close=h('button',{class:'icon-btn','aria-label':'Закрыть и сохранить карточки'},'×'),name=h('div',{class:'swipe-set-name'},st.title),top=h('div',{class:'session-top swipe-top'},close,h('div',{class:'swipe-title'},name,h('div',{class:'swipe-topline'},bar,counter))),body=h('div',{class:'session-body swipe-body'}),foot=h('div',{class:'session-foot swipe-foot'}),live=h('div',{class:'swipe-live small muted',role:'status','aria-live':'polite'});root.append(top,body,foot);setMain(root,true);let alive=true,busy=false,card=null,current=null,readyKey='',renderedID=null,lastT=Date.now(),timer=null,audioTimer=null,gesture=null,suppressClick=0;
 const tick=()=>{const t=Date.now();if(document.visibilityState==='visible')S.time[today()]=(S.time[today()]||0)+Math.min(60,(t-lastT)/1000);lastT=t;};
 const leave=()=>{tick();run.undo=null;save();session=null;showWords('today');};close.onclick=leave;
 swipeCleanup=()=>{alive=false;session=null;clearInterval(timer);clearTimeout(audioTimer);tick();save();document.removeEventListener('visibilitychange',visibility);};
 function visibility(){tick();if(document.visibilityState==='hidden')save();}document.addEventListener('visibilitychange',visibility);
 session={back:leave,key:e=>{if(e.target.closest('input,textarea,select,audio,video'))return;if(e.key==='Escape'){e.preventDefault();leave();return;}if(e.target.closest('button,summary,a'))return;if(e.key===' '||e.key==='Enter'){e.preventDefault();reveal();}else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();grade(e.key==='ArrowRight');}}};
 function status(){counter.textContent=run.done+' '+plural(run.done,'ответ','ответа','ответов');bar.firstChild.style.width=(run.done+run.queue.length?run.done/(run.done+run.queue.length)*100:0)+'%';}
 function draw(){if(!alive)return;clearTimeout(audioTimer);stopMedia();busy=false;status();const before=run.queue.length;run.queue=run.queue.filter(it=>{if(!D(it.id)||!isAvailable(it.id))return false;const state=swipeCanRate(it.id);return run.mode==='free'||!['newLimit','reviewLimit'].includes(state);});if(before!==run.queue.length)save();
 let item=run.current!=null?run.queue.find(x=>String(x.id)===String(run.current)):null;if(item&&run.mode!=='free'&&swipeCanRate(item.id)!=='ready')item=null;
 if(!item)item=run.queue.find(it=>run.mode==='free'||swipeCanRate(it.id)==='ready');
 if(!item){run.current=null;run.revealed=false;renderedID=null;return run.queue.length?waiting():finish();}
 if(String(run.current)!==String(item.id)){run.current=item.id;run.revealed=false;}current=item;renderedID=String(item.id);save();body.replaceChildren();foot.replaceChildren();const w=D(item.id),ru=swipeState().direction==='ru';card=h('div',{class:'swipe-card'+(run.revealed?' is-revealed':''),tabindex:0,'aria-label':'Карточка. '+(run.revealed?'Ответ открыт':'Нажмите, чтобы открыть ответ')});
 const badge=h('div',{class:'swipe-card-meta'},h('span',{},run.mode==='free'?'Свободная практика':!srsGet(item.id)?.reps?'Новое слово':'Повторение'),h('button',{class:'tg swipe-dir','aria-label':'Изменить направление карточек',onclick:()=>{swipeState().direction=ru?'en':'ru';run.revealed=false;save();draw();}},ru?'RU → EN':'EN → RU'));
 card.append(badge,wordArtwork(w),h('div',{class:'swipe-word'},ru?w.ru:w.en,!ru?spk(w.sound):null),!ru&&w.tr?h('div',{class:'muted swipe-transcription'},'['+w.tr+']'):null);
 if(run.revealed){card.append(h('div',{class:'swipe-answer'},ru?w.en:w.ru,ru?spk(w.sound):null),exampleBlock(w.exen,w.exru,null,!!SD.wordMeta?.[w.id]?.exampleAuto&&!S.wordEdits?.[w.id]?.exru),h('details',{class:'swipe-extra'},h('summary',{},'Звук, значение и ещё примеры'),audioMaterials(w),definitionBlock(w),importedContext(w),ctxEl(w,2)));}
 else card.append(h('p',{class:'swipe-recall muted'},'Вспомните '+(ru?'английское слово':'значение слова')+'. Затем откройте ответ.'));
 const stampL=h('div',{class:'swipe-stamp left','aria-hidden':'true'},'ПОКА НЕ ЗНАЮ'),stampR=h('div',{class:'swipe-stamp right','aria-hidden':'true'},'ЗНАЮ');card.append(stampL,stampR);body.append(card);
 if(!run.revealed)foot.append(h('button',{class:'main-btn blue wide',onclick:reveal},'Показать '+(ru?'слово':'перевод')));
 else{const e=srsGet(item.id),free=run.mode==='free';foot.append(h('div',{class:'swipe-decisions'},h('button',{class:'swipe-grade swipe-no','aria-label':'Пока не знаю. Свайп влево',onclick:()=>grade(false)},h('span',{},'← Пока не знаю'),h('small',{},free?'Ещё раз в этом круге':fmtIvl(preview(e,1)))),h('button',{class:'swipe-grade swipe-yes','aria-label':'Знаю. Свайп вправо',onclick:()=>grade(true)},h('span',{},'Знаю →'),h('small',{},free?'Убрать из этого круга':fmtIvl(preview(e,3))))));}
 foot.append(h('div',{class:'swipe-bottom'},h('button',{class:'tg swipe-undo',disabled:!run.undo,onclick:()=>{if(busy)return;if(swipeUndo(run)){live.textContent='Последняя оценка отменена.';draw();}}},'Отменить'),h('span',{class:'muted small'},run.mode==='free'?'Интервалы не меняются':run.revealed?'Свайпните или нажмите кнопку':'Ответ перед оценкой')),live);
 attachGesture(card);card.onclick=e=>{if(Date.now()<suppressClick||e.target.closest('button,a,summary,input,audio,video,select,textarea'))return;reveal();};body.scrollTop=0;if(!ru&&S.set.voice&&w.sound)audioTimer=setTimeout(()=>{if(alive&&String(run.current)===renderedID)voice(w.sound);},250);
 }
 function reveal(){if(busy||!current||run.revealed)return;run.revealed=true;save();draw();}
 function grade(yes){if(busy||!current)return;if(!run.revealed){toast('Сначала откройте ответ.');return;}const id=current.id;if(run.mode!=='free'&&swipeCanRate(id)!=='ready'){toast('Срок или лимит изменился. Обновляю карточки.');run.current=null;draw();return;}busy=true;tick();for(const other of Object.values(swipeState().runs))if(other!==run)other.undo=null;const snapshot=swipeSnapshot(run,id,run.mode);if(run.mode!=='free'){markDay();srsAnswer(id,yes?3:1);S.answers++;if(yes)S.correct++;snapshot.afterSrs=JSON.stringify(S.srs[id]);snapshot.afterGlobal=swipeFingerprint();}run.queue=run.queue.filter(it=>String(it.id)!==String(id));run.done++;run[yes?'yes':'no']++;run.seen[id]=(run.seen[id]||0)+1;
 // Mistakes return after the real short step. Free practice may repeat sooner without grading SRS.
 if(!yes&&run.seen[id]<3)run.queue.push({id,retry:true});run.current=null;run.revealed=false;run.undo=snapshot;save();live.textContent=(yes?'Знаю: ':'Повторим: ')+D(id).en;card?.classList.add(yes?'swipe-leave-right':'swipe-leave-left');setTimeout(()=>{if(alive)draw();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:140);
 }
 function waiting(){current=null;status();const next=Math.min(...run.queue.map(it=>srsGet(it.id)?.due||now()));readyKey=String(next);body.replaceChildren(h('div',{class:'swipe-empty'},h('div',{class:'eyebrow'},'КОРОТКИЙ ПЕРЕРЫВ'),h('h2',{},'Дадим памяти немного времени'),h('p',{class:'muted'},'Сложные карточки вернутся по вашим шагам обучения.'),h('p',{class:'swipe-wait-clock',role:'status'},swipeWhen(next)),h('p',{class:'muted small'},'Можно закрыть экран: выбранный набор и очередь сохранятся.')));foot.replaceChildren(h('button',{class:'main-btn blue wide',onclick:()=>openSwipeSet(st.key,'free')},'Пока потренироваться свободно'),h('div',{class:'row'},h('button',{class:'tg',onclick:()=>{if(swipeUndo(run))draw();},disabled:!run.undo},'Отменить'),h('button',{class:'tg',onclick:leave},'Закрыть и сохранить')),live);}
 function finish(){current=null;run.finished=true;run.current=null;save();status();const next=swipeNextAt(st.key),p=swipePool(st.key);body.replaceChildren(h('div',{class:'swipe-empty'},h('div',{class:'eyebrow'},run.done?'ГОТОВО НА СЕЙЧАС':'ПОВТОРЕНИЯ ПО ПЛАНУ'),h('h2',{},run.done?'Хорошая работа':'Сейчас нет карточек'),h('p',{class:'muted'},run.done?'Знаю: '+run.yes+' · пока не знаю: '+run.no:'Набор остаётся в изучаемых. Не нужно повторять знакомые слова раньше срока.'),next?h('p',{},'Следующее повторение '+swipeWhen(next)):null,p.fresh.length&&newLeftToday()===0?h('p',{class:'muted'},'Лимит новых слов на сегодня достигнут.'):null,p.review.length&&reviewLeftToday()===0?h('p',{class:'muted'},'Лимит повторений на сегодня достигнут.'):null,h('p',{class:'muted small'},run.mode==='free'?'Свободная практика не изменила расписание.':'Интервалы сохранены. Выбранный набор будет ждать вас в разделе «Слова».')));foot.replaceChildren(p.ids.length?h('button',{class:'main-btn blue wide',onclick:()=>openSwipeSet(st.key,'planned',true)},'Следующая порция карточек'):h('button',{class:'main-btn blue wide',onclick:()=>openSwipeSet(st.key,'free',true)},run.mode==='free'?'Ещё один свободный круг':'Свободная практика'),h('div',{class:'row'},h('button',{class:'tg',disabled:!run.undo,onclick:()=>{if(swipeUndo(run))draw();}},'Отменить'),h('button',{class:'tg',onclick:leave},'К моим наборам')),live);}
 function resetGesture(){if(card){card.style.transform='';card.style.opacity='';card.style.setProperty('--swipe-l','0');card.style.setProperty('--swipe-r','0');}gesture=null;}
 function attachGesture(el){el.ondragstart=e=>e.preventDefault();el.onpointerdown=e=>{if(busy||!e.isPrimary||e.button>0||e.target.closest('button,a,summary,input,select,audio,video,textarea'))return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,horizontal:false,vertical:false};};el.onpointermove=e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(!gesture.horizontal&&!gesture.vertical&&(Math.abs(dx)>10||Math.abs(dy)>10)){gesture.horizontal=Math.abs(dx)>Math.abs(dy)*1.25;gesture.vertical=!gesture.horizontal;if(gesture.horizontal){try{el.setPointerCapture(e.pointerId);}catch{}}}if(gesture.horizontal){e.preventDefault();const distance=Math.max(-190,Math.min(190,dx));el.style.transform='translateX('+distance+'px) rotate('+(distance/35)+'deg)';el.style.opacity=String(1-Math.abs(distance)/900);el.style.setProperty('--swipe-l',String(Math.min(1,Math.max(0,-dx/90))));el.style.setProperty('--swipe-r',String(Math.min(1,Math.max(0,dx/90))));}};el.onpointerup=e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,horizontal=gesture.horizontal;const threshold=Math.max(72,Math.min(110,el.clientWidth*.23));if(horizontal||Math.abs(dy)>10)suppressClick=Date.now()+400;resetGesture();if(horizontal&&Math.abs(dx)>=threshold)grade(dx>0);};el.onpointercancel=()=>{suppressClick=Date.now()+400;resetGesture();};el.onlostpointercapture=e=>{if(e.target===el)resetGesture();};}
 draw();timer=setInterval(()=>{if(!alive)return;if(!run.finished&&!run.current){const ready=run.queue.some(it=>swipeCanRate(it.id)==='ready');if(ready)draw();else{const clock=body.querySelector('.swipe-wait-clock');if(clock)clock.textContent=swipeWhen(Number(readyKey));}}},1000);
}

window.__app={swipeState,swipePool,swipeSetIDs,swipeCanRate,swipeUndo,openSwipeSet,swipeHub,showGrammar,startGrammar,grammarData,prioritiseGrammar,grammarCheck,grammarAnswerText,grammarAnswerSentence,grammarRecord,showMediaLibrary,audioMaterials,play,stopMedia,startListening,scheduleOutcome,learningDelays,reviewLeftToday,orderedReviewIds,isAvailable,expressionList,editBuiltIn,D,setList,showSettings,lessonStatus,lessonStatusText,ensureLessonProgress,retryHint,answerExplanation,showReaderList,readingBook,readingEntry,readingSaveWord,readingState,readingItem,closeReadingDialog,showWord,showReader,showSet,showBrowse,startDrops,startSetMode,setBy,lookup,ctxFor,parseCSV,srsAnswer,srsGet,showCardForm,showTenses,showTensePath,startSprint,startMix,startPair,startText,runStage,mixSteps,keyStep,GX,startSession,startNode,lessonSteps,cpSteps,dialogSteps,NODES,R,S:()=>S,mkTask,parseTask,parseAns,ruleHTML,dueIds,startReview,startLearn,showWords,showRules,showMistakes,showSettings,showTrainer,QI,showToday,showMap,exportProgress,importProgress,applyTheme,preview,packStep,restoreStep,solutionFor};
})();

