# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: progress.spec.ts >> report history survives reset/refresh and JSON export can be previewed then deliberately reimported
- Location: tests\browser\progress.spec.ts:39:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 40

- Array []
+ Array [
+   Object {
+     "description": "Ensure that elements labelled through their content must have their visible text as part of their accessible name",
+     "help": "Elements must have their visible text as part of their accessible name",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=playwright",
+     "id": "label-content-name-mismatch",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<a class=\"brand\" href=\"#top\" aria-label=\"PathLab AI 首页\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".brand",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "wcag21a",
+       "wcag253",
+       "EN-301-549",
+       "EN-9.2.5.3",
+       "RGAAv4",
+       "RGAA-6.1.5",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - link "跳到任务工作台" [ref=f1e2] [cursor=pointer]:
    - /url: "#mission-workspace"
  - banner [ref=f1e3]:
    - link "PathLab AI 首页" [ref=f1e4] [cursor=pointer]:
      - /url: "#top"
      - generic [ref=f1e10]:
        - text: PathLabAI
        - generic [ref=f1e11]: 路径学习实验室
    - navigation "页面导航" [ref=f1e12]:
      - link "任务工作台" [ref=f1e13] [cursor=pointer]:
        - /url: "#mission-workspace"
      - link "开发边界" [ref=f1e14] [cursor=pointer]:
        - /url: "#development-status"
  - main [ref=f1e15]:
    - region [ref=f1e16]:
      - generic [ref=f1e17]:
        - paragraph [ref=f1e18]:
          - generic [aria-hidden] [ref=f1e19]: ◇
          - text: THINK FIRST. TRACE NEXT.
        - heading "别急着找终点。 先解释下一步。" [level=1] [ref=f1e20]: 别急着找终点。先解释下一步。
        - paragraph [ref=f1e21]: 成为校园配送调度员，把“会背算法”变成“能解释选择”。 从一个固定任务开始，逐步建立可验证的推理。
        - link "选择一项任务" [ref=f1e22] [cursor=pointer]:
          - /url: "#mission-workspace"
          - text: 选择一项任务
          - generic [aria-hidden] [ref=f1e23]: ↗
      - generic "学习闭环：预测、回放、条件实验与证据报告已接入" [ref=f1e24]:
        - generic [ref=f1e25]:
          - generic [ref=f1e26]: THE LEARNING LOOP
          - generic [ref=f1e27]: 本地学习闭环 · 已接入
        - list [ref=f1e28]:
          - listitem [ref=f1e29]:
            - generic [ref=f1e30]: "01"
            - generic [ref=f1e31]:
              - strong [ref=f1e32]: 先作预测
              - paragraph [ref=f1e33]: 下一次，算法会选择哪个节点？
            - generic [aria-hidden] [ref=f1e34]: "?"
          - listitem [ref=f1e35]:
            - generic [ref=f1e36]: "02"
            - generic [ref=f1e37]:
              - strong [ref=f1e38]: 用证据解释
              - paragraph [ref=f1e39]: 查看队列、代价与真实事件。
            - generic [aria-hidden] [ref=f1e40]: ≡
          - listitem [ref=f1e41]:
            - generic [ref=f1e42]: "03"
            - generic [ref=f1e43]:
              - strong [ref=f1e44]: 改变条件，再思考
              - paragraph [ref=f1e45]: 一条路封锁后，推理有何不同？
            - generic [aria-hidden] [ref=f1e46]: ↗
        - paragraph [ref=f1e47]: 先预测，再逐步揭示搜索证据。条件实验与证据复盘已接入，但完成记录不等于已经掌握。
    - region [ref=f1e48]:
      - generic [ref=f1e49]:
        - generic [ref=f1e50]:
          - paragraph [ref=f1e51]: YOUR PROGRESS, ON THIS DEVICE
          - heading "让推理，不因刷新中断。" [level=2] [ref=f1e52]
        - generic [ref=f1e53]: 本机已保存
      - status [ref=f1e54]: 已自动保存到此浏览器；建议另行导出 JSON 备份。
      - group [ref=f1e55]:
        - generic "备份、恢复与数据边界" [ref=f1e56] [cursor=pointer]
        - paragraph [ref=f1e57]: 进度、已提交的预测与报告解释只保存到此浏览器，不上传云端、不调用模型。未提交的候选选择、实验选项和解释草稿不保存；恢复不会自动播放。浏览器清理数据会删除存档，请另存 JSON。
        - generic [ref=f1e58]:
          - button "导出当前进度 JSON" [ref=f1e59] [cursor=pointer]
          - generic [ref=f1e60]:
            - text: 选择 JSON 存档
            - button "选择 JSON 存档" [ref=f1e61]
        - generic [ref=f1e62]:
          - heading "校验通过，尚未导入" [active] [level=3] [ref=f1e63]
          - paragraph [ref=f1e64]: 保存时间 2026-10-17T04:12:38.663Z；当前任务 L01；完整运行 1 次；报告 1 份。
          - paragraph [ref=f1e65]: 导入会替换当前内存进度。确认后会尝试保存到本机。建议先导出当前进度。
          - generic [ref=f1e66]:
            - button "确认导入，替换当前进度" [ref=f1e67] [cursor=pointer]
            - button "取消，保留现状" [ref=f1e68] [cursor=pointer]
    - region "任务工作台" [ref=f1e69]:
      - complementary [ref=f1e70]:
        - generic [ref=f1e71]:
          - heading "任务档案" [level=2] [ref=f1e72]
          - generic [ref=f1e73]: 4 个固定关卡
        - generic [ref=f1e74]:
          - button "MISSION 01 一层一层抵达 按 FIFO 队列顺序预测下一次出队节点 BFS 查看简报" [ref=f1e75] [cursor=pointer]:
            - generic [ref=f1e76]:
              - generic [ref=f1e77]: MISSION 01
              - generic [aria-hidden] [ref=f1e78]: →
            - strong [ref=f1e79]: 一层一层抵达
            - generic [ref=f1e80]: 按 FIFO 队列顺序预测下一次出队节点
            - generic [ref=f1e81]:
              - generic [ref=f1e82]: BFS
              - generic [ref=f1e83]: 查看简报
          - button "MISSION 02 施工区绕行 比较相同地图的最少步数和唯一扩展节点数 BFS / A* 正在查看" [pressed] [ref=f1e84] [cursor=pointer]:
            - generic [ref=f1e85]:
              - generic [ref=f1e86]: MISSION 02
              - generic [aria-hidden] [ref=f1e87]: ↗
            - strong [ref=f1e88]: 施工区绕行
            - generic [ref=f1e89]: 比较相同地图的最少步数和唯一扩展节点数
            - generic [ref=f1e90]:
              - generic [ref=f1e91]: BFS / A*
              - generic [ref=f1e92]: 正在查看
          - button "MISSION 03 封锁东门，重新规划 识别旧路径对新地图无效 A* 查看简报" [ref=f1e93] [cursor=pointer]:
            - generic [ref=f1e94]:
              - generic [ref=f1e95]: MISSION 03
              - generic [aria-hidden] [ref=f1e96]: →
            - strong [ref=f1e97]: 封锁东门，重新规划
            - generic [ref=f1e98]: 识别旧路径对新地图无效
            - generic [ref=f1e99]:
              - generic [ref=f1e100]: A*
              - generic [ref=f1e101]: 查看简报
          - button "MISSION 04 调度员复盘 区分累计代价、剩余估计与搜索节点数 BFS / A* 查看简报" [ref=f1e102] [cursor=pointer]:
            - generic [ref=f1e103]:
              - generic [ref=f1e104]: MISSION 04
              - generic [aria-hidden] [ref=f1e105]: →
            - strong [ref=f1e106]: 调度员复盘
            - generic [ref=f1e107]: 区分累计代价、剩余估计与搜索节点数
            - generic [ref=f1e108]:
              - generic [ref=f1e109]: BFS / A*
              - generic [ref=f1e110]: 查看简报
        - paragraph [ref=f1e111]: 地图固定，推理可复现。 进度仅存在本机，请留意存档状态并导出备份。
      - generic [ref=f1e112]:
        - status [ref=f1e113]: 已选择 L02 施工区绕行。任务简报。已选中 0 个节点。
        - generic [ref=f1e114]:
          - generic [ref=f1e115]:
            - paragraph [ref=f1e116]: 校园调度 / L02
            - heading "施工区绕行" [level=2] [ref=f1e117]
          - generic [ref=f1e118]: 任务简报
        - paragraph [ref=f1e119]: 施工围挡阻断直线道路；比较 BFS 与 A* 的搜索过程。
        - generic [ref=f1e120]:
          - region [ref=f1e121]:
            - generic [ref=f1e122]:
              - heading "校园任务地图" [level=3] [ref=f1e123]
              - generic [ref=f1e124]: 尚未运行
            - figure "S 起点 G 终点 − 障碍 ○ 前沿 × 已扩展 虚线：当前回溯前缀 实线：已揭示最终路径" [ref=f1e125]:
              - generic [ref=f1e126]:
                - generic [aria-hidden] [ref=f1e127]: N ↑ · 校园路网
                - group "施工区绕行的地图，9列7行。起点坐标（1，1），终点坐标（7，1）。坐标从零开始；仅包含已揭示的搜索事实。" [ref=f1e128]:
                  - button "查看坐标 (0, 0)，可通行，未发现" [ref=f1e129] [cursor=pointer]
                  - button "查看坐标 (1, 0)，可通行，未发现" [ref=f1e130] [cursor=pointer]
                  - button "查看坐标 (2, 0)，可通行，未发现" [ref=f1e131] [cursor=pointer]
                  - button "查看坐标 (3, 0)，可通行，未发现" [ref=f1e132] [cursor=pointer]
                  - button "查看坐标 (4, 0)，障碍，未发现" [ref=f1e133] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e134]: −
                  - button "查看坐标 (5, 0)，可通行，未发现" [ref=f1e135] [cursor=pointer]
                  - button "查看坐标 (6, 0)，可通行，未发现" [ref=f1e136] [cursor=pointer]
                  - button "查看坐标 (7, 0)，可通行，未发现" [ref=f1e137] [cursor=pointer]
                  - button "查看坐标 (8, 0)，可通行，未发现" [ref=f1e138] [cursor=pointer]
                  - button "查看坐标 (0, 1)，可通行，未发现" [ref=f1e139] [cursor=pointer]
                  - button "查看坐标 (1, 1)，起点，未发现" [ref=f1e140] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e141]: S
                  - button "查看坐标 (2, 1)，可通行，未发现" [ref=f1e142] [cursor=pointer]
                  - button "查看坐标 (3, 1)，可通行，未发现" [ref=f1e143] [cursor=pointer]
                  - button "查看坐标 (4, 1)，障碍，未发现" [ref=f1e144] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e145]: −
                  - button "查看坐标 (5, 1)，可通行，未发现" [ref=f1e146] [cursor=pointer]
                  - button "查看坐标 (6, 1)，可通行，未发现" [ref=f1e147] [cursor=pointer]
                  - button "查看坐标 (7, 1)，终点，未发现" [ref=f1e148] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e149]: G
                  - button "查看坐标 (8, 1)，可通行，未发现" [ref=f1e150] [cursor=pointer]
                  - button "查看坐标 (0, 2)，可通行，未发现" [ref=f1e151] [cursor=pointer]
                  - button "查看坐标 (1, 2)，可通行，未发现" [ref=f1e152] [cursor=pointer]
                  - button "查看坐标 (2, 2)，可通行，未发现" [ref=f1e153] [cursor=pointer]
                  - button "查看坐标 (3, 2)，可通行，未发现" [ref=f1e154] [cursor=pointer]
                  - button "查看坐标 (4, 2)，障碍，未发现" [ref=f1e155] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e156]: −
                  - button "查看坐标 (5, 2)，可通行，未发现" [ref=f1e157] [cursor=pointer]
                  - button "查看坐标 (6, 2)，可通行，未发现" [ref=f1e158] [cursor=pointer]
                  - button "查看坐标 (7, 2)，可通行，未发现" [ref=f1e159] [cursor=pointer]
                  - button "查看坐标 (8, 2)，可通行，未发现" [ref=f1e160] [cursor=pointer]
                  - button "查看坐标 (0, 3)，可通行，未发现" [ref=f1e161] [cursor=pointer]
                  - button "查看坐标 (1, 3)，可通行，未发现" [ref=f1e162] [cursor=pointer]
                  - button "查看坐标 (2, 3)，可通行，未发现" [ref=f1e163] [cursor=pointer]
                  - button "查看坐标 (3, 3)，可通行，未发现" [ref=f1e164] [cursor=pointer]
                  - button "查看坐标 (4, 3)，障碍，未发现" [ref=f1e165] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e166]: −
                  - button "查看坐标 (5, 3)，可通行，未发现" [ref=f1e167] [cursor=pointer]
                  - button "查看坐标 (6, 3)，可通行，未发现" [ref=f1e168] [cursor=pointer]
                  - button "查看坐标 (7, 3)，可通行，未发现" [ref=f1e169] [cursor=pointer]
                  - button "查看坐标 (8, 3)，可通行，未发现" [ref=f1e170] [cursor=pointer]
                  - button "查看坐标 (0, 4)，可通行，未发现" [ref=f1e171] [cursor=pointer]
                  - button "查看坐标 (1, 4)，可通行，未发现" [ref=f1e172] [cursor=pointer]
                  - button "查看坐标 (2, 4)，可通行，未发现" [ref=f1e173] [cursor=pointer]
                  - button "查看坐标 (3, 4)，可通行，未发现" [ref=f1e174] [cursor=pointer]
                  - button "查看坐标 (4, 4)，障碍，未发现" [ref=f1e175] [cursor=pointer]:
                    - generic [aria-hidden] [ref=f1e176]: −
                  - button "查看坐标 (5, 4)，可通行，未发现" [ref=f1e177] [cursor=pointer]
                  - button "查看坐标 (6, 4)，可通行，未发现" [ref=f1e178] [cursor=pointer]
                  - button "查看坐标 (7, 4)，可通行，未发现" [ref=f1e179] [cursor=pointer]
                  - button "查看坐标 (8, 4)，可通行，未发现" [ref=f1e180] [cursor=pointer]
                  - button "查看坐标 (0, 5)，可通行，未发现" [ref=f1e181] [cursor=pointer]
                  - button "查看坐标 (1, 5)，可通行，未发现" [ref=f1e182] [cursor=pointer]
                  - button "查看坐标 (2, 5)，可通行，未发现" [ref=f1e183] [cursor=pointer]
                  - button "查看坐标 (3, 5)，可通行，未发现" [ref=f1e184] [cursor=pointer]
                  - button "查看坐标 (4, 5)，可通行，未发现" [ref=f1e185] [cursor=pointer]
                  - button "查看坐标 (5, 5)，可通行，未发现" [ref=f1e186] [cursor=pointer]
                  - button "查看坐标 (6, 5)，可通行，未发现" [ref=f1e187] [cursor=pointer]
                  - button "查看坐标 (7, 5)，可通行，未发现" [ref=f1e188] [cursor=pointer]
                  - button "查看坐标 (8, 5)，可通行，未发现" [ref=f1e189] [cursor=pointer]
                  - button "查看坐标 (0, 6)，可通行，未发现" [ref=f1e190] [cursor=pointer]
                  - button "查看坐标 (1, 6)，可通行，未发现" [ref=f1e191] [cursor=pointer]
                  - button "查看坐标 (2, 6)，可通行，未发现" [ref=f1e192] [cursor=pointer]
                  - button "查看坐标 (3, 6)，可通行，未发现" [ref=f1e193] [cursor=pointer]
                  - button "查看坐标 (4, 6)，可通行，未发现" [ref=f1e194] [cursor=pointer]
                  - button "查看坐标 (5, 6)，可通行，未发现" [ref=f1e195] [cursor=pointer]
                  - button "查看坐标 (6, 6)，可通行，未发现" [ref=f1e196] [cursor=pointer]
                  - button "查看坐标 (7, 6)，可通行，未发现" [ref=f1e197] [cursor=pointer]
                  - button "查看坐标 (8, 6)，可通行，未发现" [ref=f1e198] [cursor=pointer]
                - generic [aria-hidden] [ref=f1e199]: 地图修订 0 / 9 × 7
              - generic [ref=f1e200]:
                - generic [ref=f1e201]: S 起点
                - generic [ref=f1e203]: G 终点
                - generic [ref=f1e205]: − 障碍
                - generic [ref=f1e207]: ○ 前沿
                - generic [ref=f1e208]: × 已扩展
                - generic [ref=f1e209]: 虚线：当前回溯前缀
                - generic [ref=f1e210]: 实线：已揭示最终路径
            - generic [ref=f1e211]:
              - generic [ref=f1e212]:
                - text: S 起点
                - strong [ref=f1e213]: (1, 1)
              - generic [ref=f1e214]:
                - text: G 终点
                - strong [ref=f1e215]: (7, 1)
              - generic [ref=f1e216]: 坐标从 0 开始
            - paragraph [ref=f1e217]: 尚未运行；选择算法后先预测，再查看搜索证据。 地图可键盘操作：方向键查看相邻节点。
            - generic "由已揭示事件汇总的统计" [ref=f1e218]:
              - generic [ref=f1e219]:
                - term [ref=f1e220]: 已发现
                - definition [ref=f1e221]: "0"
              - generic [ref=f1e222]:
                - term [ref=f1e223]: 已扩展
                - definition [ref=f1e224]: "0"
              - generic [ref=f1e225]:
                - term [ref=f1e226]: 已选中
                - definition [ref=f1e227]: "0"
              - generic [ref=f1e228]:
                - term [ref=f1e229]: 最短路径步数
                - definition [ref=f1e230]: 未揭示
            - group "回放快捷键" [ref=f1e231]:
              - button "播放回放" [disabled] [ref=f1e232]
              - button "单步 →" [disabled] [ref=f1e233]
              - generic [ref=f1e234]:
                - text: 速度
                - combobox "回放速度" [disabled] [ref=f1e235]:
                  - option "0.5×"
                  - option "1×" [selected]
                  - option "2×"
                  - option "4×"
              - button "重置当前任务" [disabled] [ref=f1e236]
            - paragraph [ref=f1e237]: 聚焦回放快捷键区域：空格播放/暂停，右箭头单步。 单步=一次有效选中及邻居处理，不是动画帧。
            - generic [ref=f1e238]:
              - region [ref=f1e239]:
                - heading "节点检查器 点击或键盘选择地图节点" [level=4] [ref=f1e240]:
                  - text: 节点检查器
                  - generic [ref=f1e241]: 点击或键盘选择地图节点
                - paragraph [ref=f1e242]: 该节点尚无已揭示的代价或父节点。不会显示未来搜索结果。
              - group [ref=f1e243]:
                - generic "有效前沿 0 个节点 · 按实际处理顺序" [ref=f1e244] [cursor=pointer]:
                  - text: 有效前沿
                  - generic [ref=f1e245]: 0 个节点 · 按实际处理顺序
              - group [ref=f1e246]:
                - generic "事件时间线 0 条已揭示事件" [ref=f1e247] [cursor=pointer]:
                  - text: 事件时间线
                  - generic [ref=f1e248]: 0 条已揭示事件
          - region [ref=f1e249]:
            - paragraph [ref=f1e250]: YOUR REASONING
            - heading "这一关，要弄懂什么？" [level=3] [ref=f1e251]
            - list [ref=f1e252]:
              - listitem [ref=f1e253]:
                - generic [aria-hidden] [ref=f1e254]: "01"
                - paragraph [ref=f1e255]: 比较相同地图的最少步数和唯一扩展节点数
              - listitem [ref=f1e256]:
                - generic [aria-hidden] [ref=f1e257]: "02"
                - paragraph [ref=f1e258]: 解释 A* 的 f、h、sequence 排序
            - generic [ref=f1e259]:
              - generic [ref=f1e260]: 本关算法
              - combobox "本关算法" [ref=f1e261]:
                - option "BFS" [selected]
                - option "A*"
              - paragraph [ref=f1e262]: FIFO 先入先出；h=0 不参与选择。运行中冻结输入，结果来自本地确定性内核。
            - generic [ref=f1e263]:
              - generic [ref=f1e264]: 预测 → 事件 → 解释
              - paragraph [ref=f1e265]: 先读任务，再作判断。提交前不会揭示实际答案。
              - button "开始预测" [ref=f1e266] [cursor=pointer]:
                - text: 开始预测
                - generic [aria-hidden] [ref=f1e267]: →
              - generic [ref=f1e268]: 操作后尝试保存到本机；请以上方存档状态为准。无远程 AI 调用。
            - paragraph [ref=f1e269]: 本任务已记录 0 次完整运行。首次预测符合规则 0/0；重跑不覆盖首次结果。
    - region [ref=f1e270]:
      - generic [ref=f1e271]:
        - paragraph [ref=f1e272]: BUILD IN THE OPEN
        - heading "完成到哪里，就展示到哪里。" [level=2] [ref=f1e273]
        - paragraph [ref=f1e274]: 默认本地运行，不需要账号、API Key 或远程服务。
      - list [ref=f1e275]:
        - listitem [ref=f1e276]:
          - generic [ref=f1e277]: 已就绪
          - generic [ref=f1e278]: 四关简报 / BFS 与 A* / 预测门控 / Canvas 回放
        - listitem [ref=f1e279]:
          - generic [ref=f1e280]: 已就绪
          - generic [ref=f1e281]: 条件实验 / 证据报告 / 本地规则反馈 / 本机存档 / JSON 备份
        - listitem [ref=f1e282]:
          - generic [ref=f1e283]: 未连接
          - generic [ref=f1e284]: 远程 AI / 自由地图编辑
  - contentinfo [ref=f1e285]:
    - generic [ref=f1e286]: PathLab AI / 让每一步，都有理由。
    - generic [ref=f1e287]: 阶段 6 · 本机进度与安全恢复
  - alert [ref=f1e288]
```

# Test source

```ts
  1  | /** AI-executed browser checks; imported text is synthetic and is not human evidence. */
  2  | import { test, expect, type Page, type Download } from '@playwright/test';
  3  | import AxeBuilder from '@axe-core/playwright';
  4  | import fixtures from '../../fixtures/levels.json' with { type: 'json' };
  5  | import type { LevelDefinition } from '../../contracts/types';
  6  | import { PROGRESS_KEY } from '../../src/domain/learning/progress-store';
  7  | import { launch, answer, finish, noOverflow, workbench } from './helpers';
  8  | const levels = fixtures as LevelDefinition[];
  9  | const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key)!, PROGRESS_KEY);
  10 | const openTools = (page: Page) => page.getByTestId('progress-panel').locator('summary').click();
  11 | async function upload(page: Page, text: string, name = 'test.json') { await page.getByLabel('选择 JSON 存档').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) }); }
  12 | async function downloaded(download: Download): Promise<string> { const stream = await download.createReadStream(); if (!stream) throw new Error('missing download'); const chunks: Buffer[] = []; for await (const part of stream) chunks.push(Buffer.from(part)); return Buffer.concat(chunks).toString('utf8'); }
  13 | for (const level of levels) for (const algorithm of level.algorithms) {
  14 |   test(level.id + ' ' + algorithm + ' refresh preserves the unanswered gate, hint and first result without a future answer', async ({ page }) => {
  15 |     await launch(page, level, algorithm); await page.getByRole('button', { name: '规则提示 0/3' }).click();
  16 |     const selected = await page.getByTestId('selection-count').innerText(), candidates = await page.locator('[data-testid^="candidate-"]').allTextContents();
  17 |     await expect(page.getByTestId('save-status')).toContainText('已自动保存'); const saved = JSON.parse(await raw(page));
  18 |     expect(saved.sessions.find((s: {levelId: string}) => s.levelId === level.id)).not.toHaveProperty('trace');
  19 |     await page.reload(); await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
  20 |     await expect(page.getByLabel('本关算法')).toHaveValue(algorithm); await expect(page.getByTestId('selection-count')).toHaveText(selected);
  21 |     expect(await page.locator('[data-testid^="candidate-"]').allTextContents()).toEqual(candidates);
  22 |     await expect(page.getByRole('button', { name: '规则提示 1/3' })).toBeVisible(); await expect(page.getByTestId('prediction-feedback')).toHaveCount(0);
  23 |     await expect(page.getByTestId('submit-prediction')).toBeDisabled(); await expect(page.getByTestId('step')).toBeDisabled();
  24 |     await answer(page, level, algorithm, true); await expect(page.getByTestId('first-attempt-stats')).toContainText('0/1');
  25 |     await page.reload(); await expect(page.getByTestId('first-attempt-stats')).toContainText('0/1'); await noOverflow(page);
  26 |   });
  27 | }
  28 | 
  29 | test('running checkpoint restores paused at the same revealed prefix, including playback speed', async ({ page }) => {
  30 |   await launch(page, levels[0]!, 'bfs'); await answer(page, levels[0]!, 'bfs');
  31 |   const selected = await page.getByTestId('selection-count').innerText(), saved = JSON.parse(await raw(page));
  32 |   saved.sessions[0].commands.push({ kind: 'action', action: { type: 'play', speed: 2 }, at: new Date().toISOString() });
  33 |   await page.evaluate(({key, value}) => localStorage.setItem(key, value), {key:PROGRESS_KEY, value:JSON.stringify(saved)});
  34 |   await page.reload(); await expect(workbench(page)).toHaveAttribute('data-state', 'paused');
  35 |   await expect(page.getByLabel('播放速度')).toHaveValue('2'); await page.waitForTimeout(1100);
  36 |   await expect(page.getByTestId('selection-count')).toHaveText(selected); await expect(workbench(page)).toHaveAttribute('data-state', 'paused');
  37 | });
  38 | 
  39 | test('report history survives reset/refresh and JSON export can be previewed then deliberately reimported', async ({ page }) => {
  40 |   await launch(page, levels[0]!, 'bfs'); await finish(page, levels[0]!, 'bfs');
  41 |   await page.locator('input[data-fact-type="run_finished"]').check(); await page.getByLabel('2. 用自己的话解释').fill('合成恢复检查：报告解释保存为纯文本。');
  42 |   await page.getByTestId('generate-report').click(); await page.getByRole('button', {name:'重置当前任务'}).click(); await page.reload();
  43 |   await page.getByTestId('report-history').locator('summary').click(); await expect(page.getByTestId('historical-explanation')).toHaveText('合成恢复检查：报告解释保存为纯文本。');
  44 |   await openTools(page); const downloadEvent=page.waitForEvent('download'); await page.getByTestId('export-progress').click(); const exported=await downloaded(await downloadEvent);
  45 |   expect(JSON.parse(exported).schemaVersion).toBe(1); await page.getByTestId('mission-L02').click(); await upload(page, exported);
  46 |   await expect(page.getByTestId('progress-preview')).toContainText('校验通过，尚未导入'); await expect(page.getByTestId('mission-title')).toHaveText(levels[1]!.title);
> 47 |   expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]); await noOverflow(page);
     |                                                               ^ Error: expect(received).toEqual(expected) // deep equality
  48 |   await page.getByTestId('confirm-progress').click(); await expect(page.getByTestId('mission-title')).toHaveText(levels[0]!.title);
  49 |   await page.reload(); await page.getByTestId('report-history').locator('summary').click(); await expect(page.getByTestId('historical-explanation')).toHaveText('合成恢复检查：报告解释保存为纯文本。');
  50 | });
  51 | 
  52 | test('invalid/oversized/versioned/forged imports leave current memory and browser save unchanged', async ({page}) => {
  53 |   await launch(page,levels[0]!,'bfs'); await openTools(page); const before=await raw(page), version=JSON.parse(before), forged=JSON.parse(before);
  54 |   version.schemaVersion=999; forged.sessions[0].commands.push({kind:'action',at:new Date().toISOString(),action:{type:'step'}});
  55 |   for (const bad of ['{broken', ' '.repeat(1024*1024+1), JSON.stringify(version), JSON.stringify(forged), '<script>window.__pathlabBad=true</script>']) {
  56 |     await upload(page,bad); await expect(page.getByTestId('progress-error')).toBeVisible(); await expect(page.getByTestId('progress-preview')).toHaveCount(0);
  57 |     expect(await raw(page)).toBe(before); await expect(workbench(page)).toHaveAttribute('data-state','prediction');
  58 |   }
  59 |   expect(await page.evaluate(()=>Object.hasOwn(window,'__pathlabBad'))).toBe(false); await noOverflow(page);
  60 | });
  61 | 
  62 | test('corrupt browser save is retained and can be backed up before explicit replacement; cancellation changes nothing', async ({page}) => {
  63 |   await page.addInitScript(key=>{localStorage.setItem(key,'{original-corrupt');localStorage.setItem('unrelated','keep');},PROGRESS_KEY);
  64 |   await page.goto('/'); await expect(page.getByTestId('save-status')).toContainText('原始数据已保留');
  65 |   await page.getByTestId('mission-L02').click(); expect(await raw(page)).toBe('{original-corrupt'); await openTools(page);
  66 |   const downloadEvent=page.waitForEvent('download'); await page.getByRole('button',{name:'下载浏览器原始存档'}).click(); expect(await downloaded(await downloadEvent)).toBe('{original-corrupt');
  67 |   await page.getByRole('button',{name:'用当前进度覆盖存档'}).click(); await page.getByRole('button',{name:'取消，保留现状'}).click(); expect(await raw(page)).toBe('{original-corrupt');
  68 |   await page.getByRole('button',{name:'用当前进度覆盖存档'}).click(); await page.getByTestId('confirm-progress').click();
  69 |   expect(JSON.parse(await raw(page)).selectedId).toBe('L02'); expect(await page.evaluate(()=>localStorage.getItem('unrelated'))).toBe('keep');
  70 |   await expect(page.getByTestId('save-status')).toContainText('已自动保存'); await noOverflow(page);
  71 | });
  72 | 
  73 | test('disabled storage remains usable in memory and gives a backup warning instead of success', async ({page}) => {
  74 |   await page.addInitScript(key=>{const original=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k===key)throw new DOMException('blocked','SecurityError');return original.call(this,k);};},PROGRESS_KEY);
  75 |   await launch(page,levels[0]!,'bfs'); await expect(workbench(page)).toHaveAttribute('data-state','prediction'); await expect(page.getByTestId('save-status')).toContainText('存储不可用');
  76 |   await page.getByRole('button',{name:'规则提示 0/3'}).click(); await expect(page.getByRole('button',{name:'规则提示 1/3'})).toBeVisible();
  77 | });
  78 | 
  79 | test('quota failure retains core interactions and the old browser value', async ({page}) => {
  80 |   await page.addInitScript(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('full','QuotaExceededError');return original.call(this,k,v);};},PROGRESS_KEY);
  81 |   await launch(page,levels[0]!,'bfs'); await expect(page.getByTestId('save-status')).toContainText('保存失败'); await expect(workbench(page)).toHaveAttribute('data-state','prediction');
  82 |   expect(await raw(page)).toBeNull(); await answer(page,levels[0]!,'bfs'); await expect(page.getByTestId('prediction-feedback')).toBeVisible();
  83 | });
  84 | 
  85 | test('a second tab cannot be silently overwritten and reloading its version requires confirmation', async ({page,context}) => {
  86 |   await page.goto('/'); await page.getByTestId('mission-L02').click(); const second=await context.newPage(); await second.goto('/'); await second.getByTestId('mission-L03').click();
  87 |   const other=await raw(second); await page.getByTestId('mission-L04').click(); await expect(page.getByTestId('save-status')).toContainText('其他页面修改'); expect(await raw(page)).toBe(other);
  88 |   await openTools(page); await page.getByRole('button',{name:'重新读取浏览器存档'}).click(); await expect(page.getByTestId('mission-title')).toHaveText(levels[3]!.title);
  89 |   await page.getByTestId('confirm-progress').click(); await expect(page.getByTestId('mission-title')).toHaveText(levels[2]!.title); expect(await raw(page)).toBe(other); await second.close();
  90 | });
  91 | 
```