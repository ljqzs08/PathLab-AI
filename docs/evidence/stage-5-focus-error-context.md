# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reflection.spec.ts >> new reflection states keep keyboard focus within the viewport
- Location: tests\browser\reflection.spec.ts:106:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "跳到任务工作台" [ref=e2] [cursor=pointer]:
    - /url: "#mission-workspace"
  - banner [ref=e3]:
    - link "PathLab AI 首页" [ref=e4] [cursor=pointer]:
      - /url: "#top"
      - generic [ref=e10]:
        - text: PathLabAI
        - generic [ref=e11]: 路径学习实验室
    - navigation "页面导航" [ref=e12]:
      - link "任务工作台" [ref=e13] [cursor=pointer]:
        - /url: "#mission-workspace"
      - link "开发边界" [ref=e14] [cursor=pointer]:
        - /url: "#development-status"
  - main [ref=e15]:
    - region [ref=e16]:
      - generic [ref=e17]:
        - paragraph [ref=e18]:
          - generic [aria-hidden] [ref=e19]: ◇
          - text: THINK FIRST. TRACE NEXT.
        - heading "别急着找终点。 先解释下一步。" [level=1] [ref=e20]: 别急着找终点。先解释下一步。
        - paragraph [ref=e21]: 成为校园配送调度员，把“会背算法”变成“能解释选择”。 从一个固定任务开始，逐步建立可验证的推理。
        - link "选择一项任务" [ref=e22] [cursor=pointer]:
          - /url: "#mission-workspace"
          - text: 选择一项任务
          - generic [aria-hidden] [ref=e23]: ↗
      - generic "学习闭环：预测、回放、条件实验与证据报告已接入" [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: THE LEARNING LOOP
          - generic [ref=e27]: 本地学习闭环 · 已接入
        - list [ref=e28]:
          - listitem [ref=e29]:
            - generic [ref=e30]: "01"
            - generic [ref=e31]:
              - strong [ref=e32]: 先作预测
              - paragraph [ref=e33]: 下一次，算法会选择哪个节点？
            - generic [aria-hidden] [ref=e34]: "?"
          - listitem [ref=e35]:
            - generic [ref=e36]: "02"
            - generic [ref=e37]:
              - strong [ref=e38]: 用证据解释
              - paragraph [ref=e39]: 查看队列、代价与真实事件。
            - generic [aria-hidden] [ref=e40]: ≡
          - listitem [ref=e41]:
            - generic [ref=e42]: "03"
            - generic [ref=e43]:
              - strong [ref=e44]: 改变条件，再思考
              - paragraph [ref=e45]: 一条路封锁后，推理有何不同？
            - generic [aria-hidden] [ref=e46]: ↗
        - paragraph [ref=e47]: 先预测，再逐步揭示搜索证据。条件实验与复盘正在接入，不提前宣称学习完成。
    - region "任务工作台" [ref=e48]:
      - complementary [ref=e49]:
        - generic [ref=e50]:
          - heading "任务档案" [level=2] [ref=e51]
          - generic [ref=e52]: 4 个固定关卡
        - generic [ref=e53]:
          - button "MISSION 01 一层一层抵达 按 FIFO 队列顺序预测下一次出队节点 BFS 正在查看" [pressed] [ref=e54] [cursor=pointer]:
            - generic [ref=e55]:
              - generic [ref=e56]: MISSION 01
              - generic [aria-hidden] [ref=e57]: ↗
            - strong [ref=e58]: 一层一层抵达
            - generic [ref=e59]: 按 FIFO 队列顺序预测下一次出队节点
            - generic [ref=e60]:
              - generic [ref=e61]: BFS
              - generic [ref=e62]: 正在查看
          - button "MISSION 02 施工区绕行 比较相同地图的最少步数和唯一扩展节点数 BFS / A* 查看简报" [ref=e63] [cursor=pointer]:
            - generic [ref=e64]:
              - generic [ref=e65]: MISSION 02
              - generic [aria-hidden] [ref=e66]: →
            - strong [ref=e67]: 施工区绕行
            - generic [ref=e68]: 比较相同地图的最少步数和唯一扩展节点数
            - generic [ref=e69]:
              - generic [ref=e70]: BFS / A*
              - generic [ref=e71]: 查看简报
          - button "MISSION 03 封锁东门，重新规划 识别旧路径对新地图无效 A* 查看简报" [ref=e72] [cursor=pointer]:
            - generic [ref=e73]:
              - generic [ref=e74]: MISSION 03
              - generic [aria-hidden] [ref=e75]: →
            - strong [ref=e76]: 封锁东门，重新规划
            - generic [ref=e77]: 识别旧路径对新地图无效
            - generic [ref=e78]:
              - generic [ref=e79]: A*
              - generic [ref=e80]: 查看简报
          - button "MISSION 04 调度员复盘 区分累计代价、剩余估计与搜索节点数 BFS / A* 查看简报" [ref=e81] [cursor=pointer]:
            - generic [ref=e82]:
              - generic [ref=e83]: MISSION 04
              - generic [aria-hidden] [ref=e84]: →
            - strong [ref=e85]: 调度员复盘
            - generic [ref=e86]: 区分累计代价、剩余估计与搜索节点数
            - generic [ref=e87]:
              - generic [ref=e88]: BFS / A*
              - generic [ref=e89]: 查看简报
        - paragraph [ref=e90]: 地图固定，推理可复现。 记录在当前页面内保留，刷新会丢失。
      - generic [ref=e91]:
        - status [ref=e92]: 已选择 L01 一层一层抵达。搜索完成 · 待复盘。已选中 23 个节点。
        - generic [ref=e93]:
          - generic [ref=e94]:
            - paragraph [ref=e95]: 校园调度 / L01
            - heading "一层一层抵达" [level=2] [ref=e96]
          - generic [ref=e97]: 搜索完成 · 待复盘
        - paragraph [ref=e98]: 图书馆机器人向医务室配送物资；每一步代价相同。
        - generic [ref=e99]:
          - region [ref=e100]:
            - generic [ref=e101]:
              - heading "校园任务地图" [level=3] [ref=e102]
              - generic [ref=e103]: BFS · 修订 0
            - figure "S 起点 G 终点 − 障碍 ○ 前沿 × 已扩展 虚线：当前回溯前缀 实线：已揭示最终路径" [ref=e104]:
              - generic [ref=e105]:
                - generic [aria-hidden] [ref=e106]: N ↑ · 校园路网
                - group "一层一层抵达的地图，7列5行。起点坐标（0，2），终点坐标（6，2）。坐标从零开始；仅包含已揭示的搜索事实。" [ref=e107]:
                  - button "查看坐标 (0, 0)，可通行，已扩展" [ref=e108] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e109]: ×
                  - button "查看坐标 (1, 0)，可通行，已扩展" [ref=e110] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e111]: ×
                  - button "查看坐标 (2, 0)，可通行，已扩展" [ref=e112] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e113]: ×
                  - button "查看坐标 (3, 0)，可通行，已扩展" [ref=e114] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e115]: ×
                  - button "查看坐标 (4, 0)，可通行，已扩展" [ref=e116] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e117]: ×
                  - button "查看坐标 (5, 0)，可通行，有效前沿" [ref=e118] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e119]: ·
                  - button "查看坐标 (6, 0)，可通行，未发现" [ref=e120] [cursor=pointer]
                  - button "查看坐标 (0, 1)，可通行，已扩展" [ref=e121] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e122]: ×
                  - button "查看坐标 (1, 1)，可通行，已扩展" [ref=e123] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e124]: ×
                  - button "查看坐标 (2, 1)，障碍，未发现" [ref=e125] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e126]: −
                  - button "查看坐标 (3, 1)，可通行，已扩展" [ref=e127] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e128]: ×
                  - button "查看坐标 (4, 1)，障碍，未发现" [ref=e129] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e130]: −
                  - button "查看坐标 (5, 1)，可通行，已扩展" [ref=e131] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e132]: ×
                  - button "查看坐标 (6, 1)，可通行，有效前沿" [ref=e133] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e134]: ·
                  - button "查看坐标 (0, 2)，起点，已扩展" [ref=e135] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e136]: S
                  - button "查看坐标 (1, 2)，可通行，已扩展" [ref=e137] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e138]: ×
                  - button "查看坐标 (2, 2)，可通行，已扩展" [ref=e139] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e140]: ×
                  - button "查看坐标 (3, 2)，可通行，已扩展" [ref=e141] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e142]: ×
                  - button "查看坐标 (4, 2)，可通行，已扩展" [ref=e143] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e144]: ×
                  - button "查看坐标 (5, 2)，可通行，已扩展" [ref=e145] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e146]: ×
                  - button "查看坐标 (6, 2)，终点，当前选中" [ref=e147] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e148]: G
                  - button "查看坐标 (0, 3)，可通行，已扩展" [ref=e149] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e150]: ×
                  - button "查看坐标 (1, 3)，可通行，已扩展" [ref=e151] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e152]: ×
                  - button "查看坐标 (2, 3)，障碍，未发现" [ref=e153] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e154]: −
                  - button "查看坐标 (3, 3)，可通行，已扩展" [ref=e155] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e156]: ×
                  - button "查看坐标 (4, 3)，障碍，未发现" [ref=e157] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e158]: −
                  - button "查看坐标 (5, 3)，可通行，有效前沿" [ref=e159] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e160]: ·
                  - button "查看坐标 (6, 3)，可通行，未发现" [ref=e161] [cursor=pointer]
                  - button "查看坐标 (0, 4)，可通行，已扩展" [ref=e162] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e163]: ×
                  - button "查看坐标 (1, 4)，可通行，已扩展" [ref=e164] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e165]: ×
                  - button "查看坐标 (2, 4)，可通行，已扩展" [ref=e166] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e167]: ×
                  - button "查看坐标 (3, 4)，可通行，已扩展" [ref=e168] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e169]: ×
                  - button "查看坐标 (4, 4)，可通行，有效前沿" [ref=e170] [cursor=pointer]:
                    - generic [aria-hidden] [ref=e171]: ·
                  - button "查看坐标 (5, 4)，可通行，未发现" [ref=e172] [cursor=pointer]
                  - button "查看坐标 (6, 4)，可通行，未发现" [ref=e173] [cursor=pointer]
                - generic [aria-hidden] [ref=e174]: 地图修订 0 / 7 × 5
              - generic [ref=e175]:
                - generic [ref=e176]: S 起点
                - generic [ref=e178]: G 终点
                - generic [ref=e180]: − 障碍
                - generic [ref=e182]: ○ 前沿
                - generic [ref=e183]: × 已扩展
                - generic [ref=e184]: 虚线：当前回溯前缀
                - generic [ref=e185]: 实线：已揭示最终路径
            - generic [ref=e186]:
              - generic [ref=e187]:
                - text: S 起点
                - strong [ref=e188]: (0, 2)
              - generic [ref=e189]:
                - text: G 终点
                - strong [ref=e190]: (6, 2)
              - generic [ref=e191]: 坐标从 0 开始
            - paragraph [ref=e192]: 图中仅有已揭示的搜索事实。回溯前缀不代表已抵达终点。 地图可键盘操作：方向键查看相邻节点。
            - generic "由已揭示事件汇总的统计" [ref=e193]:
              - generic [ref=e194]:
                - term [ref=e195]: 已发现
                - definition [ref=e196]: "27"
              - generic [ref=e197]:
                - term [ref=e198]: 已扩展
                - definition [ref=e199]: "22"
              - generic [ref=e200]:
                - term [ref=e201]: 已选中
                - definition [ref=e202]: "23"
              - generic [ref=e203]:
                - term [ref=e204]: 最短路径步数
                - definition [ref=e205]: "6"
            - group "回放快捷键" [ref=e206]:
              - button "播放回放" [disabled] [ref=e207]
              - button "单步 →" [disabled] [ref=e208]
              - generic [ref=e209]:
                - text: 速度
                - combobox "回放速度" [disabled] [ref=e210]:
                  - option "0.5×"
                  - option "1×" [selected]
                  - option "2×"
                  - option "4×"
              - button "重置当前任务" [ref=e211] [cursor=pointer]
            - paragraph [ref=e212]: 聚焦回放快捷键区域：空格播放/暂停，右箭头单步。 单步=一次有效选中及邻居处理，不是动画帧。
            - group [ref=e213]:
              - generic "已揭示的最终路径" [ref=e214] [cursor=pointer]
            - generic [ref=e215]:
              - region [ref=e216]:
                - heading "节点检查器 点击或键盘选择地图节点" [level=4] [ref=e217]:
                  - text: 节点检查器
                  - generic [ref=e218]: 点击或键盘选择地图节点
                - paragraph [ref=e219]: 该节点尚无已揭示的代价或父节点。不会显示未来搜索结果。
              - group [ref=e220]:
                - generic "有效前沿 4 个节点 · 按实际处理顺序" [ref=e221] [cursor=pointer]:
                  - text: 有效前沿
                  - generic [ref=e222]: 4 个节点 · 按实际处理顺序
              - group [ref=e223]:
                - generic "事件时间线 211 条已揭示事件" [ref=e224] [cursor=pointer]:
                  - text: 事件时间线
                  - generic [ref=e225]: 211 条已揭示事件
          - region [ref=e226]:
            - paragraph [ref=e227]: YOUR REASONING
            - heading "这一关，要弄懂什么？" [level=3] [ref=e228]
            - list [ref=e229]:
              - listitem [ref=e230]:
                - generic [aria-hidden] [ref=e231]: "01"
                - paragraph [ref=e232]: 按 FIFO 队列顺序预测下一次出队节点
              - listitem [ref=e233]:
                - generic [aria-hidden] [ref=e234]: "02"
                - paragraph [ref=e235]: 区分搜索扩展与最终路径
            - generic [ref=e236]:
              - generic [ref=e237]: 本关算法
              - combobox "本关算法" [disabled] [ref=e238]:
                - option "BFS" [selected]
              - paragraph [ref=e239]: FIFO 先入先出；h=0 不参与选择。运行中冻结输入，结果来自本地确定性内核。
            - region [ref=e240]:
              - heading "这一步，符合规则。" [level=4] [ref=e241]
              - paragraph [ref=e242]: 你选择 (0, 3)；实际选择 (0, 3)。
              - paragraph [ref=e243]: 把两个候选的入队序号放回队列，按先入先出解释。
              - generic [ref=e244]: L01-P2 · 提示 0/3 · 首次作答
            - generic [ref=e245]:
              - paragraph [ref=e246]: SEARCH IS NOT THE WHOLE STORY
              - heading "路径已找到，解释才刚开始。" [level=4] [ref=e247]
              - paragraph [ref=e248]: 路径步数和搜索范围不是同一指标。已扩展 22 个节点，前沿峰值 5。
              - paragraph [ref=e249]: 继续到下方改变一次条件，再引用真实事件写解释。不以完成运行证明已经掌握。
            - paragraph [ref=e250]: 本任务已记录 1 次完整运行。首次预测符合规则 2/2；重跑不覆盖首次结果。
        - region [ref=e251]:
          - generic [ref=e252]:
            - generic [ref=e253]:
              - paragraph [ref=e254]: EXPLAIN WITH EVIDENCE
              - heading "搜索结束，不等于理解结束。" [active] [level=3] [ref=e255]
            - button "改变一次条件" [ref=e256] [cursor=pointer]
          - generic [ref=e257]:
            - region [ref=e258]:
              - generic [ref=e259]:
                - heading "本地证据反馈" [level=4] [ref=e260]
                - generic [ref=e261]: 规则模板 · 未调用模型
              - paragraph [ref=e262]: 本次 2 个预测符合选择规则；这不证明已经掌握，仍需条件实验和证据解释。
              - paragraph [ref=e263]: 原因标签：未判定 / 证据不足。
              - paragraph [ref=e264]: 请用入队序号说明下一次为什么先处理这个节点。改变条件后，路径步数和扩展数会一起增加吗？
              - group [ref=e265]:
                - generic "反馈引用的真实事件" [ref=e266] [cursor=pointer]
            - generic [ref=e267]:
              - paragraph [ref=e268]: THE NEXT QUESTION
              - heading "还缺一次条件实验。" [level=4] [ref=e269]
              - paragraph [ref=e270]: 仅完成当前搜索，还不能比较变化。选择“改变一次条件”，保留本次结果，并用新运行检验预期；不需要预测全对。
          - generic [ref=e271]:
            - group "1. 引用本次已揭示的事实" [ref=e272]:
              - paragraph [ref=e274]: 选择支持你解释的事件。条件复盘至少应引用条件变更和本次终止结果；上次结果可从对照表核对。
              - generic [ref=e275]:
                - generic [ref=e276] [cursor=pointer]:
                  - checkbox "预测点 L01-P1：选择 (0,1)，实际选中 (0,1)；本次符合选择规则。提示层级 0；重试次数 0。 run-ea57e36c-704e-45ea-81e3-ff90e1e5ed51:14" [ref=e277]
                  - generic [ref=e278]:
                    - text: 预测点 L01-P1：选择 (0,1)，实际选中 (0,1)；本次符合选择规则。提示层级 0；重试次数 0。
                    - generic [ref=e279]: run-ea57e36c-704e-45ea-81e3-ff90e1e5ed51:14
                - generic [ref=e280] [cursor=pointer]:
                  - checkbox "预测点 L01-P2：选择 (0,3)，实际选中 (0,3)；本次符合选择规则。提示层级 0；重试次数 0。 run-ea57e36c-704e-45ea-81e3-ff90e1e5ed51:35" [ref=e281]
                  - generic [ref=e282]:
                    - text: 预测点 L01-P2：选择 (0,3)，实际选中 (0,3)；本次符合选择规则。提示层级 0；重试次数 0。
                    - generic [ref=e283]: run-ea57e36c-704e-45ea-81e3-ff90e1e5ed51:35
                - generic [ref=e284] [cursor=pointer]:
                  - checkbox "本次搜索找到路径，最短步数 6；有效选择 23，扩展节点 22。步数和扩展数不是耗时。 run-ea57e36c-704e-45ea-81e3-ff90e1e5ed51:210" [ref=e285]
                  - generic [ref=e286]:
                    - text: 本次搜索找到路径，最短步数 6；有效选择 23，扩展节点 22。步数和扩展数不是耗时。
                    - generic [ref=e287]: run-ea57e36c-704e-45ea-81e3-ff90e1e5ed51:210
            - generic [ref=e288]: 2. 用自己的话解释
            - textbox "2. 用自己的话解释" [ref=e289]:
              - /placeholder: 改变了哪个条件？两次实际结果有什么差别？你的证据是什么？
            - paragraph [ref=e290]: 0/500 字 · 只保留本地纯文本，不自动判定解释正确，也不发送给模型。 尚未完成条件实验，生成的报告会明确标为部分记录。
            - generic [ref=e291]:
              - button "生成证据报告" [disabled] [ref=e292]
              - button "仅生成无解释的部分记录" [ref=e293] [cursor=pointer]
    - region [ref=e294]:
      - generic [ref=e295]:
        - paragraph [ref=e296]: BUILD IN THE OPEN
        - heading "完成到哪里，就展示到哪里。" [level=2] [ref=e297]
        - paragraph [ref=e298]: 默认本地运行，不需要账号、API Key 或远程服务。
      - list [ref=e299]:
        - listitem [ref=e300]:
          - generic [ref=e301]: 已就绪
          - generic [ref=e302]: 四关简报 / BFS 与 A* / 预测门控 / Canvas 回放
        - listitem [ref=e303]:
          - generic [ref=e304]: 已就绪
          - generic [ref=e305]: 条件实验 / 证据报告 / 本地规则反馈
        - listitem [ref=e306]:
          - generic [ref=e307]: 未连接
          - generic [ref=e308]: 远程 AI / 进度保存 / JSON 导入导出
  - contentinfo [ref=e309]:
    - generic [ref=e310]: PathLab AI / 让每一步，都有理由。
    - generic [ref=e311]: 阶段 5 · 条件实验与证据复盘
  - alert [ref=e312]
```

# Test source

```ts
  13  |     await expect(page.getByTestId('local-feedback')).toContainText('规则模板 · 未调用模型');
  14  |     await expect(page.getByTestId('condition-comparison')).toHaveCount(0);
  15  |     await expect(page.getByTestId('generate-report')).toBeDisabled();
  16  |     await page.getByTestId('open-condition').click();
  17  |     await expect(workbench(page)).toHaveAttribute('data-state', 'counterfactual');
  18  |     await page.getByTestId('apply-condition').click();
  19  |     await expect(workbench(page)).toHaveAttribute('data-state', 'briefing');
  20  |     await expect(page.getByLabel('本关算法')).toBeDisabled();
  21  |     await expect(page.getByTestId('first-attempt-stats')).toContainText('1 次完整运行');
  22  |     const input = changedInput(level), cell = level.counterfactual.cell;
  23  |     await expect(page.getByTestId('map-grid').locator('[data-cell="' + cell.x + ',' + cell.y + '"]')).toHaveAttribute('data-kind', level.counterfactual.type === 'block_cell' ? 'wall' : 'goal');
  24  |     await expect(page.getByTestId('path-length')).toHaveText('未揭示');
  25  |     await expect(page.locator('[data-event-type="run_finished"]')).toHaveCount(0);
  26  |     await page.getByRole('button', { name: '开始预测' }).click();
  27  |     await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
  28  |     await expect(page.getByTestId('step')).toBeDisabled();
  29  |     await expect(page.getByTestId('path-length')).toHaveText('未揭示');
  30  |     await finish(page, input, algorithm);
  31  |     const before = engine(level, algorithm), after = engine(input, algorithm);
  32  |     for (const [id, value] of [['comparison-before-path',before.metrics.pathLength],['comparison-after-path',after.metrics.pathLength],['comparison-before-expanded',before.metrics.expandedCount],['comparison-after-expanded',after.metrics.expandedCount]] as const) await expect(page.getByTestId(id)).toHaveText(String(value));
  33  |     await expect(page.getByTestId('first-attempt-stats')).toContainText('2 次完整运行');
  34  |     await expect(page.getByTestId('first-attempt-stats')).toContainText('4/4');
  35  |     const explanation = '合成测试解释：仅修改一个条件，路径步数与扩展节点数分别核对，不把扩展数当作耗时。';
  36  |     await page.locator('input[data-fact-type="counterfactual_applied"]').check();
  37  |     await page.locator('input[data-fact-type="run_finished"]').check();
  38  |     await page.getByLabel('2. 用自己的话解释').fill(explanation);
  39  |     await page.getByTestId('generate-report').click();
  40  |     await expect(workbench(page)).toHaveAttribute('data-state','report');
  41  |     await expect(page.getByTestId('reflection-report')).toContainText('复盘记录齐备');
  42  |     await expect(page.getByTestId('report-explanation')).toHaveText(explanation);
  43  |     await expect(page.getByTestId('reflection-report')).toContainText('不代表已掌握');
  44  |     await page.getByTestId('open-condition').click();
  45  |     await expect(page.getByTestId('apply-condition')).toBeDisabled();
  46  |     await page.getByRole('button',{name:'取消，返回复盘'}).click();
  47  |     await expect(workbench(page)).toHaveAttribute('data-state','reflection');
  48  |     await page.getByText('查看已生成的本次报告快照',{exact:true}).click();
  49  |     await expect(page.getByTestId('report-explanation')).toHaveText(explanation);
  50  |     await page.getByRole('button',{name:'重置当前任务'}).click();
  51  |     await expect(page.getByTestId('map-grid').locator('[data-cell="' + cell.x + ',' + cell.y + '"]')).toHaveAttribute('data-kind', level.grid.rows[cell.y]![cell.x] === '#' ? 'wall' : 'road');
  52  |     await expect(page.getByTestId('first-attempt-stats')).toContainText('4/4');
  53  |     const history = page.getByTestId('report-history');
  54  |     await history.locator('summary').click();
  55  |     await expect(history.getByTestId('historical-explanation')).toHaveText(explanation);
  56  |     await expect(history.getByTestId('historical-report')).toContainText('复盘记录齐备');
  57  |     await noOverflow(page); expect(errors).toEqual([]);
  58  |   });
  59  | }
  60  | 
  61  | test('changed briefing can reset without starting a forced extra run', async ({ page }) => {
  62  |   const level=levels[0]!; await launch(page,level,'bfs');await finish(page,level,'bfs');
  63  |   await page.getByTestId('open-condition').click();await page.getByTestId('apply-condition').click();
  64  |   await expect(page.getByRole('button',{name:'重置当前任务'})).toBeEnabled();
  65  |   await page.getByRole('button',{name:'重置当前任务'}).click();
  66  |   await expect(page.getByLabel('本关算法')).toBeEnabled();
  67  |   await expect(page.getByTestId('first-attempt-stats')).toContainText('1 次完整运行');
  68  |   await expect(page.getByTestId('first-attempt-stats')).toContainText('2/2');
  69  | });
  70  | 
  71  | test('partial report is honest, free text is inert, drafts survive experiment cancel and reports survive task switching', async ({ page }) => {
  72  |   const level=levels[1]!;await launch(page,level,'astar');await finish(page,level,'astar');
  73  |   const text='<script>window.reflectionScriptExecuted=true</script> 合成解释';
  74  |   const textarea=page.getByLabel('2. 用自己的话解释');
  75  |   await textarea.fill(text);await textarea.press('End');await textarea.press('Space');await textarea.press('ArrowLeft');
  76  |   await expect(textarea).toHaveValue(text+' ');await expect(workbench(page)).toHaveAttribute('data-state','reflection');
  77  |   await page.locator('input[data-fact-type="run_finished"]').check();
  78  |   await page.getByTestId('open-condition').click();await page.getByTestId('condition-panel').press('Escape');
  79  |   await expect(textarea).toHaveValue(text+' ');await expect(page.locator('input[data-fact-type="run_finished"]')).toBeChecked();
  80  |   await page.getByTestId('generate-report').click();
  81  |   await expect(page.getByTestId('reflection-report')).toContainText('部分记录 · 复盘未齐备');
  82  |   await expect(page.getByTestId('report-explanation')).toHaveText(text);
  83  |   expect(await page.evaluate(()=> 'reflectionScriptExecuted' in window)).toBe(false);
  84  |   await expect(page.getByTestId('local-feedback')).not.toContainText(text);
  85  |   await page.getByTestId('mission-L01').click();await page.getByTestId('mission-L02').click();
  86  |   await expect(workbench(page)).toHaveAttribute('data-state','report');await expect(page.getByTestId('report-explanation')).toHaveText(text);
  87  |   await page.reload();await expect(workbench(page)).toHaveAttribute('data-state','briefing');
  88  |   await expect(page.getByTestId('first-attempt-stats')).toContainText('0/0');
  89  | });
  90  | 
  91  | test('reflection condition and report pass automated WCAG checks without remote traffic or storage writes', async ({ page }) => {
  92  |   const external:string[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  93  |   await page.route('**/*',route=>{const origin=new URL(route.request().url()).origin;if(origin==='http://127.0.0.1:3210')return route.continue();external.push(origin);return route.abort();});
  94  |   await page.addInitScript(()=>{Storage.prototype.setItem=function(key){throw new Error('Unexpected storage write: '+key);};});
  95  |   const check=async()=>{const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations).toEqual([]);await noOverflow(page);};
  96  |   const level=levels[2]!;await launch(page,level,'astar');await finish(page,level,'astar');await check();
  97  |   await page.getByTestId('open-condition').click();await check();await page.getByTestId('apply-condition').click();
  98  |   await page.getByRole('button',{name:'开始预测'}).click();await finish(page,changedInput(level),'astar');await check();
  99  |   await page.getByTestId('partial-report').click();await check();
  100 |   await expect(page.getByTestId('reflection-report')).toContainText('部分记录');
  101 |   await expect(page.getByTestId('reflection-report')).toContainText('尚无证据解释');
  102 |   expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});expect(external).toEqual([]);expect(errors).toEqual([]);
  103 | });
  104 | 
  105 | 
  106 | test('new reflection states keep keyboard focus within the viewport', async ({ page }) => {
  107 |   const level = levels[0]!;
  108 |   const visibleFocus = async () => {
  109 |     await expect(page.locator('#reflection-title')).toBeFocused();
  110 |     await expect.poll(() => page.locator('#reflection-title').evaluate(element => {
  111 |       const rect = element.getBoundingClientRect();
  112 |       return rect.top >= 0 && rect.bottom <= innerHeight;
> 113 |     })).toBe(true);
      |         ^ Error: expect(received).toBe(expected) // Object.is equality
  114 |   };
  115 |   await launch(page, level, 'bfs'); await finish(page, level, 'bfs'); await visibleFocus();
  116 |   await page.getByTestId('open-condition').click(); await visibleFocus();
  117 |   await page.getByTestId('condition-panel').press('Escape'); await visibleFocus();
  118 |   await page.getByTestId('partial-report').click(); await visibleFocus();
  119 |   await noOverflow(page);
  120 | });
  121 | 
```