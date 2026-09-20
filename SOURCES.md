# 数据来源与归属

0.2.8：腐化之血采用已有 `db-mod-pairs.json` 中 [Bloodbarrier](https://poe2db.tw/tw/Bloodbarrier#explicitMod-3) 完整配对，修复英文显示换行处缺少空格，并补中文句间标点；两个参数保持独立。NINJA 行情首页说明、联盟状态标签与 Craft 固定提示为项目编辑译文。对无参数英文却包含中文参数占位符的条目，引擎拒绝匹配，避免未填参数显示到页面。

0.2.7 术语复核：`supplemental-pairs.json` 记录 [Invoker](https://poe2db.tw/tw/Invoker)、[Lineage Supports](https://poe2db.tw/tw/Lineage_Supports)、[Chaotic Surge](https://poe2db.tw/tw/Chaotic_Surge) 对照。Chaotic Infusion 使用现有 PoeCharm2 配对词缀中的历史译名“混沌灌注”，不因 [改名记录](https://poe2db.tw/us/Infusion) 而改写旧版原文。NINJA 的 Lineage Gems 按上述宝石类别适配；市集 Breach 依据 [裂痕](https://poe2db.tw/tw/Breach)；官网完整品牌依据 [商品 description_tw](https://poedb.tw/sp/Kiracs_Vault_Pass_%28Keepers%29) 的“基拉克的秘寶指南”。这些是来源对照，不宣称均为本项目取得的官方授权译文。

本项目原创代码与文档采用根目录 `LICENSE` 中的 MIT 许可证。该许可证不覆盖第三方译文、游戏数据及其生成物（包括 `extension/data.js`、`sources/`、`poe2-trade-tw/`），也不改变下列上游资料的授权条件。

1. 流亡编年史提供的 PoE2 市集插件词库：
   - https://poe2db.tw/tw/chinese
   - https://poe2db.tw/dls/poe2-trade-tw-0604v3.7z
   - 使用其 json/translate.json 与 json/translate.zh_TW.json 中的既有译文；本插件程序独立实现。
2. 编年史维护的 PoeCharm2：
   - https://poe2db.tw/tw/PoeCharm
   - https://github.com/Chuanhsing/PoeCharm2
   - 固定提交：86198db8ad707e000d19a4ba19a93720566747f0
   - Data/Translate/zh-rTW 下的物品、技能、词缀对照文件。
3. 编年史中英文条目页：https://poe2db.tw/us/ 与 https://poe2db.tw/tw/
   - 按条目链接配对物品名称；同一物品中对应类别的数值与修饰词配对。
   - 原始词库中的 source 字段保存具体条目 URL。
4. 经用户明确允许使用的官方市集数据：
   - https://www.pathofexile.com/api/trade2/data/items
   - https://www.pathofexile.com/api/trade2/data/stats
   - https://www.pathofexile.com/api/trade2/data/static
   - https://www.pathofexile.com/api/trade2/data/filters
   - 对应中文：https://pathofexile.tw/api/trade2/data/ （相同四个路径）
   - 仅使用相同 ID 配对标签；物品数据没有可靠 ID 的条目不会按数组位置猜配。

资料、游戏名称及图片等归各自作者和权利人所有。编年史页面注明 Wiki 内容采用 CC BY-NC-SA 3.0（另有注明除外）；不同下载项目保留其自身声明。此交付为个人本地使用版本，未上传应用商店，也未为上游资料重新声明授权。

构建保留来源和冲突记录。数据快照时间为 2026-09-19。没有使用人工自拟或机器生成的游戏译文。

## 0.2.0 网站界面词表

`extension/site-common.js` 与 `extension/site-*.js` 是本项目整理的普通界面中文译文，与有来源记录的游戏词库 `data.js` 分离。这些界面译文不是各网站的官方中文版本。游戏词条继续使用上述来源。

对应网站入口：
- https://poe.ninja/poe2/builds
- https://pobb.in/
- https://maxroll.gg/poe2
- https://mobalytics.gg/poe-2
- https://www.craftofexile.com/?game=poe2 （含 beta.craftofexile.com）
- https://www.pathofexile.com/

新增模块已通过 Edge 实际加载扩展的模拟页面集成测试，覆盖开关隔离、双语持久化、恢复英文、动态数值、保护表单与 SPA 路由。此测试不代表所有真实页面或攻略全文已验收；真实网站可能受到浏览器验证或页面结构变化影响。

0.2.1 新增 `sources/supplemental-pairs.json`：逐条记录 NINJA 页面缺失的职业、昇华和天赋名称及编年史中文条目 URL；`build-data.py` 构建时保留这些对照。界面组合标签仅由已有中文词条拼接，未生成新的游戏译名。

0.2.3：永恆印記完整效果句对照 PoE2DB 中英文 Eternal_Mark 页面，合并显示换行；Mobalytics 灰色辅助说明由本项目人工翻译，存于独立网站词表，并非官方译文。补充宝石属性数值标签匹配。

0.2.4：审校新增界面标签与动态模板仍属于项目编辑译文。`tools/build-data.py` 不再使用重复 `sep` ID 配对分类标题，而以紧邻的唯一物品 ID 对齐中英文快照，区分「預兆／增幅／魔偶」等类别。`supplemental-pairs.json` 记录狂怒球术语的来源提取，以及熔火噴濺固定 5% 词缀的来源实例；不会将来源固定数值推广为其他数值。

0.2.5：护符效果持续时间奖励使用现有官方快照 `desecrated.stat_1389754388` 对照，未新增猜测性游戏译名。论坛简介、折扣句尾、辅助标签及快捷键说明属于项目编辑译文；DOM 修复以第二轮实页记录的文本节点边界为依据。
