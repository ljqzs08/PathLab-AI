# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playground.spec.ts >> playground protects endpoints, supports keyboard paint and undo without touching missions
- Location: tests\browser\playground.spec.ts:8:1

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator: getByTestId('playground').getByRole('button', { name: '提交预测并对比' })
Expected: disabled
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeDisabled" getByTestId('playground').getByRole('button', { name: '提交预测并对比' }) with timeout 5000ms
  - waiting for getByTestId('playground').getByRole('button', { name: '提交预测并对比' })

```

```yaml
- link "跳到任务工作台":
  - /url: "#mission-workspace"
- banner:
  - link "PathLabAI 路径学习实验室":
    - /url: "#top"
  - navigation "页面导航":
    - link "任务工作台":
      - /url: "#mission-workspace"
    - link "开发边界":
      - /url: "#development-status"
  - text: 本地模式 · 无需密钥
- main:
  - region "别急着找终点。 先解释下一步。":
    - paragraph: THINK FIRST. TRACE NEXT.
    - heading "别急着找终点。 先解释下一步。" [level=1]
    - paragraph: 成为校园配送调度员，把“会背算法”变成“能解释选择”。 从一个固定任务开始，逐步建立可验证的推理。
    - link "选择一项任务":
      - /url: "#mission-workspace"
    - text: THE LEARNING LOOP 本地学习闭环 · 已接入
    - list:
      - listitem:
        - text: "01"
        - strong: 先作预测
        - paragraph: 下一次，算法会选择哪个节点？
      - listitem:
        - text: "02"
        - strong: 用证据解释
        - paragraph: 查看队列、代价与真实事件。
      - listitem:
        - text: "03"
        - strong: 改变条件，再思考
        - paragraph: 一条路封锁后，推理有何不同？
    - paragraph: 先预测，再逐步揭示搜索证据。条件实验与证据复盘已接入，但完成记录不等于已经掌握。
  - region "让推理，不因刷新中断。":
    - paragraph: YOUR PROGRESS, ON THIS DEVICE
    - heading "让推理，不因刷新中断。" [level=2]
    - text: 本机存档
    - status: 本机存档就绪；操作后自动保存。
    - group: 备份、恢复与数据边界
  - region "任务工作台":
    - complementary "任务档案":
      - heading "任务档案" [level=2]
      - text: 4 个固定关卡
      - button "MISSION 01 一层一层抵达 按 FIFO 队列顺序预测下一次出队节点 BFS 正在查看" [pressed]:
        - text: MISSION 01
        - strong: 一层一层抵达
        - text: 按 FIFO 队列顺序预测下一次出队节点 BFS 正在查看
      - button "MISSION 02 施工区绕行 比较相同地图的最少步数和唯一扩展节点数 BFS / A* 查看简报":
        - text: MISSION 02
        - strong: 施工区绕行
        - text: 比较相同地图的最少步数和唯一扩展节点数 BFS / A* 查看简报
      - button "MISSION 03 封锁东门，重新规划 识别旧路径对新地图无效 A* 查看简报":
        - text: MISSION 03
        - strong: 封锁东门，重新规划
        - text: 识别旧路径对新地图无效 A* 查看简报
      - button "MISSION 04 调度员复盘 区分累计代价、剩余估计与搜索节点数 BFS / A* 查看简报":
        - text: MISSION 04
        - strong: 调度员复盘
        - text: 区分累计代价、剩余估计与搜索节点数 BFS / A* 查看简报
      - paragraph: 地图固定，推理可复现。 进度仅存在本机，请留意存档状态并导出备份。
    - status: 已选择 L01 一层一层抵达。任务简报。已选中 0 个节点。
    - paragraph: 校园调度 / L01
    - heading "一层一层抵达" [level=2]
    - text: 任务简报
    - paragraph: 图书馆机器人向医务室配送物资；每一步代价相同。
    - region "校园任务地图":
      - heading "校园任务地图" [level=3]
      - text: 尚未运行
      - figure "S 起点 G 终点 − 障碍 ◇ 预测候选（可点选） ○ 前沿 × 已扩展 虚线：当前回溯前缀 实线：已揭示最终路径":
        - group "一层一层抵达的地图，7列5行。起点坐标（0，2），终点坐标（6，2）。坐标从零开始；仅包含已揭示的搜索事实。":
          - button "查看坐标 (0, 0)，可通行，未发现"
          - button "查看坐标 (1, 0)，可通行，未发现"
          - button "查看坐标 (2, 0)，可通行，未发现"
          - button "查看坐标 (3, 0)，可通行，未发现"
          - button "查看坐标 (4, 0)，可通行，未发现"
          - button "查看坐标 (5, 0)，可通行，未发现"
          - button "查看坐标 (6, 0)，可通行，未发现"
          - button "查看坐标 (0, 1)，可通行，未发现"
          - button "查看坐标 (1, 1)，可通行，未发现"
          - button "查看坐标 (2, 1)，障碍，未发现"
          - button "查看坐标 (3, 1)，可通行，未发现"
          - button "查看坐标 (4, 1)，障碍，未发现"
          - button "查看坐标 (5, 1)，可通行，未发现"
          - button "查看坐标 (6, 1)，可通行，未发现"
          - button "查看坐标 (0, 2)，起点，未发现"
          - button "查看坐标 (1, 2)，可通行，未发现"
          - button "查看坐标 (2, 2)，可通行，未发现"
          - button "查看坐标 (3, 2)，可通行，未发现"
          - button "查看坐标 (4, 2)，可通行，未发现"
          - button "查看坐标 (5, 2)，可通行，未发现"
          - button "查看坐标 (6, 2)，终点，未发现"
          - button "查看坐标 (0, 3)，可通行，未发现"
          - button "查看坐标 (1, 3)，可通行，未发现"
          - button "查看坐标 (2, 3)，障碍，未发现"
          - button "查看坐标 (3, 3)，可通行，未发现"
          - button "查看坐标 (4, 3)，障碍，未发现"
          - button "查看坐标 (5, 3)，可通行，未发现"
          - button "查看坐标 (6, 3)，可通行，未发现"
          - button "查看坐标 (0, 4)，可通行，未发现"
          - button "查看坐标 (1, 4)，可通行，未发现"
          - button "查看坐标 (2, 4)，可通行，未发现"
          - button "查看坐标 (3, 4)，可通行，未发现"
          - button "查看坐标 (4, 4)，可通行，未发现"
          - button "查看坐标 (5, 4)，可通行，未发现"
          - button "查看坐标 (6, 4)，可通行，未发现"
        - text: S 起点 G 终点 − 障碍 ◇ 预测候选（可点选） ○ 前沿 × 已扩展 虚线：当前回溯前缀 实线：已揭示最终路径
      - text: S 起点
      - strong: (0, 2)
      - text: G 终点
      - strong: (6, 2)
      - text: 坐标从 0 开始
      - paragraph: 尚未运行；选择算法后先预测，再查看搜索证据。 地图可键盘操作：方向键查看相邻节点。
      - term: 已发现
      - definition: "0"
      - term: 已扩展
      - definition: "0"
      - term: 已选中
      - definition: "0"
      - term: 最短路径步数
      - definition: 未揭示
      - group "回放快捷键":
        - button "播放回放" [disabled]
        - button "单步 →" [disabled]
        - text: 速度
        - combobox "回放速度" [disabled]:
          - option "0.5×"
          - option "1×" [selected]
          - option "2×"
          - option "4×"
        - button "重置当前任务" [disabled]
      - paragraph: 聚焦回放快捷键区域：空格播放/暂停，右箭头单步。 单步=一次有效选中及邻居处理，不是动画帧。
      - region "节点检查器 点击或键盘选择地图节点":
        - heading "节点检查器 点击或键盘选择地图节点" [level=4]
        - paragraph: 该节点尚无已揭示的代价或父节点。不会显示未来搜索结果。
      - group: 有效前沿 0 个节点 · 按实际处理顺序
      - group: 事件时间线 0 条已揭示事件
    - region "这一关，要弄懂什么？":
      - paragraph: YOUR REASONING
      - heading "这一关，要弄懂什么？" [level=3]
      - list:
        - listitem:
          - paragraph: 按 FIFO 队列顺序预测下一次出队节点
        - listitem:
          - paragraph: 区分搜索扩展与最终路径
      - text: 本关算法
      - combobox "本关算法":
        - option "BFS" [selected]
      - paragraph: FIFO 先入先出；h=0 不参与选择。 运行中冻结输入，结果来自本地确定性内核。
      - text: 预测 → 事件 → 解释
      - paragraph: 先读任务，再作判断。提交前不会揭示实际答案。
      - button "开始预测"
      - text: 操作后尝试保存到本机；请以上方存档状态为准。无远程 AI 调用。
      - paragraph: 本任务已记录 0 次完整运行。首次预测符合规则 0/0；重跑不覆盖首次结果。
  - region "完成到哪里，就展示到哪里。":
    - paragraph: BUILD IN THE OPEN
    - heading "完成到哪里，就展示到哪里。" [level=2]
    - paragraph: 默认本地运行，不需要账号、API Key 或远程服务。
    - list:
      - listitem: 已就绪 四关简报 / BFS 与 A* / 预测门控 / Canvas 回放
      - listitem: 已就绪 条件实验 / 证据报告 / 本地规则反馈 / 本机存档 / JSON 备份
      - listitem: 未连接 远程 AI / 自由地图编辑
- contentinfo: PathLab AI 让每一步，都有理由。 阶段 6 · 本机进度与安全恢复
- alert
```

# Test source

```ts
  1   | /** AI browser checks; not human or physical-device acceptance. */
  2   | import { test, expect } from '@playwright/test';
  3   | import AxeBuilder from '@axe-core/playwright';
  4   | import { appUrl, noOverflow } from './helpers';
  5   | import { comparePlayground, createPlayground } from '../../src/domain/playground';
  6   | 
  7   | const scope = (page: import('@playwright/test').Page) => page.getByTestId('playground');
  8   | test('playground protects endpoints, supports keyboard paint and undo without touching missions', async ({ page }) => {
  9   |   await page.goto(appUrl);
  10  |   const area = scope(page);
> 11  |   await expect(area.getByRole('button', {name:'提交预测并对比'})).toBeDisabled();
      |                                                            ^ Error: expect(locator).toBeDisabled() failed
  12  |   await expect(area.getByTestId('playground-results')).toHaveCount(0);
  13  |   await area.locator('[data-play-cell="0,0"]').click();
  14  |   await expect(area.locator('[data-play-cell="0,0"]')).toHaveAttribute('data-kind','start');
  15  |   await area.locator('[data-play-cell="1,0"]').focus();
  16  |   await page.keyboard.press('Enter');
  17  |   await expect(area.locator('[data-play-cell="1,0"]')).toHaveAttribute('data-kind','wall');
  18  |   await page.keyboard.press('ArrowDown');
  19  |   await expect(area.locator('[data-play-cell="1,1"]')).toBeFocused();
  20  |   await expect(area.locator('[data-play-cell="1,1"]')).toHaveAttribute('data-kind','road');
  21  |   await page.keyboard.press('Space');
  22  |   await expect(area.locator('[data-play-cell="1,1"]')).toHaveAttribute('data-kind','wall');
  23  |   await area.getByRole('button', {name:'撤销编辑'}).click();
  24  |   await expect(area.locator('[data-play-cell="1,1"]')).toHaveAttribute('data-kind','road');
  25  |   await area.getByLabel('地图编辑画笔').selectOption('start');
  26  |   await area.locator('[data-play-cell="1,0"]').click();
  27  |   await expect(area.locator('[data-play-cell="1,0"]')).toHaveAttribute('data-kind','start');
  28  |   await area.getByLabel('地图编辑画笔').selectOption('goal');
  29  |   await area.locator('[data-play-cell="1,0"]').click();
  30  |   await expect(area.locator('[data-play-cell="8,0"]')).toHaveAttribute('data-kind','goal');
  31  |   await expect(page.getByTestId('learning-workbench')).toHaveAttribute('data-state','briefing');
  32  |   await expect(page.getByTestId('map-grid').locator('[data-cell="1,0"]')).not.toHaveAttribute('data-kind','start');
  33  |   await noOverflow(page);
  34  | });
  35  | 
  36  | test('predicted comparison uses actual metrics and replay clears on map changes', async ({ page }) => {
  37  |   await page.goto(appUrl);
  38  |   const area = scope(page), result = comparePlayground(createPlayground('detour'));
  39  |   await area.getByLabel('扩展数量预测').selectOption(result.fewerExpanded);
  40  |   await area.getByRole('button', {name:'提交预测并对比'}).click();
  41  |   await expect(area.getByRole('status')).toContainText('这次预测符合结果');
  42  |   for (const id of ['bfs','astar'] as const) {
  43  |     await expect(area.getByTestId('playground-result-'+id).locator('dd')).toHaveText([String(result[id].metrics.pathLength),String(result[id].metrics.expandedCount),String(result[id].metrics.frontierPeak)]);
  44  |   }
  45  |   await expect(area.locator('[data-state="path"]')).toHaveCount(0);
  46  |   await area.getByRole('button',{name:'自由回放单步',exact:true}).click();
  47  |   await expect(area.getByTestId('playground-step')).toContainText('已选择 1 /');
  48  |   await area.getByRole('button',{name:'播放自由回放'}).click();
  49  |   await expect(area.getByTestId('playground-step')).not.toContainText('已选择 1 /');
  50  |   await area.getByRole('button',{name:'暂停自由回放'}).click();
  51  |   const paused = await area.getByTestId('playground-step').innerText();
  52  |   await page.waitForTimeout(450);
  53  |   await expect(area.getByTestId('playground-step')).toHaveText(paused);
  54  |   await area.getByLabel('自由地图回放算法').selectOption('astar');
  55  |   await expect(area.getByTestId('playground-step')).toContainText('已选择 0 /');
  56  |   await area.getByRole('button',{name:'自由回放单步',exact:true}).click();
  57  |   await area.getByRole('button',{name:'从头回放'}).click();
  58  |   await expect(area.getByTestId('playground-step')).toContainText('已选择 0 /');
  59  |   await area.locator('[data-play-cell="1,1"]').click();
  60  |   await expect(area.getByTestId('playground-results')).toHaveCount(0);
  61  |   await expect(area.getByLabel('扩展数量预测')).toHaveValue('');
  62  |   await expect(area.getByRole('button',{name:'提交预测并对比'})).toBeDisabled();
  63  | });
  64  | 
  65  | test('unreachable map has no fake path and presets are undoable', async ({ page }) => {
  66  |   await page.goto(appUrl);
  67  |   const area = scope(page);
  68  |   await area.getByRole('button',{name:'空白地图',exact:true}).click();
  69  |   await area.locator('[data-play-cell="1,0"]').click();
  70  |   await area.locator('[data-play-cell="0,1"]').click();
  71  |   await area.getByLabel('扩展数量预测').selectOption('astar');
  72  |   await area.getByRole('button',{name:'提交预测并对比'}).click();
  73  |   await expect(area.getByRole('status')).toContainText('这次预测与结果不同');
  74  |   await expect(area.getByRole('status')).toContainText('终点不可达');
  75  |   await expect(area.getByTestId('playground-result-bfs')).toContainText('不可达');
  76  |   await area.getByRole('button',{name:'自由回放单步',exact:true}).click();
  77  |   await expect(area.getByTestId('playground-step')).toContainText('回放完成');
  78  |   await expect(area.locator('[data-state="path"]')).toHaveCount(0);
  79  |   await area.getByRole('button',{name:'岔路探索',exact:true}).click();
  80  |   await area.getByRole('button',{name:'撤销编辑'}).click();
  81  |   await expect(area.locator('[data-play-cell="1,0"]')).toHaveAttribute('data-kind','wall');
  82  |   await expect(area.locator('[data-play-cell="0,1"]')).toHaveAttribute('data-kind','wall');
  83  | });
  84  | 
  85  | test('playground replay reaches exact path, retries and survives reduced motion access checks', async ({ page }) => {
  86  |   await page.goto(appUrl);
  87  |   const area = scope(page), result = comparePlayground(createPlayground('open'));
  88  |   await area.getByRole('button',{name:'空白地图',exact:true}).click();
  89  |   await area.getByLabel('扩展数量预测').selectOption('astar');
  90  |   await area.getByRole('button',{name:'提交预测并对比'}).click();
  91  |   await area.getByLabel('自由地图回放算法').selectOption('astar');
  92  |   await area.getByLabel('自由地图回放速度').selectOption('4');
  93  |   await area.getByRole('button',{name:'播放自由回放'}).click();
  94  |   await expect(area.getByTestId('playground-step')).toContainText('回放完成',{timeout:10000});
  95  |   const path = await area.locator('[data-state="path"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-play-cell')).sort());
  96  |   expect(path).toEqual(result.astar.path.map(p=>p.x+','+p.y).sort());
  97  |   await expect(area.getByRole('button',{name:'播放自由回放'})).toBeDisabled();
  98  |   await noOverflow(page);
  99  |   const axe = await new AxeBuilder({page}).include('#free-playground').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  100 |   expect(axe.violations).toEqual([]);
  101 |   await area.getByRole('button',{name:'重新预测'}).click();
  102 |   await expect(area.getByTestId('playground-results')).toHaveCount(0);
  103 |   await expect(area.locator('[data-kind="wall"]')).toHaveCount(0);
  104 | });
  105 | 
  106 | test('playground never saves practice into learning progress or generates network requests', async ({ page }) => {
  107 |   await page.goto(appUrl);
  108 |   await page.getByTestId('mission-L02').click();
  109 |   const saved = await page.evaluate(()=>localStorage.getItem('pathlab.progress.v1'));
  110 |   const external: string[] = [];
  111 |   page.on('request',request=>{const url=new URL(request.url()); if(url.protocol!=='file:' && url.hostname!=='127.0.0.1') external.push(request.url());});
```