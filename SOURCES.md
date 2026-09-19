# 数据来源与归属

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
