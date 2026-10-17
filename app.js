'use strict';
const KEY='wordquest_v1'; const DAY=86400000; const $=id=>document.getElementById(id);
const SAMPLE=[['achieve','달성하다','동사','You can achieve your dream.'],['opportunity','기회','명사','This is a great opportunity.'],['improve','향상시키다','동사','I want to improve my English.'],['environment','환경','명사','We must protect the environment.'],['challenge','도전','명사','This challenge is difficult.'],['discover','발견하다','동사','They discover a new place.'],['necessary','필요한','형용사','Sleep is necessary for health.'],['experience','경험','명사','It was a good experience.'],['confident','자신감 있는','형용사','She feels confident today.'],['decide','결정하다','동사','I decide to study tonight.']];
const DICT=Object.fromEntries(SAMPLE.map(a=>[a[0],a]));Object.assign(DICT,Object.fromEntries([['important','중요한','형용사'],['beautiful','아름다운','형용사'],['different','다른','형용사'],['because','왜냐하면','접속사'],['however','그러나','부사'],['future','미래','명사'],['remember','기억하다','동사'],['understand','이해하다','동사'],['education','교육','명사'],['knowledge','지식','명사'],['success','성공','명사'],['develop','발전시키다','동사'],['practice','연습하다','동사'],['school','학교','명사'],['student','학생','명사'],['teacher','선생님','명사'],['language','언어','명사'],['English','영어','명사'],['science','과학','명사'],['history','역사','명사'],['question','질문','명사'],['answer','대답','명사'],['example','예시','명사'],['problem','문제','명사'],['solution','해결책','명사'],['prepare','준비하다','동사'],['explain','설명하다','동사'],['imagine','상상하다','동사'],['believe','믿다','동사'],['protect','보호하다','동사'],['respect','존중하다','동사'],['create','창조하다','동사'],['healthy','건강한','형용사'],['energy','에너지','명사'],['culture','문화','명사'],['society','사회','명사'],['nature','자연','명사'],['information','정보','명사'],['computer','컴퓨터','명사'],['technology','기술','명사'],['activity','활동','명사'],['favorite','가장 좋아하는','형용사']].map(a=>[a[0].toLowerCase(),[a[0].toLowerCase(),a[1],a[2],'']])));
const stop=new Set('a an the am is are was were be been being i you he she it we they my your his her our their me him us them this that these those and or but if then than of in on at to for from by with as do does did have has had will would can could should shall not no yes very so just more most much many some any all each every who what where when why how which there here about into over under again also out up down one two three four five ten its s t d ll ve re m'.split(' '));
function today(){return new Date().toLocaleDateString('en-CA')}function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random().toString(36).slice(2)}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function load(){try{let s=JSON.parse(localStorage.getItem(KEY));if(s&&Array.isArray(s.words))return s}catch(e){}return {words:[],xp:0,history:{},settings:{dailyGoal:10},created:Date.now()}}let db=load(),view='home',draft=[],session=null,quiz=null,deckFilter='all';function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){toast('저장 공간 부족: 데이터를 내보내세요.')}}function toast(message){let el=$('toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(window._toast);window._toast=setTimeout(()=>el.classList.add('hidden'),3300)}function award(xp){db.xp+=xp;db.history[today()]=(db.history[today()]||0)+xp;save();updateBadge()}
const NAV=[['home','🏡','홈'],['world','🗺️','전체 지도'],['quiz','🌼','단어 미션'],['garden','🪴','정원 꾸미기'],['settings','⚙','설정']];function nav(to){if(view==='study'&&to!=='study'&&'speechSynthesis'in window)speechSynthesis.cancel();if(to==='quiz'&&view!=='quiz')quiz=null;if(to==='finalBoss'&&view!=='finalBoss')finalBattle=null;view=to;render();window.scrollTo(0,0)}function updateBadge(){let lv=Math.floor(db.xp/200)+1;$('levelBadge').textContent=`Lv.${lv} · ${db.xp.toLocaleString()} XP`}
function render(){ensureMonsters();ensureHero();updateBadge();$('pageTitle').textContent=({home:'나의 정원',world:'전체 지도',garden:'정원 꾸미기',course:'전체 지도',scan:'사진 한 장으로 등록',deck:'나의 단어장',study:'단어 도전',quiz:'단어 미션',monsters:'성장 기록',finalBoss:'마지막 정원 축제',hero:'학습 레벨',settings:'설정'})[view];for(let id of ['sidenav','bottomnav'])$(id).innerHTML=NAV.map(([key,ic,label])=>`<button class="${view===key?'on':''}" data-nav="${key}"><b>${ic}</b> ${label}</button>`).join('');try{$('view').className=view==='study'?'wg15-study wg15-village-'+Math.max(0,WORLD_REGIONS.findIndex(r=>session?.day>=r.start&&session?.day<=r.end)):'wg15-view-'+view;$('view').innerHTML=({home:home,world:worldView,garden:gardenView,course:worldView,scan:scan,deck:deck,study:study,quiz:quizView,monsters:monstersView,finalBoss:finalBossView,hero:heroView,settings:settingsView})[view]();}catch(e){console.error('Word Garden render error',e);$('view').innerHTML='<section class="panel"><h2>화면을 불러오지 못했어요.</h2><p>이전 기록을 백업한 후 다시 실행해 주세요.</p><button class="btn" onclick="location.reload()">새로고침</button></section>';return;}document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));bindView()}
function dueWords(){return db.words.filter(w=>(w.reps||0)>0&&(!w.due||w.due<=Date.now())).concat(db.words.filter(w=>w.source!=='elementary800'&&!(w.reps||0)&&(!w.due||w.due<=Date.now())))}function streak(){let n=0,dt=new Date();if(!db.history[today()])dt.setDate(dt.getDate()-1);for(let i=0;i<365;i++){let key=dt.toLocaleDateString('en-CA');if(!db.history[key])break;n++;dt.setDate(dt.getDate()-1)}return n}

// Original fantasy creatures belong to WORD QUEST and are intentionally unrelated to existing franchises.
const SPECIES=[
 ['voltkit','볼키트','번개','#71B9FF','⚡',1],['embercub','엠버큐브','불꽃','#FB9B63','🔥',2],['sproutle','스프라우틀','숲','#6DD9A1','🌿',3],
 ['bubblin','버블린','물','#7BCEF4','💧',4],['stonepup','스톤퍼프','대지','#C5A98D','🪨',5],['glimfox','글림폭스','빛','#EAD17B','✨',6],
 ['mistfin','미스트핀','안개','#B6A3E9','🌫',7],['frostip','프로스팁','얼음','#8FDEF2','❄',8],['thornox','쏜옥스','숲','#70C78F','🍀',9],
 ['sparkray','스파크레이','번개','#A1A8FF','⚡',10],['moonowl','문아울','밤','#A59BDF','🌙',11],['flarehorn','플레어혼','불꽃','#F7A27A','🔥',12]
];
function ensureMonsters(){if(!db.monsters||typeof db.monsters!=='object')db.monsters={owned:[],partner:null,claims:[],wins:{},reviews:{},events:[]};let m=db.monsters;m.owned=Array.isArray(m.owned)?m.owned:[];m.claims=Array.isArray(m.claims)?m.claims:[];m.wins=m.wins||{};m.reviews=m.reviews||{};m.events=Array.isArray(m.events)?m.events:[];if(!m.partner&&m.owned.length)m.partner=m.owned[0].id;}
function monsterArt(id,stage=1){
 const ix=Math.max(0,SPECIES.findIndex(s=>s[0]===id)),sp=SPECIES[ix],c=sp[3],dark='#182841';
 const head=(extra='')=>`<ellipse cx="105" cy="97" rx="46" ry="42" fill="${c}" stroke="${dark}" stroke-width="5"/>${extra}<ellipse cx="89" cy="99" rx="5" ry="8" fill="${dark}"/><ellipse cx="122" cy="99" rx="5" ry="8" fill="${dark}"/><path d="M99 120 Q106 128 113 120" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`;
 const body=`<ellipse cx="106" cy="152" rx="51" ry="36" fill="${c}" stroke="${dark}" stroke-width="5"/><ellipse cx="105" cy="158" rx="28" ry="22" fill="#ffffff" opacity=".25"/><path d="M72 176 L65 190 M139 176 L146 190" stroke="${dark}" stroke-width="9" stroke-linecap="round"/>`;
 const shapes=[
 // wolf: pointed ears, muzzle, lightning tail
 `<path d="M66 78 L62 22 L91 62 M121 61 L157 21 L149 87" fill="${c}" stroke="${dark}" stroke-width="5"/>${body}${head('<path d="M98 111 L106 115 L114 111" stroke="white" fill="white"/>')}<path d="M150 151 L183 112 L170 146 L196 137 L163 185" fill="#fbe476" stroke="${dark}" stroke-width="4"/>`,
 // dragon: wings, horns, long tail
 `<path d="M70 142 Q22 91 26 55 L63 81 L73 48 L97 132 M137 130 L166 51 L177 83 L196 57 Q200 116 147 154" fill="#f67a51" stroke="${dark}" stroke-width="5"/>${body}<path d="M145 170 Q195 208 187 145" fill="none" stroke="${c}" stroke-width="20"/>${head('<path d="M70 62 L77 28 L93 62 M119 63 L137 29 L145 75" fill="#fff0bb" stroke="'+dark+'" stroke-width="4"/>')}`,
 // turtle: huge shell and leafy crown
 `<ellipse cx="107" cy="143" rx="75" ry="53" fill="#2e8866" stroke="${dark}" stroke-width="6"/><path d="M71 104 L106 91 L143 109 L151 150 L107 179 L64 150Z" fill="${c}" stroke="#205c4a" stroke-width="5"/><path d="M106 91 V179 M64 150 L143 109 M71 104 L151 150" stroke="#23684c" stroke-width="3"/>${head('<path d="M100 52 Q70 23 95 14 Q120 24 105 52 M111 48 Q116 16 143 25 Q142 44 111 55" fill="#c9f37f" stroke="'+dark+'" stroke-width="3"/>')}`,
 // axolotl aquatic with gills
 `<path d="M59 94 L28 65 L22 88 L47 105 L23 119 L33 138 L61 119 M151 92 L180 65 L191 86 L163 104 L190 126 L178 143 L150 117" fill="#a3eefa" stroke="${dark}" stroke-width="4"/>${body}${head()}<path d="M88 178 Q104 193 120 178" stroke="#fff" stroke-width="5" fill="none"/>`,
 // stone golem: angular face arms
 `<path d="M35 116 L59 101 L73 132 L56 173 L28 151 M142 127 L161 101 L190 126 L182 156 L157 170" fill="#9a8570" stroke="${dark}" stroke-width="5"/><path d="M73 125 L90 105 L129 108 L157 133 L142 183 L74 185 L54 148Z" fill="${c}" stroke="${dark}" stroke-width="5"/><path d="M64 65 L92 49 L142 52 L159 82 L145 121 L80 124 L56 91Z" fill="#b6a092" stroke="${dark}" stroke-width="5"/><path d="M82 85 L99 90 L93 99 M122 91 L139 83 L136 100" stroke="${dark}" stroke-width="6" fill="none"/>`,
 // light fox, many tails
 `<path d="M135 161 Q203 144 183 89 Q168 126 151 127 Q193 99 164 68 Q145 111 135 132" fill="#ffedaa" stroke="${dark}" stroke-width="5"/>${body}<path d="M62 80 L53 27 L86 61 M121 61 L159 28 L148 88" fill="${c}" stroke="${dark}" stroke-width="5"/>${head('<path d="M95 122 L107 143 L119 122" fill="#fff9e8"/>')}`,
 // fog jelly ghost
 `<path d="M57 86 Q60 33 107 34 Q157 32 162 91 L172 168 L151 156 L134 176 L111 160 L90 181 L69 158 L44 172Z" fill="${c}" stroke="${dark}" stroke-width="5"/><ellipse cx="88" cy="105" rx="9" ry="12" fill="${dark}"/><ellipse cx="129" cy="105" rx="9" ry="12" fill="${dark}"/><path d="M100 125 Q108 132 118 125" stroke="${dark}" stroke-width="4" fill="none"/><circle cx="55" cy="43" r="10" fill="#fff" opacity=".5"/><circle cx="180" cy="57" r="7" fill="#fff" opacity=".4"/>`,
 // ice penguin
 `<path d="M62 95 L39 121 L31 148 L70 130 M149 95 L179 119 L188 151 L145 131" fill="${c}" stroke="${dark}" stroke-width="5"/>${body}${head('<path d="M99 113 L109 126 L119 113Z" fill="#ffbc65" stroke="'+dark+'" stroke-width="2"/>')}<path d="M78 60 L105 20 L132 60" fill="#d0fbff" stroke="${dark}" stroke-width="4"/>`,
 // forest ox/horns
 `<path d="M64 92 Q20 94 34 42 Q53 75 81 68 M136 72 Q168 74 186 36 Q197 99 151 100" fill="#d5e8a3" stroke="${dark}" stroke-width="5"/>${body}${head('<ellipse cx="106" cy="115" rx="18" ry="14" fill="#e5faaf"/><circle cx="100" cy="116" r="3" fill="'+dark+'"/><circle cx="113" cy="116" r="3" fill="'+dark+'"/>')}`,
 // electric manta ray
 `<path d="M106 47 Q70 83 19 103 L53 139 L75 124 L106 182 L138 124 L160 139 L198 103 Q143 80 106 47Z" fill="${c}" stroke="${dark}" stroke-width="5"/><path d="M105 181 L95 195 L115 186" fill="#e5f4ff"/><circle cx="88" cy="107" r="6" fill="${dark}"/><circle cx="124" cy="107" r="6" fill="${dark}"/><path d="M98 122 Q106 128 113 122" fill="none" stroke="${dark}" stroke-width="3"/>`,
 // owl
 `<path d="M63 80 L49 36 L85 59 M129 60 L163 34 L153 91" fill="${c}" stroke="${dark}" stroke-width="5"/>${body}<ellipse cx="105" cy="97" rx="51" ry="52" fill="${c}" stroke="${dark}" stroke-width="5"/><circle cx="86" cy="100" r="20" fill="#fff5d9"/><circle cx="127" cy="100" r="20" fill="#fff5d9"/><circle cx="90" cy="99" r="8" fill="${dark}"/><circle cx="123" cy="99" r="8" fill="${dark}"/><path d="M100 118 L112 118 L106 131Z" fill="#ffbf6e"/>`,
 // fire stag
 `<path d="M70 76 Q43 38 47 16 L65 38 L77 15 L89 67 M128 67 L143 17 L154 40 L173 17 Q181 49 146 79" fill="#ffdf76" stroke="${dark}" stroke-width="5"/>${body}${head()}<path d="M145 164 Q191 173 184 133" fill="none" stroke="#ff9865" stroke-width="12"/>`
 ];
 let power=stage===3?`<path d="M108 17 L119 38 L143 35 L131 54 L139 72 L108 61 L78 72 L88 52 L76 35 L99 38Z" fill="#f7db77" stroke="#fff4be" stroke-width="3" opacity=".9"/>`:stage===2?`<path d="M78 32 L87 43 M129 32 L138 43" stroke="#ffe9a2" stroke-width="6"/>`:'';
 return `<svg viewBox="0 0 220 205" class="creature-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(sp[1])} ${stage}단계"><ellipse cx="108" cy="193" rx="69" ry="9" fill="#000" opacity=".22"/><g ${stage===3?'transform="translate(-10,-15) scale(1.10)"':stage===2?'transform="translate(-5,-7) scale(1.05)"':''}>${shapes[ix]}${power}</g>${stage>=2?`<g fill="#fff0a7"><circle cx="30" cy="35" r="4"/><circle cx="186" cy="45" r="5"/></g>`:''}${stage===3?`<g stroke="#f9ec94" stroke-width="3"><path d="M15 101 L31 97 M185 101 L205 93 M108 9 L108 23"/></g>`:''}</svg>`;
}
function monsterStage(m){return m.reviews>=30&&m.mastered>=8?3:m.reviews>=8&&m.mastered>=3?2:1}
function creatureCard(mon,compact=false){let c=SPECIES.find(x=>x[0]===mon.species)||SPECIES[0],stage=monsterStage(mon);return `<div class="monster-card ${compact?'compact':''}"><div class="monster-picture">${monsterArt(mon.species,stage)}</div><div class="spread"><strong>${esc(mon.nickname||c[1])}</strong><span class="tag">${stage}단계</span></div><p class="muted" style="margin:4px 0">${c[4]} ${c[2]} · 복습 ${mon.reviews||0}회 · 숙련 ${mon.mastered||0}</p><div class="bar"><div style="width:${Math.min(100,stage===3?100:stage===2?Math.min(100,(mon.reviews/30)*100):Math.min(100,(mon.reviews/8)*100))}%"></div></div>${!compact?`<button class="btn small ${db.monsters.partner===mon.id?'success':'secondary'}" style="margin-top:12px;width:100%" data-partner="${esc(mon.id)}">${db.monsters.partner===mon.id?'★ 나의 파트너':'파트너 지정'}</button>`:''}</div>`}
function deckStats(){let names=[...new Set(db.words.map(w=>w.deck))];return names.map(deck=>{let words=db.words.filter(w=>w.deck===deck);let correct=words.filter(w=>w.reps>0).length;return {deck,words,correct,qualifies:words.length>=4&&correct>=Math.min(10,words.length),claimed:db.monsters.claims.includes(deck)}})}
function claimMonster(deck){let item=deckStats().find(d=>d.deck===deck);if(!item||!item.qualifies||item.claimed)return;let ix=db.monsters.owned.length%SPECIES.length,sp=SPECIES[ix];db.monsters.owned.push({id:uid(),species:sp[0],nickname:sp[1],fromDeck:deck,reviews:0,mastered:0,created:Date.now()});db.monsters.claims.push(deck);if(!db.monsters.partner)db.monsters.partner=db.monsters.owned[0].id;save();toast(`🎉 ${sp[1]} 포획 성공!`);render()}
function growMonster(w,grade){ensureMonsters();let mon=db.monsters.owned.find(m=>m.id===db.monsters.partner);if(!mon)return;let k=`${mon.id}:${w.id}`;let log=db.monsters.reviews[k]||{count:0,mastered:false};log.count++;mon.reviews++;if(grade===2&&w.interval>=7&&!log.mastered){log.mastered=true;mon.mastered++}db.monsters.reviews[k]=log;}
function monstersView(){let owned=db.monsters.owned;return `<section class="hero game-hero"><div class="game-hero-copy"><span class="tag">◈ 몬스터 도감</span><h1>나의 몬스터 동료</h1><p class="muted">DAY별 단어를 학습하면 동료가 자동으로 합류해요. 파트너를 선택하고 복습으로 진화시키세요.</p><div class="flex"><span class="tag">보유 ${owned.length}마리</span><span class="tag">발견 ${new Set(owned.map(m=>m.species)).size} / ${SPECIES.length}종</span></div></div><div class="hero-monster">${monsterArt(owned.find(m=>m.id===db.monsters.partner)?.species||'voltkit',1)}</div></section><div class="spread"><h3 class="sectiontitle">나의 동료 · ${owned.length}마리</h3><span class="muted">파트너 변경 가능</span></div>${owned.length?`<div class="monster-grid">${owned.map(m=>creatureCard(m)).join('')}</div>`:'<div class="panel empty">🥚 아직 동료가 없어요. DAY 1의 단어 10개를 학습하면 첫 동료를 얻을 수 있어요.</div>'}<h3 class="sectiontitle">전체 몬스터 도감</h3><div class="monster-grid">${SPECIES.map(sp=>{let found=owned.some(m=>m.species===sp[0]);return `<div class="bestiary-slot ${found?'':'locked'}"><div class="monster-picture">${monsterArt(sp[0],1)}</div><strong>${found?esc(sp[1]):'???'}</strong><span class="muted">${found?sp[4]+' '+sp[2]:'미발견'}</span></div>`}).join('')}</div><div class="notice">자동 포획: 단어장에 단어 4개 이상을 넣고 그중 최대 10개를 처음 학습하면 한 마리가 합류합니다(단어장당 1회). 2단계 진화: 파트너 복습 8회 + 숙련 단어 3개, 3단계: 복습 30회 + 숙련 단어 8개.</div>`}
function autoClaimMonsters(){ensureMonsters();for(const d of deckStats()){if(!d.qualifies||d.claimed)continue;const ix=db.monsters.owned.length%SPECIES.length,sp=SPECIES[ix];db.monsters.owned.push({id:uid(),species:sp[0],nickname:sp[1],fromDeck:d.deck,reviews:0,mastered:0,created:Date.now()});db.monsters.claims.push(d.deck);if(!db.monsters.partner)db.monsters.partner=db.monsters.owned[0].id;toast('🎉 '+sp[1]+' 동료 획득! 도감에서 확인해 보세요.');}save()}

/* ====== 초등 필수 800단어 코스 · 기존 OCR 코드와 분리 ====== */
function seed800(){
 db.settings=db.settings||{};if(!Number.isInteger(db.settings.activeDay)||db.settings.activeDay<1||db.settings.activeDay>33)db.settings.activeDay=1;
 const existing=new Set(db.words.filter(w=>w.source==='elementary800').map(w=>String(w.day)+':'+w.order));
 let changed=false;
 WORDS800.forEach((item,i)=>{const k=item.day+':'+i;if(existing.has(k))return;
 db.words.push({id:'e800-'+i,en:item.en,ko:item.ko,pos:'',example:'',deck:item.day===0?'초등800 · 워밍업':item.day===-1?'초등800 · 기능어':`초등800 · DAY ${item.day}`,day:item.day,category:item.category,order:i,source:'elementary800',created:Date.now(),due:null,interval:0,ease:2.5,reps:0,miss:0});changed=true;});
 if(changed)save();
}
function activeDay(){return db.settings?.activeDay||1}
function courseWords(day){return db.words.filter(w=>w.source==='elementary800'&&w.day===day).sort((a,b)=>a.order-b.order)}
function dayComplete(day){const list=courseWords(day);return list.length>0&&list.every(w=>(w.reps||0)>0)}
function villageNextDay(index){const r=WORLD_REGIONS[index];if(!r)return 1;for(let d=r.start;d<=r.end;d++)if(!dayComplete(d))return d;return r.end}
function dayAccessible(day){const i=WORLD_REGIONS.findIndex(r=>day>=r.start&&day<=r.end);if(i<0)return false;return day<=villageNextDay(i)||dayComplete(day)}
function unlockedDay(){const remembered=Number(db.settings?.activeDay)||1;const ix=WORLD_REGIONS.findIndex(r=>remembered>=r.start&&remembered<=r.end);return villageNextDay(ix<0?0:ix)}
function currentGardenDay(){return unlockedDay()}
// Six optional bonus stops: preserve original day numbers and existing learning records.
const BONUS_STOPS=[{after:7,day:0,part:0,title:'워밍업 · 숫자와 색깔 ①',emoji:'🌈'},{after:14,day:-1,part:0,title:'기초 기능어 ①',emoji:'✨'},{after:21,day:0,part:1,title:'워밍업 · 숫자와 색깔 ②',emoji:'🌈'},{after:28,day:-1,part:1,title:'기초 기능어 ②',emoji:'✨'},{after:30,day:0,part:2,title:'워밍업 · 숫자와 색깔 ③',emoji:'🌈'},{after:32,day:-1,part:2,title:'기초 기능어 ③',emoji:'✨'}];
function bonusWords(stop){const a=courseWords(stop.day),from=Math.floor(a.length*stop.part/3),to=Math.floor(a.length*(stop.part+1)/3);return a.slice(from,to)}
function bonusComplete(stop){const a=bonusWords(stop);return a.length>0&&a.every(w=>(w.reps||0)>0)}
function startBonus(index){const stop=BONUS_STOPS[index];if(!stop||!dayComplete(stop.after)){toast('앞의 DAY를 먼저 완료해 줘!');return}const a=bonusWords(stop);if(!a.length){toast('보너스 단어 데이터가 없습니다. words800.js를 확인해 주세요.');return}session={ids:a.map(w=>w.id),idx:0,flip:false,kind:'bonus',bonusIndex:index,grades:{},seen:0};nav('study')}
function bonusNode(index){const b=BONUS_STOPS[index],open=unlockedDay()>b.after,complete=bonusComplete(b),a=bonusWords(b),count=a.filter(w=>(w.reps||0)>0).length;const star=bonusStars(index),x=[50,29,47,72,53,28][index];return `<div class="map-step bonus-map-step ${complete?'completed':''} ${open?'':'locked'}" style="--step-x:${x}%" id="bonus-${index}"><div class="map-scenery ${x>55?'left':'right'}" aria-hidden="true"><span>✨</span><i></i></div><button class="map-node bonus-map-node" data-bonus="${index}" ${open?'':'disabled'} aria-label="보너스 ${index+1}: ${b.title}"><span class="map-node-icon">${!open?'🔒':complete?'✓':'✦'}</span><span class="map-node-number">BONUS ${index+1}</span></button>${complete?`<div class="map-stars">${'★'.repeat(star)}${'☆'.repeat(3-star)}</div>`:''}<div class="bonus-map-label">${b.title} · ${count}/${a.length}</div></div>`}
function bonusStars(index){const x=db.bonusStars||{};return x[index]||1;}
function allDaysComplete(){return Array.from({length:33},(_,i)=>dayComplete(i+1)).every(Boolean)}
function bossStore(){db.finalBoss=db.finalBoss||{cleared:false,best:0,attempts:0,clearedAt:null};return db.finalBoss}
function finalBossNode(){const open=allDaysComplete(),cleared=bossStore().cleared;return `<div class="map-step final-map-step ${open?'':'locked'}" style="--step-x:50%" id="final-boss-node"><button class="map-node final-map-node" data-final-boss ${open?'':'disabled'}><span class="map-node-icon">${open?'🌼':'🔒'}</span><span class="map-node-number">GARDEN FESTIVAL</span></button><div class="final-map-caption">${cleared?'🏆 정원 축제 완료 · 다시 참여 가능':open?'마지막 정원 축제에 도전':'DAY 33 완료 후 해금'}</div></div>`}
let finalBattle=null;
function finalBossPool(){return db.words.filter(w=>w.source==='elementary800'&&w.day>=1&&w.day<=33&&(w.reps||0)>0&&w.ko&&!w.ko.startsWith('⚠'))}
function finalBossStart(){if(!allDaysComplete()){toast('DAY 33까지 완료해야 정원 축제가 열립니다.');return}const pool=finalBossPool();const questions=[];for(const [lo,hi] of [[1,10],[11,20],[21,33]]){const region=pool.filter(w=>w.day>=lo&&w.day<=hi).sort(()=>Math.random()-.5).slice(0,10);if(region.length<10){toast('이 구간에 학습한 단어가 부족합니다.');return}for(const w of region){const others=[...new Set(pool.filter(a=>a.ko!==w.ko).map(a=>a.ko))].sort(()=>Math.random()-.5).slice(0,3);if(others.length<3)return;questions.push({en:w.en,correct:w.ko,opts:[w.ko,...others].sort(()=>Math.random()-.5),id:w.id})}}const st=bossStore();st.attempts++;save();finalBattle={questions,idx:0,selected:null,correct:0,wrong:[],done:false};view='finalBoss';render();window.scrollTo(0,0)}
function finalBossAnswer(i){const b=finalBattle;if(!b||b.done||b.selected!==null)return;const q=b.questions[b.idx];b.selected=i;if(q.opts[i]===q.correct){b.correct++;award(10)}else{b.wrong.push(q.en);const w=db.words.find(x=>x.id===q.id);if(w){w.due=Date.now();w.miss=(w.miss||0)+1;save()}}render()}
function finalBossNext(){const b=finalBattle;if(!b||b.selected===null)return;b.idx++;b.selected=null;if(b.idx>=30){b.done=true;const st=bossStore();st.best=Math.max(st.best,b.correct);if(b.correct>=20&&!st.cleared){st.cleared=true;st.clearedAt=Date.now();award(500);ensureFinalRewards()}save()}render()}
function ensureFinalRewards(){const r=rewardStore();if(!r.items.some(x=>x.item==='영어 모험왕'))r.items.push({day:'FINAL',name:'마지막 정원 축제 완료',item:'정원 지킴이',emoji:'🏆',xp:500})}
function finalBossView(){const store=bossStore();if(!allDaysComplete())return `<section class="hero"><h2>🔒 마지막 정원 축제</h2><p>DAY 33을 완료하면 정원 축제가 열립니다.</p><button class="btn" data-go="home">지도 돌아가기</button></section>`;if(!finalBattle)return `<section class="hero game-hero"><div class="game-hero-copy"><span class="tag">🌼 GARDEN FESTIVAL</span><h1>마지막 정원 축제</h1><p>33일 동안 배운 단어로 도전하는 30문제 정원 축제! 20개 이상 맞히면 축제가 완성돼요.</p><p class="muted">최고 기록 ${store.best}/30 · 도전 ${store.attempts}회</p><button class="btn" id="finalStart">🌸 정원 축제 시작</button></div><div class="hero-monster"><div class="wg11-festival-art">🌳🌼🌷</div></div></section>`;const b=finalBattle;if(b.done)return `<section class="panel empty"><h1>${b.correct>=20?'🏆 정원 축제 성공!':'🌼 다시 도전해 보자!'}</h1><h2>${b.correct} / 30 정답</h2><p>${b.correct>=20?'다섯 마을에서 배운 단어로 축제를 완성했어요!':'20문제 이상 맞히면 정원 축제를 완성할 수 있어요.'}</p><p>최고 기록 ${store.best}/30 · 틀린 단어 ${b.wrong.length}개</p>${store.cleared?`<div class="notice">🏅 정원 지킴이 · 첫 클리어 ${new Date(store.clearedAt).toLocaleDateString('ko-KR')}</div><button class="btn secondary" onclick="window.print()">📜 졸업 기록 인쇄</button>`:''}<button class="btn" id="finalStart">🌼 다시 도전</button><button class="btn secondary" data-go="home">🏡 홈으로</button></section>`;const q=b.questions[b.idx],shown=b.selected!==null;return `<section class="final-battle-screen"><div class="battle-arena"><div class="spread"><strong>🌼 마지막 정원 축제</strong><span>단계 ${Math.floor(b.idx/10)+1}/3 · 문제 ${b.idx+1}/30</span></div><div class="wg11-mission-progress"><div style="width:${b.idx/30*100}%"></div></div><div class="wg11-festival-art">🌷 ✨ 🌼 ✨ 🌻</div><div class="muted" style="text-align:center">🌸 정답 ${b.correct}개 · 축제 완성 목표 20개</div></div><div class="panel final-question-panel"><div class="cardstudy battle-question"><h2>${esc(q.en)}</h2><button class="btn secondary small" id="speakMission" aria-label="단어 발음 다시 듣기">🔊 발음 듣기</button></div><div class="choices">${q.opts.map((x,i)=>`<button class="choice ${shown?(x===q.correct?'right':i===b.selected?'wrong':''):''}" data-final-answer="${i}" ${shown?'disabled':''}>${i+1}. ${esc(x)}</button>`).join('')}</div>${shown?`<p class="notice">${q.opts[b.selected]===q.correct?'✅ 정답! 꽃빛을 모았어요':'❌ 정답: '+esc(q.correct)}</p><button class="btn" id="finalNext" style="width:100%">${b.idx===29?'결과 확인':'다음 문제 →'}</button>`:''}</div></section>`}

function startDay(day){if(!db.words.some(w=>w.source==='elementary800'&&w.day===day)){seed800();}if(day>0&&!dayAccessible(day)){toast('이 마을의 이전 DAY부터 시작해 주세요.');return}if(day>0){db.settings.activeDay=day;save()}let a=courseWords(day);if(!a.length){toast('DAY 단어를 불러오지 못했어요. 설정에서 단어 데이터 또는 파일을 확인해 주세요.');return;}session={ids:a.map(w=>w.id),idx:0,flip:false,kind:'day',day,grades:{},seen:0};view='study';render();}
function startReview(){if(!db.words.length)seed800();const due=dueWords();if(!due.length){toast('지금 복습할 단어가 없어요. DAY 학습을 먼저 시작해 보세요!');return}session={ids:due.map(w=>w.id),idx:0,flip:false,kind:'review'};nav('study')}
const MILESTONES={1:{name:'첫 모험의 선물',xp:50,item:'첫걸음 배지',emoji:'🥇'},5:{name:'초보 탐험가 보물상자',xp:100,item:'초록 수정',emoji:'💎'},10:{name:'용감한 탐험가의 보물',xp:180,item:'황금 메달',emoji:'🏅'},20:{name:'대륙 횡단 보물',xp:300,item:'별빛 왕관',emoji:'👑'},33:{name:'800단어 모험 졸업',xp:500,item:'단어 마스터 훈장',emoji:'🏆'}};
function rewardStore(){db.rewards=db.rewards||{days:{},items:[],unseen:[]};return db.rewards;}
function checkDayRewards(){const r=rewardStore();let news=[];for(let day=1;day<=33;day++){if(r.days[day])continue;let a=courseWords(day);if(!a.length||!a.every(w=>(w.reps||0)>0))continue;r.days[day]=Date.now();const prize=MILESTONES[day];if(prize){r.items.push({day,...prize});r.unseen.push(day);award(prize.xp);news.push(prize.name+' +'+prize.xp+' XP');}else{award(15);news.push('DAY '+day+' 완료! +15 XP');}}
 if(news.length){save();toast('🎁 '+news.join(' / '));}}
function rewardsView(){const r=rewardStore();return `<h3 class="sectiontitle">🎁 DAY 클리어 보상</h3><div class="reward-grid">${Object.entries(MILESTONES).map(([day,x])=>`<div class="panel reward-card ${r.days[day]?'reward-earned':''}"><div class="reward-icon">${x.emoji}</div><strong>DAY ${day}</strong><p>${x.name}</p><small>${r.days[day]?'✅ 획득 완료':x.item+' · +'+x.xp+' XP'}</small></div>`).join('')}</div><p class="muted">매일의 DAY를 처음 끝내면 +15 XP! 특별 보상은 DAY 1·5·10·20·33에서 한 번씩만 받을 수 있어.</p>`;}
function regionFor(day){return day<=7?['🌳 초록 숲','forest']:day<=14?['🏜 모래 협곡','desert']:day<=21?['❄️ 눈꽃 산맥','snow']:day<=28?['🌌 별빛 고원','sky']:['🏰 마지막 성','castle']}
function starFor(day){db.dayStars=db.dayStars||{};return db.dayStars[day]||0}
function mapNodes(){
 const unlocked=unlockedDay();let html='';const xs=[50,29,47,72,53,28,48,73,50,29];
 for(let d=1;d<=33;d++){
  const [region,theme]=regionFor(d),complete=dayComplete(d),current=d===unlocked,locked=d>unlocked,star=starFor(d),special=!!MILESTONES[d];
  const x=xs[(d-1)%10],prior=xs[(d-2+10)%10];
  if([1,8,15,22,29].includes(d))html+=`<div class="map-region ${theme}" id="region-${d}" data-region-start="${d}"><span>${region}</span><small>${d===29?'DAY 29–33 · BONUS 5·6 · FINAL':'DAY '+d+'–'+(d+6)+' · BONUS '+(Math.floor((d-1)/7)+1)}</small></div>`;
  const link=d>1?`<svg class="map-connector ${locked?'muted-path':'passed-path'}" viewBox="0 0 100 112" preserveAspectRatio="none" aria-hidden="true"><path d="M ${prior} -4 C ${prior} 36, ${x} 34, ${x} 70"/></svg>`:'';
  const progress=current?courseWords(d).filter(w=>(w.reps||0)>0).length:0;
  const scenery={forest:['🌲','🌳','🍄','🌿','🌲','🌷','🌳','🍃','🪵','🌲'],desert:['🏜️','🌵','🪨','🌵','🦂','🪨','🏜️','🌵','🪨','🌵'],snow:['🏔️','❄️','🌲','🧊','🏔️','⛄','❄️','🌲','🧊','🏔️'],sky:['🌟','☁️','🌙','✨','🌠','⭐','☄️'],castle:['🗼','⚔️','🏰']}[theme];
  const scenicIcon=scenery[(d-1)%scenery.length];
  const scenicSide=x>55?'left':'right';
  html+=`<div class="map-step ${theme} ${complete?'completed':''} ${current?'current':''} ${locked?'locked':''}" style="--step-x:${x}%" id="map-day-${d}" data-map-target="${d}">${link}<div class="map-scenery ${scenicSide}" aria-hidden="true"><span>${scenicIcon}</span><i></i></div><button class="map-node ${special?'milestone':''}" data-map-day="${d}" ${locked?'disabled':''} aria-label="DAY ${d} ${complete?'완료, 다시 도전':current?'오늘의 모험 시작':'잠김'}"><span class="map-node-icon">${locked?'🔒':complete?(special?'🎁':'✓'):special?'👑':'⚔️'}</span><span class="map-node-number">${d}</span></button>${current?`<div class="map-current-label">▶ 여기서 시작 · ${progress}/${courseWords(d).length}</div>`:''}${complete?`<div class="map-stars" aria-label="별 ${star}개">${'★'.repeat(star)}${'☆'.repeat(3-star)}</div>`:''}${special?'<span class="map-gift">🎁</span>':''}</div>`;
  const bonusIndex=BONUS_STOPS.findIndex(b=>b.after===d);if(bonusIndex>=0)html+=bonusNode(bonusIndex);
 }
 return html+finalBossNode();
}
function gardenGrowth(){
 const words=db.words.filter(w=>Number(w.day)>=1&&Number(w.day)<=33);
 // Course membership is calculated from the canonical DAY lists rather than optional word.day.
 const all=Array.from({length:33},(_,i)=>courseWords(i+1));
 const total=all.reduce((n,day)=>n+day.length,0);
 const learned=all.reduce((n,day)=>n+day.filter(w=>(w.reps||0)>0).length,0);
 const strong=all.reduce((n,day)=>n+day.filter(w=>(w.interval||0)>=7).length,0);
 const pct=total?Math.round(learned/total*100):0;
 const flowerLevel=learned===0?0:learned<50?1:learned<150?2:learned<350?3:learned<600?4:5;
 const icons=['🌱','🌿','🌷','🌼','🌻','🌺'];
 const captions=['첫 씨앗을 심어 보세요','새싹이 고개를 내밀었어요','첫 꽃이 피기 시작했어요','정원이 조금씩 풍성해져요','꽃향기가 마을에 퍼지고 있어요','멋진 단어 정원을 가꿨어요'];
 const flowers=Array.from({length:12},(_,i)=>{const thresholds=[1,8,20,40,70,110,160,230,310,400,520,650];const grown=learned>=thresholds[i];return `<div class="growth-plot ${grown?'bloomed':'seeded'}" title="${grown?thresholds[i]+'단어 성장 달성':thresholds[i]+'단어 학습 시 개화'}" aria-label="${grown?'꽃이 핀 화단':'아직 씨앗인 화단'}"><span>${grown?['🌷','🌼','🌻','🌸','🪻','🌺'][i%6]:'🌱'}</span></div>`}).join('');
 return `<section class="growth-garden" aria-label="나의 단어 정원"><div class="growth-head"><div><span class="garden-kicker">MY WORD GARDEN</span><h2>${icons[flowerLevel]} 나의 단어 정원</h2><p>${captions[flowerLevel]}</p></div><div class="growth-count"><strong>${learned.toLocaleString()}</strong><small>배운 단어 / ${total.toLocaleString()}</small></div></div><div class="growth-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="단어 학습률"><span style="width:${pct}%"></span></div><div class="growth-numbers"><span>🌱 학습 진도 ${pct}%</span><span>🌸 오래 기억한 단어 ${strong}개</span></div><div class="growth-plots" aria-hidden="true">${flowers}</div><p class="growth-tip">단어를 처음 학습할 때마다 새싹이 자라고, 학습한 단어가 쌓이면 꽃이 피어요.</p></section>`;
}
function legacyVillageHome(){
 const current=unlockedDay(),done=Array.from({length:33},(_,i)=>dayComplete(i+1)).filter(Boolean).length;
 const due=dueWords().length,finished=done===33,regions=[['🌷 꽃향기 마을','1–7',1,7],['🍑 햇살 과수원','8–14',8,14],['❄️ 눈송이 마을','15–21',15,21],['🌙 별빛 언덕','22–28',22,28],['🏡 바람꽃 마을','29–33',29,33]];
 const spots=[{x:20.5,y:61.5},{x:28,y:86},{x:85,y:79.5},{x:70.4,y:49},{x:55.4,y:42},{x:35.1,y:42},{x:47.1,y:60.7}];
 const markers=spots.map((p,i)=>{const d=i+1,complete=dayComplete(d),locked=d>current,stars=starFor(d),n=courseWords(d).filter(w=>(w.reps||0)>0).length;return `<button class="garden-stage ${complete?'done':''} ${!locked&&!complete?'current':''} ${locked?'locked':''}" style="left:${p.x}%;top:${p.y}%" data-map-day="${d}" ${locked?'disabled':''} aria-label="DAY ${d} ${complete?'완료':locked?'잠김':'시작'}">${locked?'🔒':complete?'✓':d}<small>DAY ${d}</small>${!locked&&!complete&&n?`<span class="garden-day-progress">${n}/${courseWords(d).length}</span>`:''}${complete?`<span class="garden-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span>`:''}</button>`}).join('');
 const bonus=BONUS_STOPS[0],bonusOpen=current>7,bonusDone=bonusComplete(bonus);
 const bonusMarker=`<button class="garden-stage garden-bonus ${bonusDone?'done':''} ${bonusOpen?'':'locked'}" style="left:67%;top:83.8%" data-bonus="0" ${bonusOpen?'':'disabled'} aria-label="꽃향기 보너스">${bonusDone?'✓':bonusOpen?'✿':'🔒'}<small>BONUS 1</small></button>`;
 const future=regions.slice(1).map(([name,range,from,to],idx)=>{
  const unlocked=current>=from;
  const completed=Array.from({length:to-from+1},(_,i)=>dayComplete(from+i)).filter(Boolean).length;
  const learned=Array.from({length:to-from+1},(_,i)=>courseWords(from+i)).flat().filter(w=>(w.reps||0)>0).length;
  const total=Array.from({length:to-from+1},(_,i)=>courseWords(from+i).length).reduce((a,b)=>a+b,0);
  const progress=total?Math.round(learned/total*100):0;
  const positions=[[17,68],[29,47],[42,71],[55,39],[68,65],[81,42],[88,75]];
  const route=positions.slice(0,to-from+1).map(([x,y],j)=>`${j?'L':'M'} ${x*10} ${y*5.63}`).join(' ');
  const stageMarkers=positions.slice(0,to-from+1).map(([x,y],i)=>{const d=from+i,locked=d>current,complete=dayComplete(d),n=courseWords(d).filter(w=>(w.reps||0)>0).length;return `<button data-map-day="${d}" id="map-day-${d}" style="left:${x}%;top:${y}%" class="garden-stage ${complete?'done':d===current?'current':''} ${locked?'locked':''}" ${locked?'disabled':''} aria-label="DAY ${d} ${locked?'잠김':complete?'완료':'학습'}">${locked?'🔒':complete?'✓':d}<small>DAY ${d}</small>${!locked&&!complete&&n?`<span class="garden-day-progress">${n}/${courseWords(d).length}</span>`:''}${complete?`<span class="garden-stars">${'★'.repeat(starFor(d))}</span>`:''}</button>`}).join('');
  const bonusMarkers=BONUS_STOPS.map((b,i)=>({b,i})).filter(x=>x.b.after>=from&&x.b.after<=to).map(({b,i},j)=>`<button class="garden-stage garden-bonus ${bonusComplete(b)?'done':''} ${current>b.after?'':'locked'}" style="left:${j?74:51}%;top:88%" data-bonus="${i}" ${current>b.after?'':'disabled'} aria-label="BONUS ${i+1}">${bonusComplete(b)?'✓':current>b.after?'✿':'🔒'}<small>BONUS ${i+1}</small></button>`).join('');
  const plants=Array.from({length:10},(_,i)=>{const threshold=Math.ceil(total*(i+1)/10),grown=learned>=threshold;const coordinates=[[10,35],[24,25],[36,88],[46,19],[61,86],[73,25],[91,27],[12,87],[53,83],[84,91]][i];const species=[['🌳','🍑','🌻'],['🌲','❄️','⛄'],['🌙','✨','🌟'],['🌸','🌷','🌿']][idx];return `<span class="map-plant ${grown?'grown':'seed'}" style="left:${coordinates[0]}%;top:${coordinates[1]}%" title="${threshold}단어 학습하면 성장" aria-hidden="true">${grown?species[i%3]:'🌱'}</span>`}).join('');
  return `<section class="garden-next garden-map-card" id="region-${from}" aria-label="${name} 지도"><div class="garden-region-name"><span class="garden-region-emoji">${['🍑','❄️','🌙','🏡'][idx]}</span><div><strong>${name}</strong><p>DAY ${range} · ${completed}/${to-from+1} 완료 · ${learned}/${total} 단어</p></div><span class="v4-region-pct">${progress}%</span></div><div class="v4-meter"><span style="width:${progress}%"></span></div><div class="v4-map-scroll"><div class="v4-landscape v4-landscape-${idx+2}"><img src="region-${idx+2}.svg" class="v4-map-backdrop" alt="" aria-hidden="true"><svg class="v4-map-route" viewBox="0 0 1000 563" preserveAspectRatio="none" aria-hidden="true"><path d="${route}"/></svg>${plants}${stageMarkers}${bonusMarkers}</div></div><p class="v4-landscape-caption">${unlocked?'🌼 학습할수록 새싹이 꽃과 나무로 자라요.':'🔒 앞 마을의 학습을 마치면 새로운 길이 열려요.'}</p></section>`;
 }).join('');
 return `<section class="garden-welcome"><div><span class="garden-kicker">WORD GARDEN · 나만의 영어 산책</span><h1>🌷 오늘도, 단어 꽃이 피어요</h1><p>작은 마을을 산책하면서 영어 단어를 하나씩 익혀요.</p><div class="garden-chips"><span>☀️ ${streak()}일 연속</span><span>🌼 DAY ${done}/33</span><span>✨ ${db.xp.toLocaleString()} XP</span></div></div><div class="garden-welcome-art" aria-hidden="true">🐰🌸</div></section>
 <section class="garden-actions"><button class="garden-primary" ${finished?'data-final-boss':`data-start-day="${current}"`}>🌱 ${finished?'마지막 이야기':'오늘의 산책 시작'} <small>${finished?'최종 도전':`DAY ${current} · ${courseWords(current).filter(w=>(w.reps||0)>0).length}/${courseWords(current).length} 단어`}</small></button><button class="garden-review" data-start-review>🫖 기억 돌보기 <small>복습할 단어 ${due}개</small></button></section>
 ${gardenGrowth()}<div class="garden-open-line"><button class="btn" data-nav="garden">🌷 나의 정원으로 가기 →</button><span>학습하면 꽃이 자라고, 장식은 직접 꾸며요</span></div>
 <div class="garden-section-title"><h2>🗺️ 마을 산책 지도</h2><span>스테이지를 눌러 학습해요</span></div>
 <div class="garden-scroll" id="region-1"><section class="garden-board" aria-label="꽃향기 마을 지도"><img src="flower-village-v7.svg" class="garden-backdrop" alt="꽃과 나무, 토끼 집, 작은 가게, 연못이 있는 꽃향기 마을"><div class="garden-map-sign"><strong>🌷 꽃향기 마을</strong><small>첫 번째 산책 · DAY 1–7</small></div><svg class="garden-route" viewBox="0 0 1000 563" preserveAspectRatio="none" aria-hidden="true"><path d="M205 345 C220 400 245 457 280 487 C395 540 650 545 856 456 C825 390 766 303 704 276 C620 242 574 243 554 225 C478 224 404 225 351 240 C395 285 437 320 471 342"/></svg>${markers}${bonusMarker}</section></div>
 <div class="wg14-garden-tools"><span>✋ 장식 드래그 이동 · 장식 선택 후 크기 변경</span><button type="button" class="btn secondary small" id="decorSmaller">− 작게</button><button type="button" class="btn secondary small" id="decorBigger">＋ 크게</button><span id="decorSizeText">${gardenActivePlacement!==null&&g.placements[gardenActivePlacement]?Math.round(gardenPlaced(g.placements[gardenActivePlacement],gardenActivePlacement).scale*100)+"%":"장식을 선택하세요"}</span></div><p class="garden-map-hint">🌼 살구색은 지금 배울 DAY, 초록색은 완료한 DAY예요. 모바일에서는 지도를 좌우로 움직여 보세요.</p>
 <div class="garden-section-title"><h2>🍃 네 개의 새로운 마을</h2><span>DAY 8–33 · 정원이 자라나는 지도</span></div><div class="garden-regions">${future}</div>
 <section class="garden-finale panel"><div>🎊 <strong>마지막 축제</strong><p>33일의 산책을 완주하면 특별한 도전이 기다려요.</p></div><button class="btn secondary" data-final-boss ${finished?'':'disabled'}>${finished?'축제 입장':'🔒 DAY 33 이후'}</button></section>
 <p class="garden-map-hint">모든 학습 기록은 이 기기의 브라우저에 저장됩니다. 기존 WordQuest 백업도 설정에서 가져올 수 있어요.</p>`;
}
// WORD GARDEN v8: one continuous world map. The learning engine and saved progress stay unchanged.
const WORLD_REGIONS=[
 {name:'꽃향기 마을',icon:'🌸',start:1,end:7,sky:'#f5dce7',ground:'#b9d7a2',house:'#e3b3a5'},
 {name:'햇살 과수원',icon:'🍑',start:8,end:14,sky:'#f7e5c1',ground:'#c8dca0',house:'#e4bd84'},
 {name:'눈송이 마을',icon:'❄️',start:15,end:21,sky:'#e5f1f7',ground:'#c4dce0',house:'#acc9da'},
 {name:'별빛 언덕',icon:'🌙',start:22,end:28,sky:'#dcdcf0',ground:'#a6b5cd',house:'#ad9abf'},
 {name:'바람꽃 마을',icon:'🌼',start:29,end:33,sky:'#f4e8d7',ground:'#b8d4ac',house:'#dbbd9a'}
];
function worldView(){
 const totalDone=Array.from({length:33},(_,i)=>dayComplete(i+1)).filter(Boolean).length;
 const cards=WORLD_REGIONS.map((r,i)=>{
   const next=villageNextDay(i),count=r.end-r.start+1,done=Array.from({length:count},(_,j)=>dayComplete(r.start+j)).filter(Boolean).length;
   const flower=wg9FlowerStates()[i];
   const flowerVisual=flower.level===0?'<div class="wg20-empty-bed" aria-label="아직 꽃이 자라지 않는 화단">🌱<small>학습 전 · 빈 화단</small></div>':`<div class="wg20-world-flower wg20-growth-${flower.level}">${wg9FlowerArt(flower)}</div>`;
   const dots=Array.from({length:count},(_,j)=>{const d=r.start+j,finished=dayComplete(d),available=dayAccessible(d);return `<button class="wg12-day ${finished?'done':d===next?'now':''}" data-map-day="${d}" ${available?'':'disabled'} title="DAY ${d}" aria-label="DAY ${d}">${finished?'✓':d}</button>`}).join('');
   const bonus=BONUS_STOPS.map((b,j)=>({b,j})).filter(({b})=>b.after>=r.start&&b.after<=r.end).map(({b,j})=>`<button class="wg12-bonus" data-bonus="${j}" ${dayComplete(b.after)?'':'disabled'} title="${b.title}">✦</button>`).join('');
   return `<section class="wg12-village" style="--vsky:${r.sky};--vground:${r.ground};--vaccent:${r.house}"><div class="wg12-village-land" aria-hidden="true"><span>${r.icon}</span><i>✿</i></div><div class="wg12-village-content"><div class="wg12-village-head"><strong>${r.icon} ${r.name}</strong><small>${done}/${count} DAY</small></div><div class="wg20-village-flower"><div class="wg20-village-flower-art">${flowerVisual}</div><div class="wg20-village-flower-info"><strong>${flower.icon} ${flower.name}</strong><small>대표 꽃 · ${flower.level===0?'아직 시작 전':flower.level===4?'활짝 만개':flower.level+'/4 단계'}</small><div class="wg20-flower-meter"><span style="width:${flower.rate}%"></span></div><small>성장 ${flower.rate}% · ${done}/${count} DAY</small></div></div><div class="wg12-dots">${dots}${bonus}</div><button class="wg12-enter" data-start-day="${next}">▶ ${done===count?'다시 학습하기':'이 마을 이어서 학습'}</button></div></section>`;
 }).join('');
 const open=allDaysComplete();return `<section class="wg12-world-top"><h1>🗺️ 다섯 마을, 하나의 정원 여행</h1><p>다섯 마을이 한눈에 보여요. 마을마다 대표 꽃이 하나씩 있어요. DAY 학습을 마치면 해당 꽃이 정원과 지도에서 함께 자라요.</p><div>🌷 완료한 DAY <b>${totalDone}/33</b> · ✨ 보너스 ${BONUS_STOPS.filter(b=>bonusComplete(b)).length}/6</div></section><div class="wg12-world-grid">${cards}<section class="wg12-village wg12-last"><div class="wg12-last-icon">🌸✨</div><h3>마지막 정원 축제</h3><p>5개 마을의 모든 DAY를 완료하면 열려요.</p><button class="btn" data-final-boss ${open?'':'disabled'}>${open?'정원 축제 시작':'🔒 준비 중'}</button></section></div>`;
}

// Word Garden v9: one permanent flower for each village. Progress comes from completed DAYs.
const WG9_FLOWERS=[
 {name:'튤립',icon:'🌷',color:'#e697ae',inner:'#f6c2ce'},
 {name:'장미',icon:'🌹',color:'#cc7799',inner:'#e9acbd'},
 {name:'동백',icon:'🌺',color:'#eb8183',inner:'#ffd0bd'},
 {name:'라벤더',icon:'🪻',color:'#9e91d3',inner:'#d9c7ef'},
 {name:'데이지',icon:'🌼',color:'#f2db79',inner:'#fff6c8'}
];
const WG9_BEDS=[{x:22,y:48},{x:49,y:30},{x:73,y:56},{x:50,y:76},{x:21,y:81}];
function wg9FlowerStates(){
 return WORLD_REGIONS.map((r,i)=>{
  const count=r.end-r.start+1;
  const done=Array.from({length:count},(_,j)=>dayComplete(r.start+j)).filter(Boolean).length;
  return {...WG9_FLOWERS[i],village:r.name,range:[r.start,r.end],count,done,rate:Math.round(done/count*100),level:done===0?0:done===count?4:Math.min(3,Math.ceil(done/count*3))};
 });
}
function wg9CurrentFlower(){const list=wg9FlowerStates();const d=unlockedDay();const i=WORLD_REGIONS.findIndex(r=>d>=r.start&&d<=r.end);return list[Math.max(0,i)]||list[0]}
const WG19_FLOWER_FILES=['tulip','rose','camellia','lavender','daisy'];
function wg9FlowerArt(f){
 const index=WG9_FLOWERS.findIndex(o=>o.name===f.name);
 if(index<0)return '';
 if(!f.level)return ''; // 0단계: 아직 심지 않은 빈 화단
 const stage=Math.min(4,Math.max(1,f.level));
 return `<img class="wg19-sprite" src="assets/flowers/${WG19_FLOWER_FILES[index]}_${stage}.png" alt="${f.name} ${['씨앗','새싹','꽃봉오리','개화','만개'][f.level]}" loading="lazy">`;
}
function wg19GardenIllustration(id){
 if(['bench','pot','lamp','bird','mushroom','arch'].includes(id))return `<img class="wg19-sprite" src="assets/decor/${id}.png" alt="" draggable="false">`;
 return gardenIllustration(id);
}
function wg9GardenPreview(){const fs=wg9FlowerStates(),g=gardenState();return `<div class="wg9-preview-scene"><img src="assets/garden-c.png" alt="" aria-hidden="true" class="wg9-scene-bg">${fs.map((f,i)=>f.level===0?'':`<div class="wg9-preview-flower ${f.level>0?'living':''} ${f.level>0&&f.level<4?'growing':''}" style="left:${WG9_BEDS[i].x}%;top:${WG9_BEDS[i].y}%" title="${f.village} · ${f.name} ${f.rate}%">${wg9FlowerArt(f)}</div>`).join('')}${Object.entries(g.placements).map(([key,raw])=>{const place=gardenPlaced(raw,Number(key));return place?`<span class="wg9-preview-decoration" style="left:${place.x}%;top:${place.y}%;transform:translate(-50%,-50%) scale(${place.scale})">${wg19GardenIllustration(place.id)}</span>`:''}).join('')}</div>`}
function home(){
 const current=unlockedDay(),due=dueWords().length,finished=allDaysComplete(),fs=wg9FlowerStates(),f=wg9CurrentFlower(),idx=fs.indexOf(f),complete=fs.filter(x=>x.done===x.count).length;
 return `<section class="wg9-hero"><div class="wg9-hero-row"><div class="wg9-hero-copy"><span class="garden-kicker">🌷 WORD GARDEN</span><h1>나의 단어 정원</h1><p>☀️ ${streak()}일 연속 · Lv.${Math.floor(db.xp/200)+1} · ${db.xp.toLocaleString()} XP</p><strong class="wg9-flower-name">${f.icon} ${f.name} · ${f.level===4?'만개':f.level===3?'개화':f.level===2?'꽃봉오리':f.level===1?'새싹':'씨앗'}</strong><div class="wg9-flower-sub">${f.village} · ${finished?'모든 DAY 완료':`DAY ${current}`} · ${f.done}/${f.count} DAY 완료</div></div><div class="wg9-hero-flower">${wg9FlowerArt(f)}<span>${f.rate}% 성장</span></div></div><div class="wg9-meter" role="progressbar" aria-label="현재 꽃 성장률" aria-valuenow="${f.rate}" aria-valuemin="0" aria-valuemax="100"><span style="width:${f.rate}%"></span></div><div class="wg9-hero-meta"><span>${finished?'다섯 꽃을 모두 키웠어요!':`다음 꽃 성장까지 DAY 완료 ${Math.min(f.count,f.done+1)} / ${f.count}`}</span><span>마을 ${Math.min(idx+1,5)} / 5</span></div><div class="wg8-primary-actions"><button class="wg8-learn" ${finished?'data-final-boss':`data-start-day="${current}"`}>📖 <strong>이어서 학습</strong><small>${finished?'마지막 축제로':`DAY ${current} · 바로 학습하기`}</small></button><button class="wg8-review" data-start-review>🌿 <strong>기억 키우기</strong><small>복습할 단어 ${due}개</small></button></div></section><section class="wg9-garden-card"><div class="wg9-garden-heading"><div><h2>🌼 나의 정원</h2><p>완성한 꽃 ${complete}송이 · 지금 자라는 꽃 ${fs.filter(x=>x.level>0&&x.level<4).length}송이</p></div><button class="btn secondary small" data-nav="garden">정원 꾸미기 →</button></div><button class="wg9-preview-button" data-nav="garden" aria-label="나의 정원을 열어 꾸미기">${wg9GardenPreview()}</button><p class="wg9-garden-tip">각 마을의 DAY를 완료할수록 대표 꽃이 자라요. 완성된 꽃은 정원에 그대로 남습니다.</p></section>`;
}

function course(){return worldView()}
function settingsView(){return `<div class="panel"><h3>🎒 정원 학습 도구</h3><div class="flex"><button class="btn" data-start-review>🌿 기억 키우기</button><button class="btn secondary" data-go="deck">📖 단어장 관리</button><button class="btn secondary" data-start-day="0">🌈 워밍업 · 숫자와 색깔</button><button class="btn secondary" data-start-day="-1">✨ 기초 기능어</button></div></div>`+`<div class="panel" style="margin-top:14px"><h3>📘 게임 설명서</h3><p class="muted">정원 지도, DAY별 학습, 단어 미션, 꽃 성장과 꾸미기 안내</p><a class="btn secondary" href="manual.html" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none">📖 사용 매뉴얼 열기 ↗</a></div><section class="hero"><span class="tag">⚙ 환경 설정</span><h1>설정과 학습 데이터</h1><p class="muted">이 기기의 학습 기록을 관리합니다. 계정·기기 간 자동 동기화는 지원하지 않습니다.</p></section><div class="grid2"><div class="panel"><h3>📦 데이터 백업</h3><p class="muted">단어, 복습 기록, XP, 꽃잎과 정원 꾸미기 기록을 JSON 파일로 저장합니다.</p><button class="btn secondary" id="settingsBackup">⬇ 백업 다운로드</button></div><div class="panel"><h3>📂 백업 복원</h3><p class="muted">기존 기록을 백업 파일로 교체합니다. 복원 전에 먼저 백업하세요.</p><button class="btn secondary" id="settingsRestore">⬆ 백업 가져오기</button><input class="hidden" type="file" id="settingsImportFile" accept=".json,application/json"></div></div><div class="panel" style="margin-top:16px"><h3>🎯 모험 설정</h3><label for="settingsDay">지금 열려 있는 DAY</label><select id="settingsDay">${Array.from({length:33},(_,i)=>`<option value="${i+1}" ${activeDay()===i+1?'selected':''}>DAY ${i+1}</option>`).join('')}</select><p class="muted">앞의 DAY를 끝내면 다음 DAY가 자동으로 열립니다.</p></div><div class="panel" style="margin-top:16px;border-color:#b65b76"><h3>⚠ 전체 초기화</h3><p class="muted">학습·복습 이력, XP, 꽃잎과 정원 꾸미기 기록, 설정 및 추가한 개인 단어를 모두 지웁니다. 기본 800단어만 새 상태로 다시 등록됩니다. 취소할 수 없습니다.</p><button class="btn danger" id="resetAll">🗑 모든 진행 기록 초기화</button></div><p class="footer">WORD GARDEN · 학습과 정원 기록은 현재 브라우저에 저장됩니다.</p>`}

function oldHome(){let known=db.words.filter(w=>w.interval>=7).length,due=dueWords().length,level=Math.floor(db.xp/200)+1,progress=db.xp%200,partner=db.monsters.owned.find(m=>m.id===db.monsters.partner);return `<section class="hero game-hero"><div class="game-hero-copy"><span class="tag">⚡ 오늘의 퀘스트</span><h1>외우고, 포획하고,<br>진화시켜라!</h1><p class="muted">교과서 속 단어가 몬스터와 만나는 모험.</p><div class="flex"><button class="btn" data-go="scan">📸 단어 수집</button><button class="btn secondary" data-go="study">✦ 단어 훈련 ${due}개</button></div></div><div class="hero-monster">${monsterArt(partner?.species||'voltkit',partner?monsterStage(partner):1)}<div class="hero-monster-title">${partner?'나의 파트너 '+esc(partner.nickname):'첫 동료를 만나보세요'}</div></div></section><div class="stats"><div class="stat"><span class="muted">⚡ 총 XP</span><strong>${db.xp.toLocaleString()}</strong></div><div class="stat"><span class="muted">🔥 연속 학습</span><strong>${streak()}일</strong></div><div class="stat"><span class="muted">◈ 동료 몬스터</span><strong>${db.monsters.owned.length}마리</strong></div></div><h3 class="sectiontitle">레벨과 성장</h3><div class="panel"><div class="spread"><strong>Lv. ${level} → Lv. ${level+1}</strong><span class="muted">${progress}/200 XP</span></div><div class="bar" style="margin:14px 0"><div style="width:${progress/2}%"></div></div><div class="muted">기억한 단어 ${known}개 · 현재 복습 ${due}개 · 전체 단어 ${db.words.length}개</div></div><div class="panel" style="margin-top:16px"><strong>🛡 나의 용사 육성</strong><p class="muted">영단어 훈련과 퀴즈 XP로 용사를 키워보세요.</p><button class="btn secondary small" data-go="hero">용사 성장 확인 →</button></div><h3 class="sectiontitle">오늘의 학습</h3><div class="grid2"><div class="panel"><strong>🧠 오늘의 단어 훈련</strong><p class="muted">새 단어 학습과 반복 훈련으로 성장해요.</p><button class="btn small" data-go="study">훈련 시작</button></div><div class="panel"><strong>⚔ 몬스터 배틀</strong><p class="muted">시험 대비 4지선다 퀴즈</p><button class="btn small secondary" data-go="quiz">보스와 대결</button></div></div><h3 class="sectiontitle">나의 모험 · 기타</h3><div class="grid2"><div class="panel"><strong>🥚 몬스터 연구소</strong><p class="muted">학습 보상으로 몬스터를 포획하고 육성해요.</p><button class="btn success small" data-go="monsters">연구소 가기</button></div><div class="panel"><strong>🎒 체험용 단어장</strong><p class="muted">테스트용 단어 10개를 추가해 볼 수 있어요.</p><button class="btn small secondary" id="seedDemo" ${db.words.some(w=>w.deck==='체험: 중학 필수단어')?'disabled':''}>연습 데이터 추가</button></div></div><p class="footer">현재 학습 데이터는 이 브라우저에 저장됩니다. PC·스마트폰 간 자동 동기화는 아직 지원하지 않습니다.</p>`}
function seedDemo(){if(db.words.some(w=>w.deck==='체험: 중학 필수단어'))return;SAMPLE.forEach(row=>db.words.push({id:uid(),en:row[0],ko:row[1],pos:row[2],example:row[3],deck:'체험: 중학 필수단어',created:Date.now(),due:Date.now(),interval:0,ease:2.5,reps:0,miss:0}));save();toast('체험 단어장 10개가 생성됐어요!');nav('study')}

let pendingImage=null;
let captureDeck='영어 단어 '+today(), captureLast=[],captureTotal=0,capturePhotos=0,captureStatus='',scanBusy=false;
function scan(){
 const dubious=db.words.filter(w=>w.deck===captureDeck&&w.needsReview).length;
 return `<section class="hero"><span class="tag">📷 v0.5 · 연속 촬영</span><h1>찍으면 단어장 완성!</h1><p class="muted">사진 찍기, 파일 선택, 복사한 이미지 붙여넣기(Ctrl+V) · 모두 무료</p>
<label for="deckname">모으고 있는 단어장</label><input id="deckname" value="${esc(captureDeck)}" placeholder="예: 중1 영어 3과">
<div class="scan-actions"><button class="btn" id="cameraBtn">📸 사진 찍기</button><button class="btn secondary" id="uploadBtn">🖼 사진 여러 장 선택</button></div>
<input class="hidden" type="file" id="cameraInput" accept="image/*" capture="environment"><input class="hidden" type="file" id="uploadInput" accept="image/*" multiple>
<div id="dropZone" class="drop-zone" tabindex="0">📋 복사한 사진 붙여넣기 · 파일 드래그<small>PC: Ctrl+V / Mac: ⌘V</small></div>
<div id="previewArea" class="${captureStatus?'':'hidden'}"><p class="muted" id="ocrStatus" aria-live="polite">${esc(captureStatus)}</p></div>
${lastOcrText?`<details class="panel" style="margin-bottom:15px"><summary style="cursor:pointer">🔍 인식 원문 보기 (마지막 사진)</summary><pre style="white-space:pre-wrap;font-size:12px;color:#c8d9f8;max-height:260px;overflow:auto;margin:10px 0 0">${esc(lastOcrText)}</pre></details>`:''}
<div class="panel"><strong>📚 이번 단어장: ${esc(captureDeck)}</strong><p class="muted">이번 촬영 ${capturePhotos}장 · 추가된 단어 ${captureTotal}개 · ⚠ 확인 필요 ${dubious}개</p><div class="flex"><button class="btn success" id="trainNow" ${!db.words.length?'disabled':''}>✦ 단어 훈련 시작</button><button class="btn secondary small" id="seeDeck">단어장 보기</button><button class="btn secondary small" id="undoCapture" ${!captureLast.length?'disabled':''}>↶ 마지막 등록 취소</button></div></div>
<div class="notice">단어와 뜻이 나란히 있는 사진을 우선 지원합니다. 한 페이지씩, 정면에서, 그림자 없이 찍으면 인식률이 올라가요. 확실하지 않은 글자는 ⚠ 표시하고, 잘못 읽힌 결과는 수정할 수 있습니다. 초기 OCR 엔진 다운로드에는 인터넷이 필요하며 API 사용료는 없습니다.</div>
<div class="flex"><button class="btn secondary small" id="demoBtn">예시 단어 추가</button><button class="btn secondary small" id="pasteTextToggle">텍스트 붙여넣기</button></div><div id="manualText" class="hidden" style="margin-top:12px"><textarea id="sourceText" placeholder="apple 사과&#10;book 책"></textarea><button class="btn" id="textImportBtn">같은 단어장에 추가</button></div></section>`;
}

/* ================= OCR v0.5 ================= */
// 가로줄 단위로 읽기. 결과가 나쁘면 '4'(열 단위)나 '3'(자동)으로 바꿔 비교해 보세요.
const OCR_PSM='6';
let lastOcrText='',ocrWorkerPromise=null;
const KO=/[가-힣]/;

function cleanMeaning(t){
 return String(t||'')
  .replace(/\[[^\]가-힣]*\]/g,' ')                    // [발음기호]
  .replace(/\/[^\/가-힣]*\//g,' ')                    // /발음기호/ (한글이 들어 있으면 보존)
  .replace(/[□■●◯◌✓☑]+/g,' ')
  .replace(/^\s*\d{1,3}[.)]\s*/,'')
  .replace(/^\s*(?:n|v|adj|adv|prep|conj|pron|int)\.\s*/i,'')
  .replace(/^\s*[\[(〈【<]\s*[명동형부전접대감]\s*[\])〉】>]\s*/,'') // [명] (동) 같은 박스 품사
  .replace(/^\s*[명동형부전접대감](?:[.)]\s*|\s+)/,'')              // 맨 앞 단독 품사: "동 달성하다"
  .replace(/\s+/g,' ')
  .replace(/^[\s:：,·-]+|[\s:：,·-]+$/g,'')
  .slice(0,75);
}

function rowCandidates(raw){
 const result=[];
 const lines=String(raw||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 for(let line of lines){
  line=line.replace(/^[□■☐☑✓●○\s]+/,'').replace(/^\s*\d{1,3}[.)]?\s*/,'');
  if(!KO.test(line))continue;
  // "1 apple 사과  26 bird 새"처럼 한 줄에 여러 항목이 있으면 번호 기준으로 분리
  const chunks=line.split(/(?=\s+\d{1,3}[.)]?\s+[A-Za-z])/g);
  for(let chunk of chunks){
   chunk=chunk.trim().replace(/^\d{1,3}[.)]?\s*/,'').replace(/^([A-Za-z][A-Za-z'’/-]*(?:\s+[A-Za-z][A-Za-z'’/-]*){0,2})\s+(?:v|n|adj|adv)\.\s+(?=[가-힣])/,'$1 ');
   const m=chunk.match(/^([A-Za-z][A-Za-z'’/-]*(?:\s+[A-Za-z][A-Za-z'’/-]*){0,2})\s*(?:[:：=–—-]\s*)?([\s\S]*[가-힣][\s\S]*)$/);
   if(!m)continue;
   const en=m[1].trim().toLowerCase().replace(/\s+/g,' '),ko=cleanMeaning(m[2]);
   if(en.length>28||!ko||en.split(' ').some(x=>x.length===1&&!['a','i'].includes(x)))continue;
   if(/^(i|you|he|she|they|we|this|that|where|there|tell|do you|have you)\s/i.test(en)&&en.includes(' '))continue;
   if(ko.length>55)continue;
   result.push({en,ko,uncertain:ko.length>37});
  }
 }
 return result;
}

function lineText(line){return line.text||((line.words||[]).map(w=>w.text).join(' '))||''}
function bbox(line){return line.bbox||{x0:0,x1:0,y0:0,y1:0}}

// 영어만 있는 줄 → 같은 높이에서 오른쪽에 있는 가장 가까운 한글 줄과 연결
// (Tesseract가 영어 열과 한글 열을 따로 읽었을 때를 위한 처리)
function pairByRow(lines){
 const HEAD=/^\s*(?:\d{1,3}[.)]?\s*)?([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,2})\s*$/;
 const heads=[],kos=[];
 for(const l of lines){
  if(KO.test(l.text)){kos.push(l);continue}
  const m=l.text.match(HEAD);
  if(m&&m[1].length>=2&&m[1].length<=28)heads.push({...l,en:m[1].toLowerCase()});
 }
 const mid=b=>(b.y0+b.y1)/2,out=[];
 for(const e of heads){
  const tol=Math.max(8,e.box.y1-e.box.y0)*0.7,ec=mid(e.box);
  const sameRow=b=>Math.abs(mid(b)-ec)<=tol;
  let best=null,bestDx=Infinity;
  for(const k of kos){
   if(k.box.x0<e.box.x1-5||!sameRow(k.box))continue;
   const dx=k.box.x0-e.box.x1;
   if(dx>=bestDx)continue;
   // 사이에 다른 영어 단어가 있으면 그 단어의 뜻이므로 건너뜀
   if(heads.some(o=>o!==e&&sameRow(o.box)&&o.box.x0>=e.box.x1&&o.box.x1<=k.box.x0))continue;
   best=k;bestDx=dx;
  }
  if(!best)continue;
  const ko=cleanMeaning(best.text.split(/\s+\d{1,3}[.)]?\s+[A-Za-z]/)[0]);
  if(ko)out.push({en:e.en,ko,uncertain:Math.min(e.conf,best.conf)<60});
 }
 return out;
}

function structuredCandidates(data){
 const lines=(data?.lines||[]).map(l=>({text:lineText(l).trim(),box:bbox(l),conf:l.confidence??100})).filter(l=>l.text);
 if(!lines.length)return rowCandidates(data?.text||'');
 const candidates=[...pairByRow(lines)];
 // 두 단으로 된 시트는 물리적 열로 나눈 뒤, 가까운 영어/한글끼리만 연결
 const xmax=Math.max(...lines.map(l=>l.box.x1||0)),xmin=Math.min(...lines.map(l=>l.box.x0||0)),half=(xmin+xmax)/2;
 const groups=xmax>0?[lines.filter(l=>(l.box.x0+l.box.x1)/2<half),lines.filter(l=>(l.box.x0+l.box.x1)/2>=half)]:[lines];
 for(const group of groups){
  const sorted=[...group].sort((a,b)=>a.box.y0-b.box.y0||a.box.x0-b.box.x0);
  for(let i=0;i<sorted.length;i++){
   const l=sorted[i],direct=rowCandidates(l.text);
   if(direct.length){candidates.push(...direct);continue}
   const em=l.text.match(/^\s*(?:\d{1,3}[.)]?\s*)?([A-Za-z][A-Za-z'’/-]*(?:\s+[A-Za-z][A-Za-z'’/-]*){0,2})\s*$/);
   if(!em)continue;
   const en=em[1].toLowerCase();if(en.length>28)continue;
   const k=sorted.slice(i+1,i+3).find(next=>KO.test(next.text)&&next.box.y0-l.box.y1<Math.max(45,(l.box.y1-l.box.y0)*2.2)&&next.box.y0>=l.box.y0-6);
   if(k)candidates.push({en,ko:cleanMeaning(k.text),uncertain:true});
  }
 }
 return candidates.length?candidates:rowCandidates(data.text||'');
}

function importCandidates(candidates,deck){
 const created=[],unique=new Set();let uncertain=0;
 for(const c of candidates){
  const en=c.en?.trim().toLowerCase();
  if(!en||en.length>35||!/[a-z]{2}/.test(en)||unique.has(en)||db.words.some(w=>w.deck===deck&&w.en===en))continue;
  unique.add(en);
  let ko=cleanMeaning(c.ko),pos=c.pos||'',fromDict=false;
  // 뜻 인식에 실패했지만 내장 사전에 있는 단어면 사전 뜻으로 채움
  if(!ko&&DICT[en]){ko=DICT[en][1];pos=pos||DICT[en][2]||'';fromDict=true}
  const needsReview=!ko||(!!c.uncertain&&!fromDict);
  if(needsReview)uncertain++;
  const w={id:uid(),en,ko:ko||'⚠ 뜻 확인 필요',needsReview,pos,example:'',deck,created:Date.now(),due:Date.now(),interval:0,ease:2.5,reps:0,miss:0};
  db.words.push(w);created.push(w.id);
 }
 save();captureLast=created;captureTotal+=created.length;
 captureStatus=`${created.length}개 추가 · ${uncertain}개 확인 필요. 다음 사진을 추가하거나 바로 공부하세요.`;toast(captureStatus);
 return created.length;
}

function importRecognized(text,deck){const candidates=rowCandidates(text);if(!candidates.length){toast('단어+뜻이 있는 줄을 찾지 못했어요.');return}importCandidates(candidates,deck);render()}

// 저해상도에서 한국어 인식이 실패해도 영어 표제어는 살림
function headwordCandidates(data){
 const lines=(data?.lines||[]).map(l=>({text:lineText(l).trim(),box:bbox(l),confidence:l.confidence??50})).filter(l=>l.text);
 if(!lines.length)return [];
 const found=[];
 for(const l of lines){
  const m=l.text.match(/^\s*(?:[□☐○●]\s*)?([a-zA-Z][a-zA-Z'-]{1,23})(?=\s|$|[^a-zA-Z])/);
  if(!m)continue;
  const en=m[1].toLowerCase();
  if(/^(the|this|that|your|there|where|write|example|lesson|english|word|name|page|unit|v|n|adj)$/.test(en))continue;
  const korean=l.text.slice(m[0].length).replace(/^[^가-힣]+/,'');
  const meaning=(korean.match(/[가-힣][가-힣\s,./~·-]*/)||[])[0]||'';
  found.push({en,ko:cleanMeaning(meaning),uncertain:!meaning||l.confidence<65});
 }
 return found;
}

function mergeCandidates(primary,extra){
 const map=new Map();
 for(const x of [...primary,...extra]){
  if(!x.en||!/^[a-z][a-z\s'-]{1,34}$/i.test(x.en))continue;
  const en=x.en.toLowerCase().trim(),old=map.get(en);
  if(!old||(!old.ko&&x.ko)||((x.ko||'').length>(old.ko||'').length&&x.ko&&!x.uncertain))map.set(en,x);
 }
 return [...map.values()];
}

// 크기와 상관없이 항상 흑백 + 자동 대비 보정 (폰 사진에도 적용)
async function preparedImage(file){
 let img;
 try{img=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){img=await createImageBitmap(file)}
 const long=Math.max(img.width,img.height);
 const scale=long<1600?Math.min(3,2000/long):long>3000?3000/long:1;
 const canvas=document.createElement('canvas');
 canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(img,0,0,canvas.width,canvas.height);
 const px=ctx.getImageData(0,0,canvas.width,canvas.height),d=px.data;
 const hist=new Uint32Array(256),gray=new Uint8Array(d.length/4);
 for(let i=0,j=0;i<d.length;i+=4,j++){const v=(.299*d[i]+.587*d[i+1]+.114*d[i+2])|0;gray[j]=v;hist[v]++}
 // 어두운 쪽·밝은 쪽 2%를 잘라내고 그 사이를 0~255로 늘림
 const cut=gray.length*.02;let lo=0,hi=255,acc=0;
 while(lo<254&&(acc+=hist[lo])<cut)lo++;
 acc=0;while(hi>lo+1&&(acc+=hist[hi])<cut)hi--;
 const range=hi-lo;
 for(let i=0,j=0;i<d.length;i+=4,j++){const v=(gray[j]-lo)*255/range;d[i]=d[i+1]=d[i+2]=v}
 ctx.putImageData(px,0,0);img.close?.();
 return canvas;
}

// 워커를 한 번만 만들고 재사용 (연속 촬영 시 훨씬 빠름)
function ocrProgress(m){
 const s=$('ocrStatus');if(!s)return;
 const pct=Math.round((m.progress||0)*100);
 if(m.status==='recognizing text')s.textContent=`글자 인식 ${pct}%`;
 else if(/loading|initializ/.test(m.status||''))s.textContent=`OCR 엔진 준비 중... ${pct}% (처음 한 번은 시간이 걸려요)`;
}
function getOcrWorker(){
 if(!ocrWorkerPromise){
  ocrWorkerPromise=(async()=>{
   if(!window.Tesseract)await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
   const worker=await Tesseract.createWorker('eng+kor',1,{logger:ocrProgress});
   await worker.setParameters({tessedit_pageseg_mode:OCR_PSM,preserve_interword_spaces:'1'});
   return worker;
  })().catch(e=>{ocrWorkerPromise=null;throw e});
 }
 return ocrWorkerPromise;
}
async function resetOcrWorker(){const p=ocrWorkerPromise;ocrWorkerPromise=null;try{(await p)?.terminate()}catch(e){}}

function setOcrStatus(msg){captureStatus=msg;const s=$('ocrStatus');if(s){s.textContent=msg;$('previewArea')?.classList.remove('hidden')}}

async function recognizeImage(file){
 if(!file||scanBusy)return;
 if(!file.type.startsWith('image/')){toast('이미지 파일만 사용할 수 있어요.');return}
 scanBusy=true;captureDeck=$('deckname')?.value.trim()||captureDeck;
 setOcrStatus('사진의 영어·한국어를 분석하는 중...');
 try{
  const [worker,photo]=await Promise.all([getOcrWorker(),preparedImage(file)]);
  const r=await worker.recognize(photo);
  lastOcrText=(r.data.text||'').trim();
  console.log('[WORD GARDEN OCR 원문]\n'+lastOcrText);
  const candidates=mergeCandidates(structuredCandidates(r.data),headwordCandidates(r.data));
  if(!candidates.length){captureStatus='읽은 단어가 없어요. 더 가까이 촬영해 주세요. (한 페이지씩 권장)';toast(captureStatus)}
  else{const n=importCandidates(candidates,captureDeck);capturePhotos++;if(n===0)captureStatus='이미 등록된 단어이거나 인식 가능한 단어가 없어요.'}
 }catch(e){
  captureStatus='OCR를 실행할 수 없어요. 인터넷 연결과 이미지 형식을 확인해 주세요.';toast(captureStatus);console.error('WORD GARDEN OCR',e);
  await resetOcrWorker();
 }finally{scanBusy=false;render()}
}
async function recognizeImages(files){const arr=[...files].filter(f=>f?.type?.startsWith('image/'));if(!arr.length)return;for(const f of arr){await recognizeImage(f)}}
/* ================= /OCR v0.5 ================= */

function tokenize(txt,min){const words=txt.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)||[];return [...new Set(words.map(w=>w.toLowerCase().replace(/['’](s|re|ve|ll|d|t|m)$/,'')).filter(w=>w.length>=min&&!stop.has(w)))].slice(0,120)}function deck(){let names=['all',...new Set(db.words.map(w=>w.deck))];let words=deckFilter==='all'?db.words:db.words.filter(w=>w.deck===deckFilter);return `<div class="spread"><p class="muted">단어를 눌러 뜻·품사·예문을 수정할 수 있습니다.</p><div class="flex"><button class="btn secondary small" id="exportBtn">⬇ 백업</button><button class="btn secondary small" id="importBtn">⬆ 가져오기</button><button class="btn danger small" id="deleteAllDecks" ${db.words.length?"":"disabled"}>🗑 전체 단어장 삭제</button><input class="hidden" type="file" id="importFile" accept=".json,application/json"></div></div><div class="panel"><div class="spread"><div style="min-width:180px"><label>단어장 선택</label><select id="deckFilter">${names.map(n=>`<option value="${esc(n)}" ${n===deckFilter?'selected':''}>${n==='all'?'전체 단어장':esc(n)}</option>`).join('')}</select></div><strong>${words.length}개 단어</strong></div><hr>${words.length?words.map(w=>`<div class="worditem"><div><strong>${esc(w.en)}</strong> <span class="pill">${esc(w.pos)}</span><div class="muted">${esc(w.ko)} ${w.needsReview?'<span style="color:#ffbc65">⚠ 확인</span>':''} · ${esc(w.deck)}</div></div><div class="flex"><button class="btn secondary small" data-speak="${esc(w.id)}" aria-label="발음 듣기">🔊</button><button class="btn secondary small" data-edit="${esc(w.id)}">편집</button><button class="btn danger small" data-delete="${esc(w.id)}">삭제</button></div></div>`).join(''):'<div class="empty">아직 등록한 단어가 없어요.<br>사진에서 영어 단어를 수집해 보세요!</div>'}</div>`}
function preferredEnglishVoice(){
 const voices=speechSynthesis.getVoices();const english=voices.filter(v=>/^en[-_]/i.test(v.lang));
 const us=english.filter(v=>/^en[-_]US$/i.test(v.lang));
 const preferred=v=>/samantha|ava|allison|siri|premium|enhanced|natural|neural|daniel|alex/i.test(v.name);
 return us.find(preferred)||us.find(v=>v.localService)||us[0]||english.find(preferred)||english[0]||null;
}
function speak(w){if(!w||!('speechSynthesis'in window)){toast('이 기기에서는 발음을 지원하지 않아요.');return}
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(w.en);u.lang='en-US';u.rate=.9;u.pitch=1;
 const v=preferredEnglishVoice();if(v){u.voice=v;u.lang=v.lang;}else if(!window._voiceNotice){window._voiceNotice=true;toast('영어 음성이 설치되지 않았을 수 있어요. iPad 설정에서 영어 음성을 추가해 주세요.');}
 // Triggered directly from a tap, important for Safari / iPadOS speech restrictions.
 speechSynthesis.speak(u);
}

function studyVillage(){if(!session||session.kind!=='day')return null;return WORLD_REGIONS.find(r=>session.day>=r.start&&session.day<=r.end)||null}
function study(){
 if(!session)session={ids:dueWords().map(w=>w.id),idx:0,flip:false,kind:'review'};
 const w=db.words.find(a=>a.id===session.ids[session.idx]);
 if(!w){const isDay=session.kind==='day'||session.kind==='bonus',d=session.kind==='bonus'?'보너스 '+(session.bonusIndex+1):session.day||activeDay();return `<div class="panel empty"><h2>🎉 ${isDay?(session.kind==='bonus'?d+' 클리어!':'DAY '+d+' 클리어!'):'기억 키우기 완료!'}</h2><p>${isDay?'오늘 배운 단어가 꽃을 키우는 힘이 되었어요!':'잘했어! 다음에 다시 만나자.'}</p><div class="flex" style="justify-content:center"><button class="btn" data-go="home">🏠 홈으로</button><button class="btn secondary" data-go="quiz">🌼 단어 미션</button><button class="btn secondary" data-go="course">🗺 전체 지도</button></div></div>`;}
 const village=studyVillage();const theme=village?`<div class="wg12-study-banner wg15-theme-${WORLD_REGIONS.indexOf(village)}" style="--vsky:${village.sky};--vground:${village.ground}"><span>${village.icon} ${village.name}</span><span class="wg15-landscape">${["🌷 🦋 🌸 🏡 🌿","☀️ 🍑 🌳 🐝 🍊","❄️ ⛄ 🌲 🧣 ✨","🌙 ⭐ 🔮 🌌 ✨","🍃 🌼 🏡 🕊️ 🌾"][Math.max(0,WORLD_REGIONS.indexOf(village))]}</span></div>`:'';return `${theme}<div class="spread"><span class="tag">${session.kind==='day'?(village?village.icon+' ':'🌷 ')+'DAY '+(session.day||activeDay()):session.kind==='bonus'?'🎁 '+BONUS_STOPS[session.bonusIndex].title:'🌿 기억 키우기'}</span><span class="muted">${session.idx+1} / ${session.ids.length}</span></div><div class="bar" style="margin:14px 0 20px"><div style="width:${session.idx/session.ids.length*100}%"></div></div>
 <div class="cardstudy" id="flipCard" tabindex="0" role="button" aria-label="단어 뜻 확인"><h2>${esc(w.en)}</h2>${session.flip?`<p style="font-size:27px;font-weight:800">${esc(w.ko)}</p>${w.example?`<p class="muted">${esc(w.example)}</p>`:''}`:'<div class="card-hint">🌿 카드를 눌러 뜻 확인</div>'}</div>
 <div class="flex" style="justify-content:center;margin:16px"><button class="btn secondary small" id="speakStudy">🔊 듣기</button>${!session.flip?'<button class="btn" id="showAnswer">👀 답 보기</button>':''}</div>
 ${session.flip?`<div class="rating-grid">${[['0','😵 다시!','전혀 기억 안 나'],['1','🤔 아차!','보고 나니 생각나'],['2','🙂 기억나!','조금 생각하고 맞힘'],['3','😎 완전 쉬워!','바로 떠올랐어']].map(([v,t,tip])=>`<button class="btn rate-btn" data-rate="${v}"><strong>${t}</strong><small>${tip}</small></button>`).join('')}</div>`:''}`;
}
function review(w,grade){
 const previous=w.interval||0;w.reps=(w.reps||0)+1;const now=Date.now();
 if(grade===0){w.interval=0;w.miss=(w.miss||0)+1;w.ease=Math.max(1.3,(w.ease||2.5)-.2);w.due=now+10*60000;award(2)}
 else if(grade===1){w.interval=1;w.ease=Math.max(1.3,(w.ease||2.5)-.12);w.due=now+DAY;award(5)}
 else if(grade===2){w.interval=previous===0?1:previous===1?3:Math.max(4,Math.round(previous*(w.ease||2.5)));w.due=now+w.interval*DAY;w.ease=Math.min(3.1,(w.ease||2.5)+.05);award(10)}
 else{w.interval=previous===0?3:previous===1?5:Math.max(7,Math.round(previous*(w.ease||2.5)*1.3));w.due=now+w.interval*DAY;w.ease=Math.min(3.1,(w.ease||2.5)+.1);award(12)}
 growMonster(w,grade>=2?2:grade);if(session?.kind==='day'&&session.day>0){session.grades=session.grades||{};session.grades[w.id]=Math.max(session.grades[w.id]??0,grade);}
 // 틀린 단어는 같은 회차 마지막에 한 번 더 등장합니다.
 if(grade===0&&!session.ids.slice(session.idx+1).includes(w.id)&&session.ids.filter(id=>id===w.id).length<2)session.ids.push(w.id);
 save();autoClaimMonsters();checkDayRewards();session.idx++;session.flip=false;if(session.kind==='bonus'&&session.idx>=session.ids.length){db.bonusStars=db.bonusStars||{};const g=Object.values(session.grades||{}),ratio=g.length?g.filter(x=>x>=2).length/g.length:0;db.bonusStars[session.bonusIndex]=Math.max(db.bonusStars[session.bonusIndex]||0,ratio>=.95?3:ratio>=.7?2:1);save();}if(session.kind==='day'&&session.day>0&&session.idx>=session.ids.length){db.dayStars=db.dayStars||{};const g=Object.values(session.grades||{});const high=g.filter(x=>x>=2).length;const ratio=g.length?high/g.length:0;const stars=ratio>=.95?3:ratio>=.70?2:1;db.dayStars[session.day]=Math.max(db.dayStars[session.day]||0,stars);save();}render();
}
function battlePool(){const a=db.words.filter(w=>w.ko&&!w.ko.startsWith('⚠')&&w.source==='elementary800'&&(w.day===activeDay()||(w.reps||0)>0));return a.length>=4?a:courseWords(activeDay());}
function beginQuiz(){
 const pool=battlePool();if(pool.length<4){toast('문제를 만들 단어가 4개 이상 필요해요.');return;}
 const qs=[...pool].sort(()=>Math.random()-.5).slice(0,10).map(w=>{const other=[...new Set(pool.filter(a=>a.ko!==w.ko).map(a=>a.ko))].sort(()=>Math.random()-.5).slice(0,3);return {en:w.en,id:w.id,correct:w.ko,opts:[w.ko,...other].sort(()=>Math.random()-.5)}});
 quiz={questions:qs,idx:0,lastSpokenIndex:-1,selected:null,points:0,wrong:[],streak:0,logs:'꽃잎을 모아 정원을 가꿔요!',finished:false,petalRewardProcessed:false};render();
}
function battleResult(){if(!quiz)return '';const q=quiz;return `<section class="wg11-mission-panel panel"><div class="wg11-mission-glyph">${q.points>=9?'🌺':q.points>=7?'🌷':'🌱'}</div><h2>오늘의 단어 미션 완료!</h2><h1>${q.points} / ${q.questions.length} 정답</h1><p>${q.points>=9?'꽃잎이 풍성하게 모였어요!':'틀린 단어를 다시 익히면 정원이 더 풍성해져요.'}</p><p>${q.wrong.length?'다시 기억할 단어: '+q.wrong.map(esc).join(', '):'모든 단어를 정확히 기억했어요!'}</p><div class="wg11-reward">🌸 획득한 꽃잎 <strong>+${q.petalsAwarded||0}</strong><br>꽃잎 ${q.petalsBefore??gardenState().petals} → <strong>${q.petalsAfter??gardenState().petals}</strong>개</div><div class="flex" style="justify-content:center"><button class="btn" id="startQuiz">다시 도전</button><button class="btn secondary" data-go="garden">정원 꾸미기 →</button><button class="btn secondary" data-go="home">홈으로</button></div></section>`;}
function resolveBattleChoice(i){if(!quiz||quiz.selected!==null||quiz.finished)return;const q=quiz.questions[quiz.idx];quiz.selected=i;const ok=q.opts[i]===q.correct;
 if(ok){quiz.points++;quiz.streak++;quiz.logs=quiz.streak>=3?'✨ 연속 정답! 꽃잎에 햇살이 가득해요.':'🌼 정답! 꽃잎을 모았어요.';award(20)}
 else{quiz.streak=0;quiz.logs='🌱 괜찮아요! 다음 단어에서 다시 피워봐요.';quiz.wrong.push(q.en);const w=db.words.find(w=>w.id===q.id);if(w){w.due=Date.now();w.miss=(w.miss||0)+1;save();}}
 if(quiz.idx===quiz.questions.length-1){quiz.finished=true;awardMissionPetals(quiz)}render();}
function awardMissionPetals(q){
 // One award per completed mission; no hidden daily cutoff.
 if(!q || q.petalRewardProcessed)return;
 const g=gardenState();
 const earned=q.points>=9?30:q.points>=7?20:q.points>=4?10:5;
 const before=g.petals;
 g.petals=before+earned;
 q.petalRewardProcessed=true;
 q.petalsAwarded=earned;
 q.petalsBefore=before;
 q.petalsAfter=g.petals;
 g.lastMissionReward={earned,before,after:g.petals,at:Date.now()};
 save();
}

function quizView(){if(!quiz)return `<section class="wg11-mission-intro"><div><span class="garden-kicker">🌼 WORD GARDEN</span><h1>단어 미션</h1><p>객관식 10문제를 풀어 꽃잎을 모아 보세요. 꽃잎으로 나의 정원에 장식을 놓을 수 있어요.</p><p class="muted">미션을 끝까지 완료하면 매번 꽃잎 보상을 받아요.</p><button class="btn" id="startQuiz">🌸 꽃잎 모으기 시작</button></div><div class="wg11-mission-visual">🌷<span>🌼</span>🌿</div></section>`;
 if(quiz.finished&&quiz.selected===null)return battleResult();const q=quiz.questions[quiz.idx];if(!q)return battleResult();const shown=quiz.selected!==null;const pct=(quiz.idx+(shown?1:0))/quiz.questions.length*100;
 return `<div class="wg11-mission-scene"><div class="spread"><strong>🌼 단어 미션 · 꽃잎 모으기</strong><span>${quiz.idx+1} / ${quiz.questions.length} 문제</span></div><div class="wg11-mission-progress"><span style="width:${pct}%"></span></div><div class="wg11-growing-flower" aria-label="모은 꽃잎 연출">${quiz.points>=8?'🌺 🌸 🌼':quiz.points>=5?'🌸 🌼':quiz.points>=2?'🌸':'🌸'}</div><p>${esc(quiz.logs)} · 정답 ${quiz.points}개 · 연속 ${quiz.streak}개</p></div><section class="panel wg11-question"><div class="cardstudy battle-question"><h2>${esc(q.en)}</h2><button class="btn secondary small" id="speakMission" aria-label="단어 발음 다시 듣기">🔊 발음 듣기</button></div><div class="choices">${q.opts.map((t,i)=>`<button class="choice ${shown?(t===q.correct?'right':i===quiz.selected?'wrong':''):''}" data-choice="${i}" ${shown?'disabled':''}>${i+1}. ${esc(t)}</button>`).join('')}</div>${shown?`<p class="notice">${q.opts[quiz.selected]===q.correct?'✅ 정답!':'❌ 정답: '+esc(q.correct)}</p><button class="btn" id="nextQuiz" style="width:100%">${quiz.finished?'결과 확인':'다음 문제 →'}</button>`:''}</section>`;}

const EQUIPMENT=[{id:'wood',name:'훈련용 목검',level:1,job:'all',power:2,icon:'🗡️'},{id:'bronze',name:'청동 검',level:3,job:'all',power:5,icon:'⚔️'},{id:'staff',name:'수련 지팡이',level:10,job:'mage',power:13,icon:'🪄'},{id:'longbow',name:'바람 장궁',level:10,job:'archer',power:13,icon:'🏹'},{id:'saber',name:'기사의 장검',level:10,job:'warrior',power:13,icon:'🗡️'},{id:'legendmage',name:'별빛 지팡이',level:30,job:'mage',power:33,icon:'✨'},{id:'legendarcher',name:'폭풍의 활',level:30,job:'archer',power:33,icon:'🏹'},{id:'legendwarrior',name:'용기사의 검',level:30,job:'warrior',power:33,icon:'⚡'}];
function ensureHero(){if(!db.hero||typeof db.hero!=='object')db.hero={job:null,weapon:'wood',name:'나의 정원사'};}
function heroLevel(){return Math.floor(db.xp/200)+1}
function heroArt(){
 const job=db.hero.job||'novice',lv=heroLevel(),weapon=EQUIPMENT.find(e=>e.id===db.hero.weapon)||EQUIPMENT[0],legend=lv>=30;
 const palettes={novice:['#879cb8','#506b8b','#c9d8e9'],warrior:legend?['#d8a945','#8c4852','#fff0ac']:['#587eae','#344d79','#d9e6f9'],archer:legend?['#287e65','#145447','#c9f9b5']:['#498b70','#285b51','#d4f1bf'],mage:legend?['#9667d9','#4c327b','#f8d6ff']:['#816ac3','#473c84','#e4d6ff']};
 const [armor,trim,light]=palettes[job],isBow=['longbow','legendarcher'].includes(weapon.id),isStaff=['staff','legendmage'].includes(weapon.id),isLegend=weapon.id.startsWith('legend');
 const dress=job==='warrior'?`<path d="M74 121 L89 107 L151 107 L169 122 L163 216 L76 216Z" fill="${armor}" stroke="#172641" stroke-width="7"/><path d="M105 116 V209 M135 116 V209" stroke="${trim}" stroke-width="12"/><path d="M76 134 L96 143 L87 168 L68 155 M163 134 L143 143 L152 168 L171 155" fill="${light}" stroke="#172641" stroke-width="5"/><path d="M87 179 H155 M88 198 H155" stroke="${light}" stroke-width="7"/>`:job==='archer'?`<path d="M84 107 L153 107 L171 214 L69 214Z" fill="${trim}" stroke="#172641" stroke-width="6"/><path d="M84 117 L142 111 L153 194 L90 203Z" fill="${armor}" stroke="${light}" stroke-width="5"/><path d="M88 137 L158 177" stroke="#bd9865" stroke-width="13"/><path d="M83 204 L160 204" stroke="${light}" stroke-width="5"/><path d="M63 110 L79 124 L66 159" fill="${trim}" stroke="${light}" stroke-width="5"/>`:job==='mage'?`<path d="M84 107 L152 107 L181 224 L62 224Z" fill="${trim}" stroke="#172641" stroke-width="6"/><path d="M103 119 L139 119 L158 217 L81 217Z" fill="${armor}" stroke="${light}" stroke-width="5"/><path d="M110 135 L122 122 L134 135 L122 151Z" fill="${light}"/><path d="M69 166 L62 216 L181 216 L174 166" fill="none" stroke="${light}" stroke-width="6"/>`:`<path d="M81 112 L152 112 L169 211 L73 211Z" fill="${armor}" stroke="#162840" stroke-width="7"/><path d="M100 128 L129 145 L149 127" fill="none" stroke="${light}" stroke-width="7"/>`;
 const headgear=job==='warrior'?`<path d="M73 55 L84 9 L157 9 L169 57 L155 51 L146 24 L94 24 L85 51Z" fill="${legend?'#e5b84f':'#718eac'}" stroke="#172641" stroke-width="5"/><path d="M119 8 V54" stroke="${light}" stroke-width="9"/>`:job==='archer'?`<path d="M71 35 Q120 10 169 35" fill="none" stroke="${light}" stroke-width="13"/><path d="M153 29 L180 4 L169 47" fill="${armor}" stroke="#172641" stroke-width="4"/>`:job==='mage'?`<path d="M60 48 L121 -11 L173 48Z" fill="${trim}" stroke="#172641" stroke-width="7"/><path d="M75 45 H163" stroke="${light}" stroke-width="8"/><path d="M119 6 L126 21 L143 23 L130 33 L134 49 L119 39 L104 49 L108 33 L95 23 L112 21Z" fill="#ffe99a"/>`:'';
 const arms=`<path d="M82 123 L49 166 L61 186 L101 150 M157 126 L191 172 L179 189 L145 151" fill="${armor}" stroke="#172641" stroke-width="7"/>`;
 let weaponShape='';
 switch(weapon.id){
 case 'wood':weaponShape='<path d="M0 -82 L0 42" stroke="#a97949" stroke-width="14" stroke-linecap="round"/><path d="M-19 39 H19 M0 42 V72" stroke="#704d34" stroke-width="9"/>';break;
 case 'bronze':weaponShape='<path d="M0 -91 L12 -66 L9 38 L-9 38 L-12 -66Z" fill="#bd8855" stroke="#67492e" stroke-width="5"/><path d="M-24 39 H24 M0 39 V77" stroke="#d5a260" stroke-width="9"/>';break;
 case 'saber':weaponShape='<path d="M0 -103 L14 -73 L10 41 L-10 41 L-14 -73Z" fill="#e0efff" stroke="#587ca5" stroke-width="4"/><path d="M0 -84 V34" stroke="#8fbeef" stroke-width="4"/><path d="M-28 42 H28 M0 42 V83" stroke="#f5ce79" stroke-width="10"/>';break;
 case 'legendwarrior':weaponShape='<path d="M0 -112 L20 -80 L12 43 L-12 43 L-20 -80Z" fill="#fff2ab" stroke="#ca7737" stroke-width="5"/><path d="M0 -91 L0 37" stroke="white" stroke-width="7"/><path d="M-32 42 L-14 29 H14 L32 42 L14 53 H-14Z M0 53 V87" fill="#eb9f55" stroke="#7e4a31" stroke-width="5"/><path d="M0 -122 L9 -140 L19 -119" fill="none" stroke="#f6d85b" stroke-width="5"/>';break;
 case 'staff':weaponShape='<path d="M0 -75 L0 78" stroke="#ab784f" stroke-width="11"/><circle cy="-85" r="17" fill="#78d4df" stroke="#e7fcff" stroke-width="5"/>';break;
 case 'legendmage':weaponShape='<path d="M0 -75 L0 83" stroke="#c7a4ed" stroke-width="12"/><path d="M0 -116 L21 -85 L0 -57 L-21 -85Z" fill="#adf8ff" stroke="white" stroke-width="5"/><path d="M-26 -109 L-38 -119 M26 -109 L38 -119 M0 -127 V-139" stroke="#ffed97" stroke-width="5"/>';break;
 case 'longbow':weaponShape='<path d="M0 -78 Q57 0 0 78" fill="none" stroke="#d8a46a" stroke-width="10"/><path d="M0 -78 L0 78" stroke="#eff9eb" stroke-width="3"/><path d="M-9 0 H47 M39 -8 L49 0 L39 8" stroke="#b3d4e4" stroke-width="4"/>';break;
 case 'legendarcher':weaponShape='<path d="M0 -88 Q75 0 0 88" fill="none" stroke="#8fe9d9" stroke-width="12"/><path d="M0 -88 L0 88" stroke="#fff4bd" stroke-width="3"/><path d="M-9 0 H59 M48 -10 L62 0 L48 10" stroke="#e3faff" stroke-width="6"/><path d="M0 -88 L-12 -101 M0 88 L-12 101" stroke="#b7f7ff" stroke-width="6"/>';break;
 }
 return `<svg viewBox="0 0 240 290" xmlns="http://www.w3.org/2000/svg" style="max-width:220px;width:100%;filter:drop-shadow(0 12px 15px #0006)" role="img" aria-label="나의 용사 ${esc(weapon.name)}"><ellipse cx="120" cy="269" rx="67" ry="12" fill="#000" opacity=".3"/><path d="M99 202 L92 254 L118 257 L126 204 M129 204 L142 256 L166 254 L148 202" fill="${trim}" stroke="#172641" stroke-width="6"/><path d="M90 255 L119 255 M141 255 L168 255" stroke="${light}" stroke-width="13" stroke-linecap="round"/>${dress}${arms}<circle cx="120" cy="72" r="46" fill="#f2c49a" stroke="#162840" stroke-width="6"/><path d="M72 74 Q55 8 127 13 Q181 16 165 76 L151 49 Q114 68 79 54Z" fill="${job==='mage'?'#6557b8':'#29354e'}" stroke="#162840" stroke-width="5"/><circle cx="104" cy="79" r="5" fill="#172641"/><circle cx="136" cy="79" r="5" fill="#172641"/><path d="M111 97 Q120 102 128 97" stroke="#984f48" stroke-width="3" fill="none"/>${headgear}<g transform="translate(187 160) rotate(12)">${weaponShape}</g>${legend?`<circle cx="121" cy="169" r="11" fill="${light}" stroke="white" stroke-width="3"/>`:''}</svg>`;
}
function heroView(){ensureHero();let lv=heroLevel(),equipped=EQUIPMENT.find(e=>e.id===db.hero.weapon)||EQUIPMENT[0],jobName={novice:'견습 모험가',warrior:lv>=30?'드래곤 나이트':'전사',archer:lv>=30?'폭풍 사냥꾼':'궁수',mage:lv>=30?'대마법사':'마법사'}[db.hero.job||'novice'];let options=EQUIPMENT.filter(x=>x.job==='all'||x.job===db.hero.job);return `<section class="hero game-hero"><div class="game-hero-copy"><span class="tag">🛡 나만의 용사</span><h1>Lv. ${lv} ${jobName}</h1><p class="muted">영어 단어를 기억할수록 용사가 성장합니다.</p><span class="tag">⚔ 장비 ${esc(equipped.name)} · 공격력 ${equipped.power}</span><p class="muted" style="margin-top:15px">XP ${db.xp.toLocaleString()} · 다음 레벨까지 ${200-db.xp%200} XP</p><div class="bar"><div style="width:${db.xp%200/2}%"></div></div></div><div class="hero-monster">${heroArt()}</div></section><div class="grid2"><div class="panel"><h3>⚔ 직업 선택</h3><p class="muted">Lv.10에 개방 · 언제든 직업 변경 가능</p><div class="flex">${[['warrior','🛡 전사'],['archer','🏹 궁수'],['mage','🔮 마법사']].map(([id,n])=>`<button class="btn small ${db.hero.job===id?'success':'secondary'}" data-class="${id}" ${lv<10?'disabled':''}>${n}</button>`).join('')}</div>${lv<10?`<p class="notice">레벨 ${10-lv}개만 더 올리면 직업 선택!</p>`:''}</div><div class="panel"><h3>🎒 무기고</h3><p class="muted">레벨과 직업에 따라 장비 해금 · 유료 결제 없음</p>${options.map(item=>`<div class="spread capture-row"><span>${item.icon} ${esc(item.name)} <small>Lv.${item.level} · 공격력 ${item.power}</small></span><button class="btn small ${db.hero.weapon===item.id?'success':'secondary'}" data-equip="${item.id}" ${lv<item.level?'disabled':''}>${lv<item.level?'잠김':db.hero.weapon===item.id?'장착 중':'장착'}</button></div>`).join('')}</div></div><div class="flex" style="margin:20px 0"><button class="btn secondary" data-go="monsters">◈ 동료 도감 보기</button><button class="btn secondary" data-go="deck">▤ 전체 단어장</button></div><div class="notice">직업별 의상과 장착한 무기의 외형이 각각 달라집니다. 공격력은 현재 보스 배틀에서 정답을 맞혔을 때 주는 피해량에 반영됩니다.</div><div class="flex"><button class="btn" data-go="study">✦ 단어 훈련으로 XP 얻기</button><button class="btn secondary" data-go="quiz">⚔ 퀴즈로 XP 얻기</button></div>`}

function bindView(){if(view==='garden'||view==='home')bindGarden();if(view==='settings'){if($('settingsDay')){$('settingsDay').value=String(unlockedDay());$('settingsDay').disabled=true;}$('settingsBackup').onclick=downloadBackup;$('settingsRestore').onclick=()=>$('settingsImportFile').click();$('settingsImportFile').onchange=importBackup;$('resetAll').onclick=()=>{const answer=prompt('모든 학습 기록, XP, 용사, 몬스터, 개인 단어를 영구 삭제합니다.\n초기화 후 기본 800단어는 다시 제공됩니다.\n\n진행하려면 초기화라고 입력하세요.');if(answer!=='초기화'){if(answer!==null)toast('초기화가 취소되었습니다.');return;}localStorage.removeItem(KEY);db=load();session=null;quiz=null;deckFilter='all';seed800();ensureMonsters();ensureHero();save();nav('home');toast('모든 진행 기록을 초기화했어요.');};}$('jumpCurrent')?.addEventListener('click',()=>{document.querySelector('[data-map-day="'+unlockedDay()+'"]')?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});});document.querySelectorAll('[data-jump-region]').forEach(b=>b.onclick=()=>{$('region-'+b.dataset.jumpRegion)?.scrollIntoView({behavior:'smooth',block:'start'});});document.querySelectorAll('[data-map-day]').forEach(b=>b.onclick=()=>{const d=Number(b.dataset.mapDay);if(!dayAccessible(d))return;if(dayComplete(d)){if(confirm('DAY '+d+'를 다시 도전할까?'))startDay(d)}else startDay(d)});document.querySelectorAll('[data-final-boss]').forEach(b=>b.onclick=()=>nav('finalBoss'));if(view==='finalBoss'){$('finalStart')?.addEventListener('click',finalBossStart);$('finalNext')?.addEventListener('click',finalBossNext);document.querySelectorAll('[data-final-answer]').forEach(b=>b.onclick=()=>finalBossAnswer(Number(b.dataset.finalAnswer)));}document.querySelectorAll('[data-bonus]').forEach(b=>b.onclick=()=>startBonus(Number(b.dataset.bonus)));document.querySelectorAll('[data-start-day]').forEach(b=>b.onclick=()=>startDay(Number(b.dataset.startDay)));document.querySelectorAll('[data-start-review]').forEach(b=>b.onclick=startReview);document.querySelectorAll('[data-class]').forEach(b=>b.onclick=()=>{ensureHero();if(heroLevel()<10)return toast('Lv.10에 직업이 해금됩니다.');db.hero.job=b.dataset.class;if(!EQUIPMENT.some(e=>e.id===db.hero.weapon&&(e.job==='all'||e.job===db.hero.job)))db.hero.weapon='bronze';save();render()});document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{ensureHero();const item=EQUIPMENT.find(x=>x.id===b.dataset.equip);if(!item||heroLevel()<item.level||item.job!=='all'&&item.job!==db.hero.job)return;db.hero.weapon=item.id;save();render()});document.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>claimMonster(b.dataset.claim));document.querySelectorAll('[data-partner]').forEach(b=>b.onclick=()=>{db.monsters.partner=b.dataset.partner;save();toast('파트너를 변경했어요!');render()});$('seedDemo')?.addEventListener('click',seedDemo);document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>nav(b.dataset.go));if(view==='scan'){$('deckname').onchange=e=>{captureDeck=e.target.value.trim()||captureDeck;render()};$('cameraBtn').onclick=()=>$('cameraInput').click();$('uploadBtn').onclick=()=>$('uploadInput').click();for(let id of ['cameraInput','uploadInput'])$(id).onchange=e=>recognizeImages(e.target.files||[]);$('trainNow').onclick=()=>{session={ids:db.words.filter(w=>w.deck===captureDeck).map(w=>w.id),idx:0,flip:false};if(!session.ids.length)session=null;nav('study')};$('seeDeck').onclick=()=>{deckFilter=captureDeck;nav('deck')};$('undoCapture').onclick=()=>{if(!captureLast.length)return;let ids=new Set(captureLast);db.words=db.words.filter(w=>!ids.has(w.id));captureTotal=Math.max(0,captureTotal-ids.size);captureLast=[];captureStatus='마지막으로 추가한 단어를 취소했어요.';save();render()};$('pasteTextToggle').onclick=()=>$('manualText').classList.toggle('hidden');$('textImportBtn').onclick=()=>{let t=$('sourceText').value.trim();captureDeck=$('deckname').value.trim()||captureDeck;if(t)importRecognized(t,captureDeck)};$('demoBtn').onclick=()=>importRecognized('achieve 달성하다\nopportunity 기회\nimprove 향상시키다\nenvironment 환경'.replace(/\n/g,'\n'),captureDeck);let zone=$('dropZone');zone.ondragover=e=>{e.preventDefault();zone.classList.add('hover')};zone.ondragleave=()=>zone.classList.remove('hover');zone.ondrop=e=>{e.preventDefault();zone.classList.remove('hover');recognizeImages(e.dataTransfer.files)};zone.onclick=()=>$('uploadInput').click()}if(view==='deck'){$('deckFilter').onchange=e=>{deckFilter=e.target.value;render()};document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(db.words.find(w=>w.id===b.dataset.speak)));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{let w=db.words.find(w=>w.id===b.dataset.edit);let ko=prompt(`${w.en} - 한국어 뜻`,w.ko);if(ko===null)return;w.ko=ko.trim()||w.ko;w.needsReview=!ko.trim()||ko.includes("뜻 확인 필요");let ex=prompt('예문 (취소하면 유지)',w.example||'');if(ex!==null)w.example=ex.trim();save();render()});document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(!confirm('이 단어를 삭제할까요?'))return;db.words=db.words.filter(w=>w.id!==b.dataset.delete);save();render()});$('deleteAllDecks').onclick=()=>{
 const count=db.words.length;
 if(!count)return;
 const answer=prompt(`등록된 모든 단어장과 단어 ${count}개를 영구 삭제합니다.\n학습 단어의 복습 기록도 함께 사라집니다.\n정원 꾸미기 기록, XP, 레벨은 유지됩니다.\n\n삭제하려면 '전체삭제'를 입력하세요.`);
 if(answer!=='전체삭제'){if(answer!==null)toast('삭제가 취소되었습니다.');return;}
 db.words=[];deckFilter='all';session=null;quiz=null;draft=[];captureLast=[];captureTotal=0;
 save();render();toast(`${count}개 단어를 삭제했습니다. 정원 기록과 XP는 유지됩니다.`);
};$('exportBtn').onclick=downloadBackup;$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=importBackup}if(view==='study'){$('restartStudy')?.addEventListener('click',()=>{session={ids:dueWords().map(w=>w.id),idx:0,flip:false,kind:'review'};render()});let flip=()=>{session.flip=!session.flip;const w=db.words.find(w=>w.id===session.ids[session.idx]);if(!session.flip&&'speechSynthesis'in window)speechSynthesis.cancel();if(session.flip)speak(w);render()};if($('flipCard')){$('flipCard').onclick=flip;$('flipCard').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}}}$('showAnswer')?.addEventListener('click',flip);$('speakStudy')?.addEventListener('click',()=>speak(db.words.find(w=>w.id===session.ids[session.idx])));document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>review(db.words.find(w=>w.id===session.ids[session.idx]),Number(b.dataset.rate)))}if(view==='quiz'){if(quiz&&!quiz.finished&&quiz.selected===null&&quiz.lastSpokenIndex!==quiz.idx){quiz.lastSpokenIndex=quiz.idx;setTimeout(()=>speak(db.words.find(w=>w.id===quiz.questions[quiz.idx]?.id)),180)}$('startQuiz')?.addEventListener('click',beginQuiz);document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>resolveBattleChoice(Number(b.dataset.choice)));$('speakMission')?.addEventListener('click',()=>speak(db.words.find(w=>w.id===quiz.questions[quiz.idx]?.id)));$('nextQuiz')?.addEventListener('click',()=>{if(quiz.finished){awardMissionPetals(quiz);quiz.selected=null}else{quiz.idx++;quiz.selected=null}render()})}}
function loadScript(src){return new Promise((resolve,reject)=>{let s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}function downloadBackup(){let a=document.createElement('a'),blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});let url=URL.createObjectURL(blob);a.href=url;a.download=`wordgarden-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}async function importBackup(e){let f=e.target.files?.[0];if(!f)return;try{let obj=JSON.parse(await f.text());if(!Array.isArray(obj.words)||!obj.words.every(w=>typeof w.en==='string'&&typeof w.ko==='string'))throw Error();if(!confirm(`기존 데이터를 대체하고 ${obj.words.length}개 단어를 가져올까요?`))return;db={words:obj.words,xp:Number(obj.xp)||0,history:obj.history||{},settings:obj.settings||{dailyGoal:10},created:obj.created||Date.now(),monsters:obj.monsters||null,hero:obj.hero||null,rewards:obj.rewards||null,garden:obj.garden||{placements:{}},dayStars:obj.dayStars||{},bonusStars:obj.bonusStars||{},finalBoss:obj.finalBoss||null};ensureMonsters();ensureHero();save();session=null;quiz=null;finalBattle=null;toast('백업을 불러왔어요.');render()}catch(err){toast('유효한 WORD GARDEN 백업 파일이 아닙니다.')}}
window.addEventListener('storage',e=>{if(e.key===KEY){db=load();seed800();session=null;render()}});

window.addEventListener('paste',e=>{if(view!=='scan')return;let file=[...(e.clipboardData?.items||[])].find(x=>x.type.startsWith('image/'))?.getAsFile();if(file){e.preventDefault();recognizeImage(file)}});


/* WORD GARDEN v5 — hybrid personal garden. No change to study/quiz logic. */
const GARDEN_ITEMS=[
 {id:'bench',name:'나무 벤치',at:0,color:'#b98d64',required:0,cost:0},
 {id:'pot',name:'테라코타 화분',at:0,color:'#cd9b7f',required:0,cost:0},
 {id:'lamp',name:'정원 등불',at:20,color:'#edc67e',required:20,cost:30},
 {id:'bird',name:'새집',at:50,color:'#bd9bc0',required:50,cost:40},
 {id:'fountain',name:'작은 분수',at:100,color:'#93bfc4',required:100,cost:80},
 {id:'arch',name:'꽃 아치',at:200,color:'#a3b888',required:200,cost:100},
 {id:'mushroom',name:'버섯 조형물',cost:25},
 {id:'stone',name:'디딤돌',cost:15},
 {id:'butterfly',name:'나비 쉼터',cost:35},
 {id:'hedge',name:'둥근 생울타리',cost:35},
 {id:'basket',name:'피크닉 바구니',cost:25},
 {id:'sign',name:'나무 안내판',cost:30},
 {id:'windmill',name:'작은 풍차',cost:65},
 {id:'pond',name:'미니 연못',cost:70},
 {id:'swing',name:'나무 그네',cost:75},
 {id:'lantern',name:'꽃등 장식',cost:35}
];
const GARDEN_SLOTS=[{x:22,y:38},{x:50,y:26},{x:79,y:35},{x:20,y:73},{x:48,y:78},{x:79,y:73},{x:9,y:21},{x:31,y:18},{x:60,y:13},{x:88,y:18},{x:91,y:51},{x:91,y:84},{x:62,y:90},{x:36,y:90},{x:9,y:88},{x:9,y:56},{x:59,y:59},{x:88,y:64},{x:14,y:43},{x:36,y:37},{x:69,y:27},{x:81,y:15},{x:16,y:61},{x:36,y:64},{x:72,y:72},{x:48,y:48},{x:28,y:82},{x:70,y:88},{x:95,y:36},{x:44,y:11}];
let gardenSelected='bench';
function gardenLearned(){return Array.from({length:33},(_,i)=>courseWords(i+1)).flat().filter(w=>(w.reps||0)>0).length}
function gardenMastered(){return Array.from({length:33},(_,i)=>courseWords(i+1)).flat().filter(w=>(w.interval||0)>=7).length}
function gardenState(){if(!db.garden||typeof db.garden!=='object')db.garden={placements:{}};if(!db.garden.placements||typeof db.garden.placements!=='object')db.garden.placements={};db.garden.petals=Math.max(0,Number(db.garden.petals)||0);if(!Array.isArray(db.garden.owned))db.garden.owned=['bench','pot'];for(const raw of Object.values(db.garden.placements)){const id=typeof raw==='string'?raw:raw?.id;if(GARDEN_ITEMS.some(x=>x.id===id)&&!db.garden.owned.includes(id))db.garden.owned.push(id)}if(!db.garden.inventory||typeof db.garden.inventory!=='object'){db.garden.inventory={};for(const id of db.garden.owned){db.garden.inventory[id]=['bench','pot'].includes(id)?99:1}for(const raw of Object.values(db.garden.placements)){const id=typeof raw==='string'?raw:raw?.id;if(id)db.garden.inventory[id]=Math.max(db.garden.inventory[id]||0,Object.values(db.garden.placements).filter(v=>(typeof v==='string'?v:v?.id)===id).length)}}return db.garden}
function gardenPlaced(raw,i){if(!raw)return null;const item=typeof raw==='string'?{id:raw}:raw;const anchor=GARDEN_SLOTS[i]||{x:50,y:50};return {id:item.id,x:Number.isFinite(Number(item.x))?Math.min(96,Math.max(4,Number(item.x))):anchor.x,y:Number.isFinite(Number(item.y))?Math.min(94,Math.max(6,Number(item.y))):anchor.y,scale:Number.isFinite(Number(item.scale))?Math.min(1.8,Math.max(.6,Number(item.scale))):1}}
let gardenActivePlacement=null;

function gardenIllustration(id){let a={
 bench:`<path d="M8 28h64v10H8zM15 9h50v14H15z" fill="#d4a77e" stroke="#936d54" stroke-width="3"/><path d="M20 39v20M61 39v20" stroke="#936d54" stroke-width="5" stroke-linecap="round"/>`,
 pot:`<path d="M22 25h38l-6 35H28z" fill="#dba18b" stroke="#a87463" stroke-width="3"/><path d="M17 23h48v9H17z" fill="#edb49c" stroke="#a87463" stroke-width="3"/><path d="M40 23V3M40 18Q23 9 22 5Q36 2 40 18M40 13Q59 1 61 4Q58 17 40 13" fill="#9ebb81" stroke="#68936d" stroke-width="3"/>`,
 lamp:`<path d="M40 17v45" stroke="#987b64" stroke-width="5"/><path d="M23 20L40 7l17 13-5 22H28z" fill="#fff4c1" stroke="#a68c67" stroke-width="3"/><path d="M27 20h26M34 21v18M46 21v18" stroke="#c7ad7c" stroke-width="2"/><path d="M26 64h28" stroke="#987b64" stroke-width="5" stroke-linecap="round"/>`,
 bird:`<path d="M39 30v35" stroke="#99785c" stroke-width="5"/><path d="M18 24L40 7l22 17v28H18z" fill="#eccca5" stroke="#947459" stroke-width="3"/><path d="M14 25L40 4l26 21" stroke="#b68273" stroke-width="6" fill="none"/><circle cx="40" cy="34" r="9" fill="#887360"/><path d="M35 51h10" stroke="#a78562" stroke-width="3"/>`,
 fountain:`<ellipse cx="40" cy="52" rx="35" ry="15" fill="#a3c7c8" stroke="#79a7a6" stroke-width="4"/><path d="M15 49Q40 62 65 49L60 60Q40 70 20 60Z" fill="#a2b6a7"/><path d="M40 14v34M40 14q-17 12-15 27M40 14q17 12 15 27" fill="none" stroke="#8dcbd7" stroke-width="4" stroke-linecap="round"/><ellipse cx="40" cy="48" rx="15" ry="6" fill="#d0edf0"/>`,
 arch:`<path d="M12 65V29Q12 5 40 5Q68 5 68 29V65" fill="none" stroke="#b08e6e" stroke-width="7"/><path d="M17 60V27Q17 11 40 11Q63 11 63 27V60" fill="none" stroke="#6f9b76" stroke-width="5" stroke-dasharray="5 2"/><circle cx="22" cy="15" r="7" fill="#e8a0a5"/><circle cx="55" cy="12" r="7" fill="#f4c3bd"/><circle cx="12" cy="42" r="6" fill="#eab5c9"/><circle cx="68" cy="44" r="6" fill="#f1d48e"/>`,
 mushroom:`<path d="M25 42h30l-4 22H29z" fill="#f2d4ac" stroke="#ad8769" stroke-width="3"/><path d="M8 43Q12 7 40 8Q68 9 72 43Z" fill="#d99c9d" stroke="#ab7378" stroke-width="3"/><circle cx="27" cy="27" r="6" fill="#fff2dc"/><circle cx="53" cy="34" r="7" fill="#fff2dc"/>`,
 stone:`<ellipse cx="40" cy="48" rx="34" ry="15" fill="#adbab1" stroke="#8a9c8f" stroke-width="3"/><ellipse cx="40" cy="44" rx="27" ry="10" fill="#d8dfd3"/>`,
 butterfly:`<path d="M40 65V36" stroke="#6d9269" stroke-width="4"/><path d="M40 26Q14 0 15 23Q16 43 39 36Q58 9 67 19Q71 40 41 36" fill="#e5afc4" stroke="#ba89ad" stroke-width="2"/><circle cx="40" cy="35" r="5" fill="#d8bb87"/>`,
 hedge:`<rect x="8" y="32" width="64" height="27" rx="13" fill="#83aa7d"/><circle cx="23" cy="31" r="17" fill="#98bf89"/><circle cx="43" cy="26" r="21" fill="#90b986"/><circle cx="62" cy="32" r="16" fill="#9fbe8d"/>`,
 basket:`<path d="M17 29h47l-7 31H24Z" fill="#ca9a6c" stroke="#99724e" stroke-width="3"/><path d="M27 30Q27 2 40 7Q55 5 55 30" fill="none" stroke="#99724e" stroke-width="5"/><path d="M21 40h39M23 51h36M31 30v28M47 30v28" stroke="#eed0a0" stroke-width="3"/>`,
 sign:`<path d="M41 20v45" stroke="#987754" stroke-width="6"/><rect x="12" y="15" width="56" height="26" rx="5" fill="#d5b388" stroke="#a17e57" stroke-width="3"/><path d="M23 27h34M28 33h24" stroke="#fff1d5" stroke-width="3"/>`,
 windmill:`<path d="M26 63L33 25h14l8 38Z" fill="#f4e2c7" stroke="#bd9c75" stroke-width="3"/><circle cx="40" cy="23" r="6" fill="#c2a682"/><path d="M40 23V3M40 23h26M40 23v24M40 23H14" stroke="#dfbba0" stroke-width="9" stroke-linecap="round"/>`,
 pond:`<ellipse cx="40" cy="48" rx="36" ry="16" fill="#a0c8c9" stroke="#7da9a8" stroke-width="3"/><ellipse cx="35" cy="46" rx="20" ry="8" fill="#c5e4dc"/><path d="M12 45l9-5m37 14 9-3" stroke="#f8faf0" stroke-width="2"/>`,
 swing:`<path d="M10 64L28 8h24l18 56M28 8h24" fill="none" stroke="#aa886a" stroke-width="6" stroke-linecap="round"/><path d="M30 17v33m21-33v33" stroke="#c9aa86" stroke-width="2"/><path d="M25 50h32v8H25z" fill="#d2b08e"/>`,
 lantern:`<path d="M40 10v10" stroke="#87795b" stroke-width="3"/><path d="M25 20h30l-5 25H30z" fill="#f3d49d" stroke="#b89074" stroke-width="3"/><path d="M24 20Q40 2 56 20" fill="none" stroke="#b89074" stroke-width="4"/><path d="M40 45v20" stroke="#91785b" stroke-width="3"/>`
 };return `<svg viewBox="0 0 80 70" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${a[id]||''}</svg>`}
function gardenFlower(i,learned,mastered){let needed=(i+1)*10;let level=learned<needed-9?0:learned<needed-4?1:learned<needed?2:3;let palette=['#edaea9','#ebc46e','#d8b2d6','#a4c9db','#f1c8a7','#d3a7c2'];let color=palette[i%palette.length];let bloom=level===3,remembered=mastered>=needed;
 return `<svg class="personal-flower level-${level}" viewBox="0 0 64 82" role="img" aria-label="화단 ${i+1}: ${['씨앗','새싹','꽃봉오리','활짝 핀 꽃'][level]}"><ellipse cx="32" cy="73" rx="23" ry="7" fill="#9eb38b" opacity=".35"/>${level===0?'<ellipse cx="32" cy="70" rx="7" ry="4" fill="#a98766"/>':`<path d="M32 71Q27 52 32 ${level===1?46:19}" fill="none" stroke="#6b9d77" stroke-width="4" stroke-linecap="round"/><path d="M31 59Q11 44 13 56Q20 65 31 62M32 51Q48 39 50 49Q47 57 32 55" fill="#9dbc84" stroke="#6b9d77" stroke-width="1.5"/>${level===1?'':level===2?`<ellipse cx="32" cy="24" rx="8" ry="12" fill="${color}"/>`:`<g fill="${color}" stroke="#b98f88" stroke-width=".7">${[0,60,120,180,240,300].map(r=>`<ellipse cx="32" cy="18" rx="8" ry="13" transform="rotate(${r} 32 31)"/>`).join('')}</g><circle cx="32" cy="31" r="8" fill="#f6e0a0"/>${remembered?'<path d="M43 15l4-8 4 8 8 4-8 4-4 8-4-8-8-4z" fill="#fff3b7"/>':''}`}`}</svg>`}
function gardenAvailable(id){const g=gardenState();const total=Number(g.inventory[id])||0;const used=Object.values(g.placements).filter(raw=>(typeof raw==='string'?raw:raw?.id)===id).length;return ['bench','pot'].includes(id)?99:Math.max(0,total-used)}
// v17: free positioning instead of predetermined slot buttons.
let gardenTool='place';
let gardenSelectedObject=null;
function gardenView(){
 const learned=gardenLearned(),mastered=gardenMastered(),g=gardenState();
 const flowers=wg9FlowerStates().map((f,i)=>f.level===0?'':`<div class="garden-flower wg9-village-bed ${f.level>0&&f.level<4?'growing':''} ${f.level===4?'bloomed':''}" style="left:${WG9_BEDS[i].x}%;top:${WG9_BEDS[i].y}%" title="${f.village} · ${f.name} ${f.rate}%">${wg9FlowerArt(f)}</div>`).join('');
 const ornaments=Object.entries(g.placements).map(([key,raw])=>{
  const pos=gardenPlaced(raw,Number(key));if(!pos||!GARDEN_ITEMS.some(x=>x.id===pos.id))return '';
  const item=GARDEN_ITEMS.find(x=>x.id===pos.id);
  return `<button type="button" class="wg17-ornament ${gardenSelectedObject===key?'chosen':''}" data-ornament="${key}" style="left:${pos.x}%;top:${pos.y}%;--scale:${pos.scale}" title="${item.name}: 드래그하여 이동" aria-label="${item.name} 이동 및 크기 조절">${wg19GardenIllustration(pos.id)}</button>`;
 }).join('');
 return `<div class="personal-garden wg17-garden"><div class="garden-v5-intro"><div><span class="garden-kicker">MY WORD GARDEN · 나만의 작은 쉼터</span><h1>🌷 나의 단어 정원</h1><p>원하는 곳을 눌러 장식을 놓고, 놓은 장식은 자유롭게 움직이세요.</p></div><button class="btn secondary" data-nav="home">← 홈</button></div>
 <div class="garden-v5-stats"><span>🌱 배운 단어 <strong>${learned}개</strong></span><span>🌸 오래 기억한 단어 <strong>${mastered}개</strong></span><span>🌸 꽃잎 <strong>${g.petals||0}개</strong></span><span>🪴 놓은 장식 <strong>${Object.keys(g.placements).length}개</strong></span></div>
 <div class="wg17-tools"><strong id="wg17Mode">${gardenTool==='place'?'🌱 장식 배치 모드':'✋ 장식 선택 모드'}</strong><span>빈 공간 클릭: 선택한 장식 놓기 · 장식 끌기: 위치 이동</span><button type="button" class="btn secondary small" id="decorSmaller">− 작게</button><button type="button" class="btn secondary small" id="decorBigger">＋ 크게</button><span id="decorSizeText">${gardenSelectedObject&&g.placements[gardenSelectedObject]?Math.round(gardenPlaced(g.placements[gardenSelectedObject],0).scale*100)+'%':'장식 선택'}</span><button type="button" class="btn secondary small" id="gardenRemove">선택 장식 삭제</button><button type="button" class="btn secondary small" id="gardenReset">모두 치우기</button></div>
 <div class="wg20-garden-guide" aria-label="다섯 마을 대표 꽃 안내">${wg9FlowerStates().map((f,i)=>`<div class="wg20-garden-legend"><span>${f.icon}</span><strong>${f.name}</strong><small>${f.village}</small><small>${f.done}/${f.count} DAY · ${f.rate}%</small></div>`).join('')}</div>
 <div class="garden-personal-board wg17-board" id="wg17Board" aria-label="장식을 자유롭게 배치하는 정원"><img class="garden-v5-background" src="assets/garden-c.png" alt="" aria-hidden="true"><div class="garden-v5-sign">✿ MY LITTLE GARDEN</div>${flowers}${ornaments}</div><p class="garden-map-hint">✨ 빛나는 대표 꽃은 학습 성과에 따라 자동 성장해요. 꾸미기 장식만 이동할 수 있습니다.</p>
 <aside class="garden-v5-editor"><div class="garden-editor-title"><h2>🪴 정원 꾸미기 · 장식 상점</h2><p>배치할 장식의 '배치'를 누른 뒤 정원에서 원하는 위치를 클릭하세요. 배치한 장식을 탭하고 ± 버튼으로 크기를 조절할 수 있어요.</p></div><div class="garden-v5-items">${GARDEN_ITEMS.map(x=>{const owned=Number(g.inventory[x.id]||0),avail=gardenAvailable(x.id),free=x.cost===0;return `<div class="garden-shop-tile ${gardenTool==='place'&&gardenSelected===x.id?'picked':''}"><div class="garden-shop-art">${wg19GardenIllustration(x.id)}</div><strong>${x.name}</strong><small>보유 ${free?'무제한':owned} · 배치 가능 ${free?'무제한':avail}</small><div class="garden-shop-actions"><button class="btn secondary small" data-garden-item="${x.id}" ${avail<=0?'disabled':''}>배치</button>${!free?`<button class="btn small" data-garden-buy="${x.id}" ${g.petals<x.cost?'disabled':''}>+ 구매 🌸${x.cost}</button>`:''}</div></div>`}).join('')}</div></aside></div>`;
}
function bindGarden(){
 if(view!=='garden')return;
 const g=gardenState();const board=document.getElementById('wg17Board');if(!board)return;
 const commit=()=>{save();render()};
 function point(e){const r=board.getBoundingClientRect();return {x:Math.round(Math.min(98,Math.max(2,(e.clientX-r.left)/r.width*100))*100)/100,y:Math.round(Math.min(98,Math.max(2,(e.clientY-r.top)/r.height*100))*100)/100}}
 function select(key){gardenSelectedObject=key;gardenTool='select';document.querySelectorAll('[data-ornament]').forEach(el=>el.classList.toggle('chosen',el.dataset.ornament===key));document.getElementById('wg17Mode').textContent='✋ 장식 선택 모드';const pos=gardenPlaced(g.placements[key],0);document.getElementById('decorSizeText').textContent=pos?Math.round(pos.scale*100)+'%':'장식 선택'}
 board.addEventListener('click',e=>{
  if(e.target.closest('[data-ornament]'))return;
  if(gardenTool!=='place'){gardenSelectedObject=null;gardenTool='place';document.getElementById('wg17Mode').textContent='🌱 장식 배치 모드';return}
  const item=GARDEN_ITEMS.find(x=>x.id===gardenSelected);
  if(!item)return toast('먼저 아래에서 장식을 선택하세요.');
  if(gardenAvailable(item.id)<=0)return toast('배치 가능한 장식이 없어요. 먼저 구매해 주세요.');
  const coord=point(e),key='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  g.placements[key]={id:item.id,...coord,scale:.85};gardenSelectedObject=key;gardenTool='select';commit();toast(item.name+' 배치 완료! 끌어서 이동할 수 있어요.');
 });
 document.querySelectorAll('[data-ornament]').forEach(el=>{
  const key=el.dataset.ornament;let start=null,moved=false;
  el.addEventListener('pointerdown',e=>{
   if(e.button!==undefined&&e.button!==0)return;
   e.preventDefault();e.stopPropagation();select(key);moved=false;start={x:e.clientX,y:e.clientY};
   try{el.setPointerCapture(e.pointerId)}catch(_){}
  });
  el.addEventListener('pointermove',e=>{
   if(!start)return;
   if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>3)moved=true;
   if(!moved)return;
   e.preventDefault();const pos=point(e);el.style.left=pos.x+'%';el.style.top=pos.y+'%';
  });
  el.addEventListener('pointerup',e=>{
   if(!start)return;
   if(moved){const pos=point(e);g.placements[key]={...gardenPlaced(g.placements[key],0),...pos};commit();toast('장식 위치를 저장했어요.');}
   start=null;
   try{if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId)}catch(_){}
  });
  el.addEventListener('pointercancel',()=>{start=null;render()});
  el.addEventListener('click',e=>{e.stopPropagation();select(key)});
 });
 document.querySelectorAll('[data-garden-item]').forEach(btn=>btn.addEventListener('click',()=>{
  gardenSelected=btn.dataset.gardenItem;gardenSelectedObject=null;gardenTool='place';commit();toast('정원에서 원하는 위치를 눌러 배치하세요.');
 }));
 document.querySelectorAll('[data-garden-buy]').forEach(btn=>btn.addEventListener('click',()=>{
  const item=GARDEN_ITEMS.find(x=>x.id===btn.dataset.gardenBuy);if(!item||!item.cost)return;
  if(g.petals<item.cost)return toast('꽃잎이 부족해요.');
  if(!confirm(`${item.name} 1개를 꽃잎 ${item.cost}개로 구매할까요?`))return;
  g.petals-=item.cost;g.inventory[item.id]=(Number(g.inventory[item.id])||0)+1;
  if(!g.owned.includes(item.id))g.owned.push(item.id);
  gardenSelected=item.id;gardenTool='place';gardenSelectedObject=null;commit();toast('구매 완료! 정원에서 아무 곳이나 누르세요.');
 }));
 function resize(delta){if(!gardenSelectedObject||!g.placements[gardenSelectedObject])return toast('크기를 바꿀 장식을 먼저 선택하세요.');const key=gardenSelectedObject;const pos=gardenPlaced(g.placements[key],0);pos.scale=Math.round(Math.max(.4,Math.min(2.5,pos.scale+delta))*100)/100;g.placements[key]=pos;commit()}
 document.getElementById('decorSmaller')?.addEventListener('click',()=>resize(-.15));
 document.getElementById('decorBigger')?.addEventListener('click',()=>resize(.15));
 document.getElementById('gardenRemove')?.addEventListener('click',()=>{if(!gardenSelectedObject||!g.placements[gardenSelectedObject])return toast('삭제할 장식을 먼저 선택하세요.');delete g.placements[gardenSelectedObject];gardenSelectedObject=null;gardenTool='select';commit();});
 document.getElementById('gardenReset')?.addEventListener('click',()=>{if(confirm('배치한 장식을 모두 치울까요? 구매한 장식은 보유 상태로 남습니다.')){g.placements={};gardenSelectedObject=null;gardenTool='place';commit()}});
}


/* v8.1: initialize only after garden constants and render helpers are ready. */
seed800();checkDayRewards();render();if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
