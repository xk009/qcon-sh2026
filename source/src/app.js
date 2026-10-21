(function(){
const D=window.QCON_DATA,T=D.talks,TR=D.tracks;
const byId={};T.forEach(t=>byId[t.id]=t);
const DAYS=[['2026-10-22','10/22 周四'],['2026-10-23','10/23 周五'],['2026-10-24','10/24 周六']];
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hm=s=>s.slice(11,16), day=t=>t.begin.slice(0,10);
const strip=h=>(h||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&[a-z]+;/g,'');
const LS='qcon26_stars',LF='qcon26_filters';
let stars=new Set(JSON.parse(localStorage.getItem(LS)||'[]'));
let F=Object.assign({day:null,q:'',track:'',room:'',share:'all'},JSON.parse(localStorage.getItem(LF)||'{}'));
if(!F.day){const now=new Date(Date.now()+8*3600e3).toISOString().slice(0,10);F.day=DAYS.some(d=>d[0]===now)?now:DAYS[0][0];}
const saveF=()=>localStorage.setItem(LF,JSON.stringify(F));
const saveS=()=>{localStorage.setItem(LS,JSON.stringify([...stars]));$('#starCount').textContent=stars.size||'';};
const spkLine=t=>t.speakers.map(s=>esc(s.name)+(s.company?' · '+esc(s.company):'')).join('；');
const badges=t=>(t.noVideo?'<span class="bad v">不录像</span>':'')+(t.noPpt?'<span class="bad p">不发PPT</span>':'')+(!t.noVideo&&!t.noPpt?'<span class="bad ok">视频+PPT</span>':'');
const room=r=>r.replace('浦江皇冠假日酒店 2F ','');
const hay={};T.forEach(t=>hay[t.id]=[t.title,t.track,t.room,t.summary,strip(t.abstract),...t.speakers.flatMap(s=>[s.name,s.company,s.position])].join(' ').toLowerCase());
function card(t,conf){
  return `<a class="card${conf?' conf':''}" href="#/talk/${t.id}"><button class="star${stars.has(t.id)?' on':''}" data-star="${t.id}" aria-label="收藏">${stars.has(t.id)?'★':'☆'}</button>
  <div class="ti">${esc(t.title)}</div><div class="sp">${spkLine(t)}</div>
  <div class="meta"><span class="tag room">📍${esc(room(t.room))}</span>${t.track?`<span class="tag tr">${esc(t.track)}</span>`:''}${badges(t)}</div></a>`;
}
function slots(list,confs){
  const g={};list.forEach(t=>{const k=hm(t.begin)+'–'+hm(t.end);(g[k]=g[k]||[]).push(t)});
  return Object.keys(g).sort().map(k=>`<div class="slot"><h3>${k}</h3>${g[k].map(t=>card(t,confs&&confs.has(t.id))).join('')}</div>`).join('');
}
function setDays(show){
  $('#days').style.display=show?'flex':'none';
  $('#days').innerHTML=DAYS.map(([d,l])=>`<button data-day="${d}" class="${F.day===d?'on':''}">${l}</button>`).join('');
}
function list(){
  setDays(true);
  const dayT=T.filter(t=>day(t)===F.day);
  const tracks=[...new Set(dayT.map(t=>t.track).filter(Boolean))];
  const rooms=[...new Set(dayT.map(t=>room(t.room)))].sort();
  if(F.track&&!tracks.includes(F.track))F.track='';if(F.room&&!rooms.includes(F.room))F.room='';
  const q=F.q.trim().toLowerCase();
  const res=dayT.filter(t=>(!F.track||t.track===F.track)&&(!F.room||room(t.room)===F.room)
    &&(F.share==='all'||(F.share==='ppt'&&!t.noPpt)||(F.share==='full'&&!t.noPpt&&!t.noVideo))
    &&(!q||q.split(/\s+/).every(w=>hay[t.id].includes(w))));
  $('#app').innerHTML=`<div class="filters"><input type="search" id="q" placeholder="搜索 标题 / 讲师 / 公司 / 摘要" value="${esc(F.q)}">
   <div class="frow"><select id="track"><option value="">全部专题</option>${tracks.map(x=>`<option ${x===F.track?'selected':''}>${esc(x)}</option>`).join('')}</select>
   <select id="room"><option value="">全部会场</option>${rooms.map(x=>`<option ${x===F.room?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
   <div class="chips">${[['all','全部'],['ppt','隐藏不发PPT'],['full','只看视频+PPT都发']].map(([k,l])=>`<button class="chip${F.share===k?' on':''}" data-share="${k}">${l}</button>`).join('')}</div>
   <div class="count">共 ${res.length} / ${dayT.length} 场</div></div>
   ${res.length?slots(res):'<div class="empty">没有符合条件的演讲</div>'}`;
  const qi=$('#q');qi.oninput=()=>{F.q=qi.value;saveF();const p=qi.selectionStart;list();const n=$('#q');n.focus();n.setSelectionRange(p,p)};
  $('#track').onchange=e=>{F.track=e.target.value;saveF();list()};
  $('#room').onchange=e=>{F.room=e.target.value;saveF();list()};
}
function mine(){
  setDays(false);window.scrollTo(0,0);
  const my=T.filter(t=>stars.has(t.id));
  if(!my.length){$('#app').innerHTML='<div class="empty">还没有收藏的演讲<br>在列表里点 ☆ 加入我的日程</div>';return;}
  let html='';
  DAYS.forEach(([d,l])=>{
    const ds=my.filter(t=>day(t)===d).sort((a,b)=>a.begin<b.begin?-1:1);if(!ds.length)return;
    const confs=new Set(),pairs=[];
    for(let i=0;i<ds.length;i++)for(let j=i+1;j<ds.length;j++){const a=ds[i],b=ds[j];if(a.begin<b.end&&b.begin<a.end){confs.add(a.id);confs.add(b.id);pairs.push([a,b])}}
    html+=`<div class="slot"><h3>${l} · ${ds.length} 场</h3>`+
      pairs.map(([a,b])=>`<div class="warn">⚠️ 时间冲突：${hm(a.begin)}「${esc(a.title.slice(0,16))}…」与 ${hm(b.begin)}「${esc(b.title.slice(0,16))}…」</div>`).join('')+
      ds.map(t=>`<div style="font-size:12px;color:var(--m);margin:6px 2px 2px">${hm(t.begin)}–${hm(t.end)}</div>`+card(t,confs.has(t.id))).join('')+'</div>';
  });
  const nv=my.filter(t=>t.noVideo).length,np=my.filter(t=>t.noPpt).length;
  $('#app').innerHTML=`<div class="filters" style="font-size:13px">已收藏 ${my.length} 场，其中不录像 ${nv} 场、不发PPT ${np} 场（这些建议现场重点记）。</div>`+html;
}
function sec(title,h){return h&&strip(h).trim()?`<div class="sec"><h2>${esc(title)}</h2><div class="body">${h}</div></div>`:''}
function detail(id){
  setDays(false);
  const t=byId[id];if(!t){$('#app').innerHTML='<div class="empty">找不到这场演讲</div>';return;}
  const dl=T.filter(x=>day(x)===day(t)),i=dl.indexOf(t),pv=dl[i-1],nx=dl[i+1];
  const tr=TR[t.trackId]||{};
  const dlab=(DAYS.find(d=>d[0]===day(t))||[,''])[1];
  $('#app').innerHTML=`<a class="back" href="#/">‹ 返回日程</a><div class="detail" style="position:relative">
  <button class="star${stars.has(t.id)?' on':''}" data-star="${t.id}" style="font-size:26px">${stars.has(t.id)?'★':'☆'}</button>
  <h1>${esc(t.title)}</h1><div class="when">🕒 ${dlab} ${hm(t.begin)}–${hm(t.end)}　📍${esc(t.room)}</div>
  <div class="meta">${t.track?`<span class="tag tr">${esc(t.track)}</span>`:''}${badges(t)}</div>
  ${t.noVideo||t.noPpt?`<div class="warn">${t.noVideo?'本场不录像、会后不发视频。':''}${t.noPpt?'本场 PPT 不公开，现场也请尊重讲师意愿、别随手拍。':''}</div>`:''}
  ${sec('演讲介绍',t.abstract||(t.summary?'<p>'+esc(t.summary)+'</p>':''))}
  ${(t.extra||[]).map(e=>sec(e.title,e.html)).join('')}
  ${sec('演讲提纲',t.outline)}${sec('演讲亮点',t.highlights)}${sec('听众收益',t.takeaways)}${sec('适合人群',t.audience)}
  <div class="sec"><h2>讲师</h2>${t.speakers.map((s,k)=>`<div class="spk"><b>${esc(s.name)}</b><div class="pos">${esc(s.company)}${s.position?' / '+esc(s.position):''}</div>${s.bio?`<div class="bio clamp" id="bio${k}">${s.bio}</div><button class="more" data-more="bio${k}">展开</button>`:''}</div>`).join('')||'<div class="pos">—</div>'}</div>
  ${tr.name?`<div class="sec"><h2>所属专题</h2><div class="body"><b>${esc(tr.name)}</b>${tr.sub?' · '+esc(tr.sub):''}${tr.producers&&tr.producers.length?`<div style="margin-top:4px;color:var(--m);font-size:13px">出品人：${tr.producers.map(p=>esc(p.name)+(p.company?'（'+esc(p.company)+(p.position?' / '+esc(p.position):'')+'）':'')).join('；')}</div>`:''}</div></div>`:''}
  <a class="btn" href="https://qcon.infoq.cn/2026/shanghai/presentation/${t.id}" target="_blank" rel="noopener">查看官网页面 ↗</a></div>
  <div class="pn">${pv?`<a href="#/talk/${pv.id}"><small>‹ 上一场 ${hm(pv.begin)}</small>${esc(pv.title.slice(0,22))}</a>`:'<span style="flex:1"></span>'}${nx?`<a class="r" href="#/talk/${nx.id}"><small>下一场 ${hm(nx.begin)} ›</small>${esc(nx.title.slice(0,22))}</a>`:'<span style="flex:1"></span>'}</div>`;
  window.scrollTo(0,0);
}
let lastY=0;
function hdr(){document.documentElement.style.setProperty('--hh',document.getElementById('top').offsetHeight+'px')}
window.addEventListener('resize',hdr);
function route(){
  const h=location.hash||'#/';
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',(a.dataset.nav==='mine')===(h==='#/mine')));
  const m=h.match(/^#\/talk\/(\d+)/);
  if(m)detail(+m[1]);else if(h==='#/mine')mine();else{list();window.scrollTo(0,lastY);}
  hdr();
}
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-star]');
  if(s){e.preventDefault();e.stopPropagation();const id=+s.dataset.star;stars.has(id)?stars.delete(id):stars.add(id);saveS();s.classList.toggle('on',stars.has(id));s.textContent=stars.has(id)?'★':'☆';if(location.hash==='#/mine')mine();return;}
  const d=e.target.closest('[data-day]');if(d){F.day=d.dataset.day;saveF();list();window.scrollTo(0,0);return;}
  const c=e.target.closest('[data-share]');if(c){F.share=c.dataset.share;saveF();list();return;}
  const mo=e.target.closest('[data-more]');if(mo){const b=document.getElementById(mo.dataset.more);b.classList.toggle('clamp');mo.textContent=b.classList.contains('clamp')?'展开':'收起';return;}
  const a=e.target.closest('a.card');if(a&&!/^#\/talk/.test(location.hash||''))lastY=window.scrollY;
});
window.addEventListener('hashchange',route);
$('#foot').innerHTML=`数据快照：${esc(D.snapshot)}，来自 QCon 官网。不录像 / 不发PPT 图标可能调整，以<a href="https://qcon.infoq.cn/2026/shanghai/schedule" target="_blank" rel="noopener">官网日程</a>为准。<br>收藏仅保存在本机浏览器。`;
saveS();route();
})();
