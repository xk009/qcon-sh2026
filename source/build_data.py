import re,json,html as H,os,datetime
def load(p):
    h=open(p,encoding='utf-8').read()
    return json.loads(re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>',h,re.S).group(1))
d=load('/workspace/sched.html')
def V(v,dd=d): return dd[v] if isinstance(v,int) else v
speakers={}
for x in d:
    if isinstance(x,dict) and 'company' in x and 'name' in x and 'position' in x:
        sid=V(x['id'])
        if sid not in speakers:
            speakers[sid]=dict(name=V(x['name']) or '',company=V(x['company']) or '',position=V(x['position']) or '',bio=V(x['introduce']) or '',avatar=V(x['avatar']) or '')
topics={}
for x in d:
    if isinstance(x,dict) and 'producerIds' in x:
        tid=V(x['id'])
        if tid in topics: continue
        pids=[V(i) for i in (V(x['producerIds']) or [])]
        topics[tid]=dict(name=(V(x['topic']) or '').strip(),sub=(V(x['type_name']) or '').strip(),desc=V(x['description']) or '',producers=[speakers[p] for p in pids if p in speakers])
ALLOWED={'p','br','strong','b','ul','ol','li','em'}
def clean(h):
    h=h or ''
    h=re.sub(r'<(script|style)[^>]*>.*?</\1>','',h,flags=re.S|re.I)
    def tag(m):
        t=m.group(2).lower()
        return f'<{m.group(1)}{t}>' if t in ALLOWED else ''
    h=re.sub(r'<(/?)([a-zA-Z0-9]+)[^>]*?/?>',tag,h)
    h=re.sub(r'<p>\s*(&nbsp;|\s)*</p>','',h)
    return h.strip()
def text(h): return H.unescape(re.sub(r'<[^>]+>','',h or '')).strip()
CATS=[('outline',('提纲','大纲')),('highlights',('亮点',)),('takeaways',('收益',)),('audience',('适合人群','听众对象','目标听众','适合听众'))]
def split(intro):
    # split on paragraphs that are just a strong heading
    parts=re.split(r'<p>\s*<strong>([^<]{1,30}?)[：:]?\s*</strong>\s*[：:]?\s*</p>',intro)
    res={'abstract':parts[0].strip(),'outline':'','highlights':'','takeaways':'','audience':'','extra':[]}
    # merge back non-section headings (e.g. numbered outline items)
    merged=[parts[0]]
    for i in range(1,len(parts),2):
        head=H.unescape(parts[i]).strip(' ：:')
        if re.match(r'^[\d一二三四五六七八九十（(]',head) or len(head)>12:
            merged[-1]+=f'<p><strong>{parts[i]}</strong></p>'+parts[i+1]
        else: merged+= [parts[i],parts[i+1]]
    parts=merged
    for i in range(1,len(parts),2):
        head=H.unescape(parts[i]).strip(' ：:'); body=parts[i+1].strip()
        for k,keys in CATS:
            if any(s in head for s in keys) and not res[k]:
                res[k]=body;break
        else:
            if any(s in head for s in ('演讲介绍','演讲简介','案例背景','背景')) and not res['abstract']:
                res['abstract']=body
            else: res['extra'].append({'title':head,'html':body})
    return res
rows=[x for x in d if isinstance(x,dict) and 'pptStatus' in x]
talks={}
for x in rows:
    lid=V(x['id'])
    if lid in talks: continue
    intro=V(x['introduce']) or ''
    pf=f'/workspace/pages/{lid}.html'
    src='schedule'
    if os.path.exists(pf):
        try:
            pd=load(pf)
            for y in pd:
                if isinstance(y,dict) and 'pptStatus' in y and V(y['id'],pd)==lid:
                    pi=V(y['introduce'],pd) or ''
                    if len(pi)>=len(intro): intro=pi; src='page'
                    break
        except Exception as e: print('ERR',lid,e)
    sec=split(clean(intro))
    t=topics.get(V(x['topicId']),{})
    spk=[speakers[V(s)] for s in (V(x['speakerIds']) or []) if V(s) in speakers]
    talks[lid]=dict(id=lid,title=V(x['title']).strip(),begin=V(x['beginTime']),end=V(x['endTime']),room=(V(x['address']) or '').strip(),
        track=t.get('name',''),trackSub=t.get('sub',''),trackId=V(x['topicId']),
        noVideo=V(x['videoStatus']) is False,noPpt=str(V(x['pptStatus']))=='1',
        speakers=[dict(name=s['name'],company=s['company'],position=s['position'],bio=clean(s['bio'])) for s in spk],
        summary=V(x['intro']) or '',**sec,src=src)
tr={tid:dict(name=t['name'],sub=t['sub'],producers=[dict(name=p['name'],company=p['company'],position=p['position']) for p in t['producers']]) for tid,t in topics.items() if any(v['trackId']==tid for v in talks.values())}
out=dict(snapshot=datetime.datetime.now().strftime('%Y-%m-%d %H:%M')+' (UTC+8)',talks=sorted(talks.values(),key=lambda t:(t['begin'],t['room'])),tracks=tr)
json.dump(out,open('/workspace/qcon-app/src/data.json','w'),ensure_ascii=False)
import collections
T=out['talks']
print(len(T),collections.Counter(t['src'] for t in T))
for k in ['abstract','outline','highlights','takeaways','audience']: print(k,sum(1 for t in T if t[k]))
print('bio',sum(1 for t in T if any(s['bio'] for s in t['speakers'])),'extra',collections.Counter(e['title'] for t in T for e in t['extra']).most_common(30))
print('nospk',[t['title'] for t in T if not t['speakers']])
print('producers',sum(1 for t in tr.values() if t['producers']),len(tr))
