/** Real offline-HTML demonstration captures for the project introduction; no product changes. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '..');
if (!ROOT.toUpperCase().startsWith('D:\\')) throw Error('D-drive workspace required');
process.env.TEMP = process.env.TMP = path.join(ROOT, '.cache', 'tmp');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(ROOT, '.cache', 'playwright');
const { chromium } = require(path.join(ROOT, 'PathLab-AI/node_modules/@playwright/test'));
const OUT = path.join(ROOT, 'docs/assets/project-introduction');
const HTML = path.join(ROOT, 'PathLab-AI/PathLab AI.html');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const records = [], errors = [], requests = [], actions = [];
const settle = async page => {
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
  await page.waitForTimeout(180);
};
async function capture(page, name, caption, locator, extra = {}) {
  await settle(page);
  const target = locator || page;
  const dest = path.join(OUT, name + '.png');
    if (extra.clipHeight) {
    await locator.evaluate(el=>window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY,behavior:'instant'}));
    await settle(page);
    const box=await locator.boundingBox();
    await page.screenshot({path:dest,animations:'disabled',clip:{x:box.x,y:Math.max(0,box.y),width:box.width,height:Math.min(extra.clipHeight,box.height)}});
  } else await target.screenshot({path:dest, animations:'disabled', ...(locator ? {} : {fullPage:false})});
  records.push({id:name, file:path.relative(ROOT,dest).replaceAll('\\','/'), caption,
    viewport:page.viewportSize(),deviceScaleFactor:2,reducedMotion:'reduce',
    capture:locator?'actual UI element crop':'actual viewport',
    workbenchState:await page.getByTestId('learning-workbench').getAttribute('data-state'),
    sha256:sha(fs.readFileSync(dest)), bytes:fs.statSync(dest).size, ...extra});
}
async function finish(page) {
  for(let n=0;n<180;n++) {
    const state=await page.getByTestId('learning-workbench').getAttribute('data-state');
    if(state==='reflection') return;
    if(state==='prediction') {
      await page.locator('[data-testid^="candidate-"]').first().click();
      await page.getByTestId('submit-prediction').click();
    } else if(state==='paused') await page.getByTestId('step').click();
    else throw Error('Unexpected learning state '+state);
  }
  throw Error('Run did not finish');
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true}); fs.mkdirSync(process.env.TEMP,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN',deviceScaleFactor:2,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto(pathToFileURL(HTML).href,{waitUntil:'load'});
  await page.getByTestId('learning-workbench').waitFor();
  await capture(page,'01-overview','完整离线 HTML 首页，桌面 1440×1000 模拟视口；初始状态。');
  await page.getByRole('button',{name:'开始预测',exact:true}).click();
  for(let n=0;n<10 && await page.getByTestId('learning-workbench').getAttribute('data-state')!=='prediction';n++) await page.getByTestId('step').click();
  await page.locator('[data-testid^="candidate-"]').first().click();
  await capture(page,'02-prediction','L01 先选候选、再显式提交；此图尚未揭示下一步。', page.locator('.mission-panels'),{clipHeight:760});
  actions.push('L01: AI chose first displayed candidate for each checkpoint (not an optimal learner policy).');
  await finish(page);
  await capture(page,'03-search-result','L01 BFS 运行结束后的实际路径、计数与回放控制。',page.locator('.map-panel'),{
    clipHeight:700,pathLength:await page.getByTestId('path-length').innerText(),expandedCount:await page.getByTestId('expanded-count').innerText()});
  await page.getByTestId('open-condition').click();
  await page.getByTestId('apply-condition').click();
  await page.getByRole('button',{name:'开始预测',exact:true}).click();
  await finish(page);
  await capture(page,'04-condition-comparison','L01 同一算法、一次条件修改后的真实前后比较；不保证指标必然改善。',page.locator('.reflection-columns'),{
    beforePath:await page.getByTestId('comparison-before-path').innerText(),afterPath:await page.getByTestId('comparison-after-path').innerText(),
    beforeExpanded:await page.getByTestId('comparison-before-expanded').innerText(),afterExpanded:await page.getByTestId('comparison-after-expanded').innerText()});
  await page.getByLabel('复盘回答风格').selectOption('guided');
  await capture(page,'05-web-review','本地已揭示事实生成网页复盘内容；未点击复制、未打开 DeepSeek、未发送。',page.getByTestId('web-review'),{
    promptLength:(await page.getByTestId('web-review-preview').inputValue()).length,remoteSent:false});
  await page.locator('input[data-fact-type="counterfactual_applied"]').check();
  await page.locator('input[data-fact-type="run_finished"]').check();
  await page.getByLabel('2. 用自己的话解释').fill('演示记录（AI自动操作）：本次只修改了一个允许的地图条件，保持同一算法。请对照上方两次真实路径步数与扩展节点计数，并引用条件变更、运行结束事件；这些记录不代表已经掌握算法。');
  await page.getByTestId('generate-report').click();
  await capture(page,'06-evidence-report','带事件引用的报告快照；解释已明确标为 AI 自动演示，不是学习者实测。',page.getByTestId('reflection-report'));
  await page.getByRole('button',{name:'岔路探索',exact:true}).click();
  await page.getByLabel('地图编辑画笔').selectOption('wall');
  await page.locator('[data-play-cell="1,0"]').click();
  await page.getByLabel('扩展数量预测').selectOption('astar');
  await page.getByRole('button',{name:'提交预测并对比',exact:true}).click();
  await page.getByLabel('自由地图回放算法').selectOption('astar');
  await page.getByLabel('自由地图回放速度').selectOption('4');
  await page.getByRole('button',{name:'播放自由回放',exact:true}).click();
  await page.waitForFunction(()=>{const n=document.querySelector('[data-testid="playground-step"]');return n && n.textContent.includes('回放完成');},{},{timeout:20000});
  await capture(page,'07-playground','9×7 岔路预设上添加障碍、先预测，再双算法真实对比与 A* 回放完成。',page.getByTestId('playground'),{
    bfs:await page.getByTestId('playground-result-bfs').innerText(),astar:await page.getByTestId('playground-result-astar').innerText(),
    replay:await page.getByTestId('playground-step').innerText()});
  await page.getByText('备份、恢复与数据边界',{exact:true}).click();
  await capture(page,'08-storage','本机进度与 JSON 备份恢复面板；本次没有触发下载或导入。',page.getByTestId('progress-panel'));
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},locale:'zh-CN',deviceScaleFactor:2,reducedMotion:'reduce'});
  const mobile=await mobileContext.newPage();
  await mobile.setViewportSize({width:390,height:844});
  mobile.on('pageerror',e=>errors.push(e.message));
  mobile.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await mobile.goto(pathToFileURL(HTML).href,{waitUntil:'load'});
  await mobile.getByTestId('learning-workbench').waitFor();
  await mobile.evaluate(()=>window.scrollTo(0,0));
  await capture(mobile,'09-mobile','390×844 Edge 模拟移动视口，非手机真机照片；同一离线文件。');
  const manifest={edition:'2026-10-25',capturedAt:new Date().toISOString(),executor:'AI via Playwright + headless Microsoft Edge',
    source:{file:'PathLab-AI/PathLab AI.html',sha256:sha(fs.readFileSync(HTML)),bytes:fs.statSync(HTML).size},
    purpose:'真实作品介绍图片；界面为实际 HTML 渲染，不是设计稿；预测/解释为 AI 演示数据。',
    humanOrRealDeviceAcceptance:false,productRegressionSuiteRerun:false,externalDeepSeekUsed:false,apiPaidCalls:0,
    actions,pageErrors:errors,externalRequests:requests,screenshots:records};
  if(records.length!==9||errors.length||requests.length) throw Error('Capture validation failed '+JSON.stringify({count:records.length,errors,requests}));
  fs.writeFileSync(path.join(OUT,'capture-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest,null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
