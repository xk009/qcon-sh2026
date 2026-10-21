import sys,asyncio
from playwright.sync_api import sync_playwright
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/'
shots=len(sys.argv)<3
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=c.new_page(); pg.on('console',lambda m: m.type=='error' and errs.append(m.text)); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(base); pg.wait_for_selector('.card')
    print('cards day1',pg.locator('.card').count())
    if shots: pg.screenshot(path='screens/list.png')
    pg.click('[data-day="2026-10-23"]'); print('cards day2',pg.locator('.card').count())
    pg.click('[data-share="full"]'); print('full shared day2',pg.locator('.card').count())
    pg.click('[data-share="all"]')
    pg.fill('#q','美团'); print('search 美团',pg.locator('.card').count()); pg.fill('#q','')
    pg.locator('.star').nth(0).click(); pg.locator('.star').nth(1).click()
    pg.click('[data-day="2026-10-22"]'); pg.click('[data-star="7391"]'); pg.click('[data-star="7291"]')
    pg.goto(base+'#/mine'); pg.wait_for_timeout(300); print('mine cards',pg.locator('.card').count(),'warn',pg.locator('.warn').count())
    if shots: pg.screenshot(path='screens/mine.png')
    pg.goto(base+'#/talk/7391'); pg.wait_for_selector('.detail'); print('detail h1',pg.inner_text('h1'),'secs',[s for s in pg.locator('.sec h2').all_inner_texts()])
    if shots: pg.screenshot(path='screens/detail.png'); pg.screenshot(path='screens/detail_full.png',full_page=True)
    pg.goto(base+'#/talk/7404'); pg.wait_for_selector('.detail'); print('kiro',pg.inner_text('h1'))
    b.close()
print('errors',errs)
