# 逐站翻译校对（2026-09-20）

本轮检查七个模块的词表与渲染逻辑，通过隔离浏览器采样公开页面，并为确认的问题补充模拟页面上的真实 MV3 扩展回归。公开采样不等同于逐页人工验收；不声称网站所有装备、攻略及弹窗已经全部校对。

新增 154 条站点界面词表键：NINJA 12、POBb.in 15、Maxroll 21、Mobalytics 41、Craft of Exile 45、官网 20。游戏词库 `data.js` 未新增无来源译文。

| 模块 | 校对依据 | 本轮修复 |
| --- | --- | --- |
| PoE2 市集 | manifest 注入规则、官方数据快照、API/DOM 集成测试；实时访问遇到验证页 | 补充不带尾斜线的 `/trade2` 入口注入，维持官网与市集开关隔离 |
| NINJA | `https://poe.ninja/poe2/builds` 实页 | 补齐可用/挑战/永久/私人联赛、各联盟热门职业、实况主、查看全部流派等标签 |
| POBb.in | 首页及公开 PoE2 构筑 `https://pobb.in/Jk5PC8sJXUxf` | 补齐 `Phys Max Hit`、`eHP`、`ES`、`Evade`、`Config` 等缩写；处理跨节点属性与数值 |
| Maxroll | `https://maxroll.gg/poe2` 浏览器实页 | 将误译成“主要”的 `Meta` 改为“主流玩法”；补齐入门、社区流派、工具、团队、近期更新、阅读时间等固定栏目 |
| Mobalytics | 可读取的公开首页、流派页及规划器页面；本机浏览器遇到验证页 | 补充指南中心、流派分类、排序筛选、草稿保存、导入、优先顺序与空状态标签；保留宝石与装备现有回归 |
| Craft of Exile | `https://www.craftofexile.com/?game=poe2` 与 `https://beta.craftofexile.com/?game=poe2` | 补充物品等级缩写、基底分类、主副手分组、新版导航、物品库、数据和操作说明标签 |
| 官网 | `https://www.pathofexile.com/` 实页 | 补齐影片、百科、论坛目录、行为准则、联赛榜、私人联盟、商城栏目、新闻归档和带句点的阅读按钮 |

## 共性修复

- 六个普通站点均支持非交互式容器内的跨节点整句匹配，不再仅限 NINJA/Mobalytics。
- 已知界面标签支持中英文冒号，以及由数值、百分比、数值范围组成的属性值；不根据任意前缀翻译攻略正文。
- 仅匹配词表自身属性，避免 `constructor` 等文本意外读到 JavaScript 对象原型而出现错误译文。
- 六站均可翻译有显式 `value` 的原生下拉选项；没有 `value` 的选项保持原文，避免改变提交值。
- 持续保留局部扫描、原文恢复与框架节点；按钮、链接、输入框不会被整句合并。

## 回归范围与边界

`tests/sites.test.cjs` 在每个普通站点上覆盖代表性译文、拆分词缀、动态数值、冒号、属性数值、原生下拉、双语和关闭恢复。另覆盖市集无尾斜线入口、SPA 路由、表单/作者保护及站点开关隔离。

Mobalytics 与国际服市集的真实动态页面仍需在可以通过站点验证的环境中验收。未使用个人账号或登录数据。未知游戏术语、作者攻略正文、构筑名称、玩家自建联盟名和图片/Canvas 文本仍可能保持英文；本轮未给这些内容编造游戏译名。

Mobalytics 固定文案核对来源：[首页](https://mobalytics.gg/poe-2)、[流派列表](https://mobalytics.gg/poe-2/builds)、[构筑规划器](https://mobalytics.gg/poe-2/planner/builds)。这些公开文本可读取，但不能据此推断已通过本站真实动态浏览器验收。

公开页面采样命令：设置 `TEST_BROWSER_CHANNEL=chromium` 后执行 `node tests/live-sites-check.cjs`。输出 `tests/live-sites-check.json`（不提交），记录 HTTP 状态、页面标题、阻挡状态与待校对文本。普通 CI 继续运行离线模拟站点测试，不依赖第三方站点的在线状态。
