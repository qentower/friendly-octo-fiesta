
/* Wordly independently authored tense guide; grammatical engine retained. */
(function(){
const V=[{"b": "paint", "s": "paints", "p": "painted", "pp": "painted", "ing": "painting", "o": "the fence", "ru": "красить"}, {"b": "repair", "s": "repairs", "p": "repaired", "pp": "repaired", "ing": "repairing", "o": "a chair", "ru": "чинить"}, {"b": "prepare", "s": "prepares", "p": "prepared", "pp": "prepared", "ing": "preparing", "o": "the report", "ru": "готовить"}, {"b": "pack", "s": "packs", "p": "packed", "pp": "packed", "ing": "packing", "o": "the parcels", "ru": "упаковывать"}, {"b": "design", "s": "designs", "p": "designed", "pp": "designed", "ing": "designing", "o": "a poster", "ru": "проектировать"}, {"b": "sort", "s": "sorts", "p": "sorted", "pp": "sorted", "ing": "sorting", "o": "the photos", "ru": "сортировать"}, {"b": "check", "s": "checks", "p": "checked", "pp": "checked", "ing": "checking", "o": "the details", "ru": "проверять"}, {"b": "review", "s": "reviews", "p": "reviewed", "pp": "reviewed", "ing": "reviewing", "o": "the notes", "ru": "повторять"}, {"b": "build", "s": "builds", "p": "built", "pp": "built", "ing": "building", "o": "a model", "ru": "строить"}, {"b": "write", "s": "writes", "p": "wrote", "pp": "written", "ing": "writing", "o": "the invitations", "ru": "писать"}, {"b": "sew", "s": "sews", "p": "sewed", "pp": "sewn", "ing": "sewing", "o": "a costume", "ru": "шить"}, {"b": "polish", "s": "polishes", "p": "polished", "pp": "polished", "ing": "polishing", "o": "the silver", "ru": "полировать"}];
const SUBJ=[['I',1],['you',2],['he',3],['she',3],['we',4],['they',4],['the designer',3],['the volunteers',4]];
const be=(p,past)=>past?((p===1||p===3)?'was':'were'):(p===1?'am':p===3?'is':'are'); const hv=p=>p===3?'has':'have'; const dd=p=>p===3?'does':'do';
const T=[
{"k": "PrS", "en": "Present Simple", "ru": "Настоящее простое", "use": "Повторяющееся действие, свойство или установленное расписание: мы описываем обычное положение дел.", "g": "Simple", "time": "Present", "mk": "every weekend, on Thursdays, each autumn", "m": [{"w": "every weekend"}, {"w": "on Thursdays"}, {"w": "each autumn"}], "f": ["s:Подлежащее + v:V / V+s", "s:Подлежащее + a:do / does + n:not + v:V", "a:Do / Does + s:Подлежащее + v:V ?"], "tl": {"dots": [150]},chain:(p,v)=>[['v',p===3?v.s:v.b]],doAux:p=>dd(p)},
{"k": "PrC", "en": "Present Continuous", "ru": "Настоящее продолженное", "use": "Мы наблюдаем действие изнутри: оно происходит сейчас или является временным процессом вокруг настоящего момента.", "g": "Continuous", "time": "Present", "mk": "at this very moment, right now, this week", "m": [{"w": "at this very moment"}, {"w": "right now"}, {"w": "this week"}], "f": ["s:Подлежащее + a:am / is / are + v:V+ing", "s:Подлежащее + a:am / is / are + n:not + v:V+ing", "a:Am / Is / Are + s:Подлежащее + v:V+ing ?"], "tl": {"dots": [150]},chain:(p,v)=>[['a',be(p)],['v',v.ing]]},
{"k": "PrP", "en": "Present Perfect", "ru": "Настоящее совершенное", "use": "Оглядываемся из настоящего на результат, опыт или события в ещё открытом периоде; конкретный законченный момент не является центром сообщения.", "g": "Perfect", "time": "Present", "mk": "so far, this month, recently", "m": [{"w": "so far"}, {"w": "this month"}, {"w": "recently"}], "f": ["s:Подлежащее + a:have / has + v:V3", "s:Подлежащее + a:have / has + n:not + v:V3", "a:Have / Has + s:Подлежащее + v:V3 ?"], "tl": {"dots": [150]},chain:(p,v)=>[['a',hv(p)],['v',v.pp]]},
{"k": "PrPC", "en": "Present Perfect Continuous", "ru": "Настоящее совершенное продолженное", "use": "Смотрим на длительность процесса до настоящего. Процесс может продолжаться или только что закончиться и оставить заметный след.", "g": "Perfect Continuous", "time": "Present", "mk": "for forty minutes, since lunchtime, all afternoon", "m": [{"w": "for forty minutes"}, {"w": "since lunchtime"}, {"w": "all afternoon"}], "f": ["s:Подлежащее + a:have / has + a:been + v:V+ing", "s:Подлежащее + a:have / has + n:not + a:been + v:V+ing", "a:Have / Has + s:Подлежащее + a:been + v:V+ing ?"], "tl": {"dots": [150]},chain:(p,v)=>[['a',hv(p)],['a','been'],['v',v.ing]]},
{"k": "PaS", "en": "Past Simple", "ru": "Прошедшее простое", "use": "Событие относится к завершённой части прошлого. Рассказ может двигаться от одного законченного события к следующему.", "g": "Simple", "time": "Past", "mk": "last Saturday, three weeks ago, in 2023", "m": [{"w": "last Saturday"}, {"w": "three weeks ago"}, {"w": "in 2023"}], "f": ["s:Подлежащее + v:V2 / V+ed", "s:Подлежащее + a:did + n:not + v:V", "a:Did + s:Подлежащее + v:V ?"], "tl": {"dots": [70]},chain:(p,v)=>[['v',v.p]],doAux:()=>"did"},
{"k": "PaC", "en": "Past Continuous", "ru": "Прошедшее продолженное", "use": "В выбранный момент прошлого действие уже было в процессе. Это часто фон для отдельного события, а не его итог.", "g": "Continuous", "time": "Past", "mk": "at noon yesterday, when the lights went out, at that moment yesterday", "m": [{"w": "at noon yesterday"}, {"w": "when the lights went out"}, {"w": "at that moment yesterday"}], "f": ["s:Подлежащее + a:was / were + v:V+ing", "s:Подлежащее + a:was / were + n:not + v:V+ing", "a:Was / Were + s:Подлежащее + v:V+ing ?"], "tl": {"dots": [70]},chain:(p,v)=>[['a',be(p,true)],['v',v.ing]]},
{"k": "PaP", "en": "Past Perfect", "ru": "Прошедшее совершенное", "use": "В рассказе есть прошлая точка отсчёта; это действие уже произошло до неё. Время помогает показать более раннее событие.", "g": "Perfect", "time": "Past", "mk": "before the guests arrived, by midnight yesterday, before the meeting started", "m": [{"w": "before the guests arrived"}, {"w": "by midnight yesterday"}, {"w": "before the meeting started"}], "f": ["s:Подлежащее + a:had + v:V3", "s:Подлежащее + a:had + n:not + v:V3", "a:Had + s:Подлежащее + v:V3 ?"], "tl": {"dots": [70]},chain:(p,v)=>[['a','had'],['v',v.pp]]},
{"k": "PaPC", "en": "Past Perfect Continuous", "ru": "Прошедшее совершенное продолженное", "use": "Процесс шёл некоторое время до другой прошлой точки. Внимание на том, сколько он длился, либо на его последствии в прошлом.", "g": "Perfect Continuous", "time": "Past", "mk": "for an hour before the guests arrived, for weeks before the meeting, since sunrise when the storm began", "m": [{"w": "for an hour before the guests arrived"}, {"w": "for weeks before the meeting"}, {"w": "since sunrise when the storm began"}], "f": ["s:Подлежащее + a:had + a:been + v:V+ing", "s:Подлежащее + a:had + n:not + a:been + v:V+ing", "a:Had + s:Подлежащее + a:been + v:V+ing ?"], "tl": {"dots": [70]},chain:(p,v)=>[['a','had'],['a','been'],['v',v.ing]]},
{"k": "FuS", "en": "Future Simple", "ru": "Будущее простое", "use": "Говорящий обещает, предполагает или принимает решение сейчас. Для заранее подготовленного плана часто подходит going to.", "g": "Simple", "time": "Future", "mk": "tomorrow afternoon, next weekend, soon", "m": [{"w": "tomorrow afternoon"}, {"w": "next weekend"}, {"w": "soon"}], "f": ["s:Подлежащее + a:will + v:V", "s:Подлежащее + a:will + n:not + v:V", "a:Will + s:Подлежащее + v:V ?"], "tl": {"dots": [220]},chain:(p,v)=>[['a','will'],['v',v.b]]},
{"k": "FuC", "en": "Future Continuous", "ru": "Будущее продолженное", "use": "Представляем себя в будущий момент и видим действие уже в процессе. Не требуется, чтобы к этому моменту оно закончилось.", "g": "Continuous", "time": "Future", "mk": "at noon tomorrow, at this time next Sunday, when you arrive tomorrow", "m": [{"w": "at noon tomorrow"}, {"w": "at this time next Sunday"}, {"w": "when you arrive tomorrow"}], "f": ["s:Подлежащее + a:will + a:be + v:V+ing", "s:Подлежащее + a:will + n:not + a:be + v:V+ing", "a:Will + s:Подлежащее + a:be + v:V+ing ?"], "tl": {"dots": [220]},chain:(p,v)=>[['a','will'],['a','be'],['v',v.ing]]},
{"k": "FuP", "en": "Future Perfect", "ru": "Будущее совершенное", "use": "Смотрим назад из будущей точки: к этому сроку результат уже будет достигнут.", "g": "Perfect", "time": "Future", "mk": "by Friday evening, before you arrive tomorrow, by the end of next month", "m": [{"w": "by Friday evening"}, {"w": "before you arrive tomorrow"}, {"w": "by the end of next month"}], "f": ["s:Подлежащее + a:will + a:have + v:V3", "s:Подлежащее + a:will + n:not + a:have + v:V3", "a:Will + s:Подлежащее + a:have + v:V3 ?"], "tl": {"dots": [220]},chain:(p,v)=>[['a','will'],['a','have'],['v',v.pp]]},
{"k": "FuPC", "en": "Future Perfect Continuous", "ru": "Будущее совершенное продолженное", "use": "В будущей точке измеряем длительность процесса, начавшегося раньше. Важен накопленный период, а не число готовых результатов.", "g": "Perfect Continuous", "time": "Future", "mk": "for an hour by noon tomorrow, for three weeks by Friday, for six months by December", "m": [{"w": "for an hour by noon tomorrow"}, {"w": "for three weeks by Friday"}, {"w": "for six months by December"}], "f": ["s:Подлежащее + a:will + a:have + a:been + v:V+ing", "s:Подлежащее + a:will + n:not + a:have + a:been + v:V+ing", "a:Will + s:Подлежащее + a:have + a:been + v:V+ing ?"], "tl": {"dots": [220]},chain:(p,v)=>[['a','will'],['a','have'],['a','been'],['v',v.ing]]},
];
function verbPart(t,mode,p,v){
  // возвращает {pre:[], post:[]} — pre: aux перед подлежащим (вопрос)
  let ch = t.chain(p,v).slice();
  if(mode!=='aff' && t.doAux){ ch=[['a',t.doAux(p)],['v',v.b]]; }
  if(mode==='neg'){ ch.splice(1,0,['n','not']); return {pre:[],post:ch}; }
  if(mode==='q'){ return {pre:[ch[0]], post:ch.slice(1)}; }
  return {pre:[],post:ch};
}
function sentence(t,mode,subj,v,marker){
  const [sw,p]=subj; const vp=verbPart(t,mode,p,v);
  const toks=[]; const push=(c,w)=>w.split(' ').forEach(x=>toks.push({c,w:x}));
  vp.pre.forEach(([c,w])=>push(c,w));
  push('s',sw);
  vp.post.forEach(([c,w],i)=>{ push(c,w); if(i===0 && marker && marker.pos==='mid' && mode!=='q') push('t',marker.w); });
  if(marker && marker.pos==='mid' && mode==='q'){ // Have you ever seen
    const si=toks.findIndex(x=>x.c==='s'); let last=si; while(toks[last+1]&&toks[last+1].c==='s') last++;
    toks.splice(last+1,0,{c:'t',w:marker.w});
  }
  push('o',v.o);
  if(marker && marker.pos!=='mid') push('t',marker.w);
  toks[0].w = toks[0].w==='I'?'I':toks[0].w[0].toUpperCase()+toks[0].w.slice(1);
  toks[toks.length-1].w += mode==='q'?'?':'.';
  return {toks, vp};
}
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function pickMarker(t,mode){ const ms=t.m.filter(m=>!m.md||m.md.includes(mode)); return rnd(ms.length?ms:t.m); }
function gen(tKeys, modes){
  const tk=rnd(tKeys); const t=T.find(x=>x.k===tk); const mode=rnd(modes); const v=rnd(V); const subj=rnd(SUBJ);
  const marker=pickMarker(t,mode);
  return {t,mode,v,subj,marker,...sentence(t,mode,subj,v,marker)};
}
window.TENSES={T,V,SUBJ,gen,sentence,verbPart,be,hv,dd};
})();

