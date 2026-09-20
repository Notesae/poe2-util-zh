# 七站翻译实页校验问题清单与修复进度

日期：2026-09-20。状态：**已实施首批 0.2.4 修复；下方原始审校记录保留，未解决项见进度表**。

安装 0.2.4 后的实页复验见 [第二轮校对报告](TRANSLATION_RECHECK_0.2.4.md)。组号、可选提示、部分奖励、黑名单分页和布局辅助标签并未完全生效；下表“实现”不代表这些项目已通过真实页面验收，以第二轮证据为准。

## 0.2.4 修复进度

“已实现”指源码修改与受控页面回归，不代表安装新版后所有真实页面已经再次验收。原审校中使用的安装版本为 0.2.3。

| 范围 | 本轮实现 | 保留事项 |
| --- | --- | --- |
| G01／P01 | 整句合并跳过含上标、下标、快捷键等语义组件的容器；回归验证数值节点、样式容器、动态更新和关闭恢复 | 其他未知富文本结构继续检查 |
| G02／M01／C01／C06 | Mobalytics 排序使用站点译文；Craft 实页 `#instructions`、`#groupTypeChooser` 和条件区限定翻译 | 不将 Hit／And／Not 全站改成操作词 |
| G03／N07／P04 | 图片 alt 加入翻译、增量监听、双语及恢复流程 | 词库未知的图片说明仍保留英文 |
| G05／N01 | 已确认重复 sep ID 错配；构建改用相邻唯一物品 ID 配对，修正 Omens／Augments／Idols，移除歧义 API 路径 | 不按数组位置猜配 |
| T01–T07、T10–T11 | DPS 单位、上架标签及时间范围、结果数量、布局、需求前缀、相对时间、移除按钮与分页模板 | 相对时间未枚举的表达保留原文 |
| T08–T09 | 补充已记录的联系／忽略／藏身处标签、账号栏和部分法律链接标签 | 未统一翻译所有 title；原文悬停提示保留；T12 完整帮助文案仍待逐句补录 |
| M02–M05、M08–M09、M11–M16 | 筛选、作者标签、数量／时间、已确认职业别名、组号、任务及两类组合奖励、编辑器提示、排行操作 | Mirror Tier 等 UI 为项目编辑译文；未识别的站点拼写变体保留 |
| M18–M19 | 物品分类、表头、来源和数值属性缩写 | 未逐条验收 819 个候选实例 |
| M20、M22 | 固定 5% 熔火噴濺词缀按来源实例收录；技能授予使用已有技能名 | 其余复杂词缀、插槽／占位标签未全补；M21 跨列表项词缀尚未合并 |
| N02–N05 | 多数传奇分类、行情／搜索标签、单数 Keystone、双手锤／权杖组合 | Lineage Gems、Vaal Body Part、N06 物品说明尚待可靠对照 |
| P02–P03 | 已知配置组合和辅助标签、月等相对时间 | 未知自定义配置片段原样保留 |
| C03–C05、C07–C13 | 已记录的多数操作／状态、胸甲属性组合、标签筛选、表头、当前值加区间词缀、需求标签和辅助菜单 | Temple／Fluxes 等系统名暂未补；C02 伪占位 value 不作通用修改 |
| C14 | 重新观察确认“古典”的原文是 Relic；只在类别选择器改用已有 Relics→聖物 | Strongboxes→保險箱仍需目标地区术语核对 |
| O01–O08 | 账号栏、直播计数、折扣／到期模板、论坛标题、展开按钮与商城分类 | Kirac 完整品牌名、商品降价长句、固定板块简介未全补 |

仍未处理：T13、M06–M07、M10、M17、N08、P05 等需界定正文边界或术语来源的项目；G08／N09／C15 性能现象尚无扩展开关对照，不能宣称解决。Maxroll 实页继续受限。

新增回归包括：富文本数值节点不丢失、范围参数原样保留、类别分隔项与 API 一致、词义作用域、输入值保护、双语切换、属性更新、关闭恢复、SPA 和增量扫描隔离。升级需在扩展管理页重新加载 0.2.4，并刷新已打开的网站；旧标签页不会自动加载修改后的脚本。

验证结果：`npm test` 全套通过（引擎、数据覆盖、Chrome DOM/API、Edge MV3 加载、六站模块）；最后的市集辅助属性和 API 断言调整后，另行重跑 `browser.test.cjs` 与 `extension.test.cjs` 通过。`git diff --check` 与关键脚本语法检查通过。没有提交、推送或创建远端发布。

## 校验方法与结论边界

- 使用用户已安装翻译扩展的 Codex 侧边栏浏览器，读取真实页面、展开菜单，并核对动态加载完成后的文本；关键排版问题另以截图确认。
- 扩展版本标识为 0.2.3；没有通过扩展管理页核对安装目录，因此不能保证安装副本与当前工作区字节完全一致。
- 浏览器中的文本是实测证据；本地代码与词库查询仅用于解释可能成因，不等同于修复或回归通过。
- 七站全部纳入清单，但 Maxroll 被浏览器站点安全策略阻止，本轮没有实页验收；没有换浏览器、请求方式或工具绕过。
- 不把刚导航时的英文、加载中状态、广告内容、第三方视频播放器文字当作扩展漏译。能够再次读取的动态页面均等待后复核。
- 未执行交易、密语、黑名单修改、购买、收藏、发布、保存构筑或账号绑定。报告不保存用户账号、卖家身份、私人历史及构筑代码。
- “全部内容”不能等同于逐条验收所有用户攻略、装备组合、词缀数值和后台错误状态。下表明确覆盖范围；未覆盖项不标记通过。

## 覆盖矩阵

| 模块 | 本轮实际检查 | 未覆盖或受限 |
| --- | --- | --- |
| 市集 | 已打开的搜索结果；装备、需求、终局、杂项、交易筛选；上架时间下拉；批量交易入口与货币列表；设置页；关于页 | 全部词缀组合、每个基底、所有下拉选项、实时搜索通知、交易执行、个人历史内容 |
| Mobalytics | 首页、流派列表、筛选弹层、一个完整构筑详情、任务奖励、留言区、目录、导出区、规划器空白页和奖励下拉、强度排行、传奇物品库 22 个表格的英文候选提取 | 每篇攻略、全部变体、天赋画布全部节点、全部装备／宝石悬浮提示、登录后保存流程；候选提取不等同于每条游戏词缀语义验收 |
| NINJA | 联盟入口、Forbidden Rites 流派列表与筛选、行情分类、货币表、神圣石详情和价格历史标题 | 全部角色详情、全部行情物品、图表悬浮数据、天赋画布 |
| POBb.in | 首页导入入口、公开 PoE2 构筑详情的属性、配置、装备图标、宝石、天赋预览；属性排版截图 | 实际导入与发布、全部装备悬浮说明、其他构筑格式、移动端 |
| Craft of Exile | 旧版首页→胸甲→INT 基底；新版首页→胸甲→INT 基底的词缀表、制作菜单、条件组、物品卡及截图 | 全部基底、模拟执行结果、库存保存；旧版大量词缀加载后读取超时，不能据此判定所有英文均为稳定漏译 |
| 官网 | 首页导航、登录状态区域、折扣／直播区、论坛目录、商城分类目录 | 账号管理、私信、购买和发布；新闻／帖子正文按现有产品边界保留原文 |
| Maxroll | 本地站点适配代码只读检查；保留前轮已发现问题的历史上下文 | **本轮实页读取被安全策略阻止，未校验通过** |

## 优先级

- P1：影响数值理解或核心操作语义，优先处理。
- P2：常用界面漏译、局部错译或术语一致性问题。
- P3：低频说明、辅助功能文本和视觉一致性。
- 待核实：已有现象，但缺少足够证据确认原文、标准译名或根因；不可直接批量替换。

## 1. 跨站与翻译机制

| 编号 | 优先级 | 观察及证据 | 后续处理建议 |
| --- | --- | --- | --- |
| G01 | P1 | POBb.in 实页截图中生命为 `15%`，能量护盾为 `12,505271%`。DOM 中属性的内部 `span`、`sup` 已空，而完整文字在外层普通文本中。 | 检查 `sites.js` 的整句合并逻辑，保留数值与上标节点、样式及语义；禁止以拼接后总文本替换数值组件。原始数字分组需在受控对照中确认，不凭截图猜算。 |
| G02 | P1 | 通用游戏／历史界面词库用于普通 UI 时发生词义串用：排序 `Top`→`回到頂部`、快捷键 `Hit`→`擊中`。 | 将站点 UI、游戏术语、正文分开匹配；对高歧义短词使用场景限定，不全站强替换。 |
| G03 | P2 | Mobalytics、NINJA、POBb.in 的文本标签中文而图标 `alt` 英文；本地属性扫描只含 `placeholder`、`aria-label`、`title`，没有 `alt`。 | 补充可恢复的辅助文本处理；不要修改图片 URL、游戏内部 ID、纯装饰图片。 |
| G04 | P2 | 动态短句普遍不匹配：收藏数、结果数、更新时间、上架时间、剩余字数、每小时成交量等。 | 按站点建立严格模板，保留数字、单位和复数；避免宽泛前缀翻译正文。 |
| G05 | P2 | `Idols`、`Omens` 被本地最终词库映射为相同的 `魔偶`；两条来源都指向同一个上游静态接口路径。 | 复核数据抽取配对，检查重复 ID／分隔项导致错配的可能性；先对照来源再修正，不猜标准名。 |
| G06 | P2 | 同一英语词在来源中已有问题：`Remove All`→`移儲全部`；`Physical DPS`→`物理傷害`。 | “有来源”不等于语义正确；维护带证据的站点覆盖及例外清单，勿直接篡改生成文件。 |
| G07 | P2 | 攻略／操作说明中孤立 `and` 被译为 `和`，其余句子仍是英文。 | 明确正文策略：保留整句原文，或翻译有来源的完整句；不要逐个翻译连接词。 |
| G08 | 待核实 | Craft 旧版选择 INT 胸甲后第一次读取出现大量英文，随后读取超时；NINJA 单项详情也曾短暂读取超时，但之后正常加载。 | 分离站点加载、广告和翻译扫描耗时；做扩展开／关对照与性能记录后定责，本轮没有做此对照。 |

## 2. PoE2 市集

入口：[搜索](https://www.pathofexile.com/trade2/)、[批量交易](https://www.pathofexile.com/trade2/exchange/Forbidden%20Rites)、[设置](https://www.pathofexile.com/trade2/settings)、[关于](https://www.pathofexile.com/trade2/about)。

| 编号 | 优先级 | 位置与实际文本 | 问题／建议 |
| --- | --- | --- | --- |
| T01 | P1 | 装备筛选与结果卡：`Physical DPS`→`物理傷害`，`Elemental DPS`→`元素傷害` | 丢失“每秒”，与单次伤害混淆；建议明确为“物理每秒傷害／元素每秒傷害”。 |
| T02 | P2 | 交易筛选：`Listed`→`標示` | 这里是上架时间，应表达“上架時間”。 |
| T03 | P2 | 上架时间：`Up to an Hour Ago`→`1 小時前`，3／12 小时同类 | 丢失时间范围含义，应表达“最近／以内”；天、周选项又用“至多…前”，需统一。 |
| T04 | P2 | 搜索结果：`Showing 100 results (10000+ matched)` | 动态结果摘要漏译。 |
| T05 | P2 | 布局按钮：`Default`、`Compact`、`Compact Two-Columned` | 漏译；分别为预设、紧凑、双栏紧凑等一致术语。 |
| T06 | P2 | 卡片需求：`: 13 Requires:`、`: 32 Requires:` | 单独数值与 `Requires:` 共处文本节点，单词精确匹配不足。 |
| T07 | P2 | 卡片上架时间：`listed last week`、`listed 7 days ago` 等 | 中英混排，需相对时间模板；不处理卖家名称。 |
| T08 | P3 | 卡片辅助说明：`at max Quality`、`Contact Options`、`Ignore Player`、`Travel to Hideout` | 部分可见按钮已中文，但提示／辅助名称仍是英文。 |
| T09 | P2 | 顶部与页脚：`History`、`Logged in as`、`Log Out`、`Messages`、`Contact Support`、`BACK TO MAIN SITE`、法律链接 | 市集与官网模块隔离后，官网词表不自动覆盖市集；需为市集单独补齐。法律链接只翻译标签，不擅自翻译条款。 |
| T10 | P1 | 设置页黑名单按钮：`移儲全部` | 明显错字，且属于清空操作；应清楚表达“移除全部”。本轮未点击。 |
| T11 | P2 | 设置页黑名单分页：`Showing 1-50 of 0 (Max 1000)` | 固定英文模板漏译；空列表仍显示范围属于站点行为疑点，不能归因给翻译。 |
| T12 | P2 | 关于页：搜索物品名说明、密语语言说明、忽略玩家说明、批量定价示例部分仍英文 | 中英混合，属于站点固定帮助文案；按完整句校对，保留 `~price` 等命令原文。 |
| T13 | 待核实 | 批量分类 `Breach`→`裂痕聯盟`；`Corrupted`→`已汙染` 与 `Twice Corrupted`→`雙重腐化` | 分类语境及汙染／腐化术语需统一；先确认目标地区官方用词。 |

已观察正常：代表性基底、抗性、附加伤害、技能授予、货币、需求属性、终局和杂项多数筛选标签。批量交易货币图标已有中文，不应把英文括注直接判为漏译。

## 3. Mobalytics

页面：[首页](https://mobalytics.gg/poe-2)、[流派](https://mobalytics.gg/poe-2/builds)、[实测构筑](https://mobalytics.gg/poe-2/builds/naviras-fracturing-varashta-league-starter)、[规划器](https://mobalytics.gg/poe-2/planner/builds)、[排行](https://mobalytics.gg/poe-2/tier-list)。

| 编号 | 优先级 | 位置与实际文本 | 问题／建议 |
| --- | --- | --- | --- |
| M01 | P1 | 筛选→排序：`Top`→`回到頂部`，`New`→`新增` | 排序语义错误；需结合站点定义确定“最受欢迎／最新”等，不复用导航和新增操作译文。 |
| M02 | P2 | 筛选：`Patch`、`Published timeframe`、`This week`、`This month`、`Clear all`、`Show 101 results` | 固定词与动态结果数漏译。 |
| M03 | P3 | 筛选辅助名称：`Close filters`、`Filter actions`、`search by name`；导航 `Home`／`Build Planner` 图标说明、`Theme` | 可见文案与辅助文本翻译不一致。 |
| M04 | P2 | 列表：`By`、`Updated on`、`1.3 K Favorites`、`532 Favorites` | 作者标签、更新时间及带单位数量模板缺失；作者名保留。 |
| M05 | P2 | 分类：`Witch Hunter`、`Acolyte`、`Beginner`、`Mechanics`、`Mirror Tier` | 站点别名或短标签漏译；`Witchhunter`、`Acolyte of Chayula` 在别处有中文，不应扩大为模糊匹配。 |
| M06 | P2 | 首页固定宣传：主标题、站点简介、指南说明、团队介绍等大段英文 | 属于固定站点文案，不是用户攻略；单独决定是否纳入完整 UI 汉化。 |
| M07 | P2 | 构筑变体：`Act 1 & 2 (Pre-Ascend)`、`Act 4 to Endgame`、`Early Endgame`、`Mid-Endgame`、`Late Endgame` | 与已翻译的“第 2 章／高階終局”混排；这些可能是作者自定义标签，建议仅覆盖批准的常见完整标签。 |
| M08 | P2 | 天赋统计：`main:`、`set 1:`、`set 2:` | 漏译；应与装备中的“第 1 組／第 2 組”保持一致。 |
| M09 | P2 | 任务：`Check which quests you’ve completed on your character`、`Not Specified`、`2 choices`、`Select reward` | 固定说明、空状态、数量和菜单标签漏译。 |
| M10 | P2 | 任务地点：`Valley of the Titans — Medallion`、`The Venom Crypts — Venom Draught`、`Halls of the Dead — …` 等 | 组合地名／任务名未匹配；需来源确认后按组件处理，不能造译名。 |
| M11 | P2 | 规划器奖励菜单：`30% increased Charm Charges gained, +1 Charm Slot`，效果持续时间同类 | 已选奖励展示能翻译，菜单组合词缀却完整英文；检查角色选项的文本结构和匹配范围。 |
| M12 | P2 | 留言：`Share your thoughts...Type @ to try game data`、`1000 characters remaining`、`1d ago` | 只翻译编辑器外的提示与时间，不改写用户输入／评论正文。 |
| M13 | P2 | 规划器编辑 UI：`Normal text`、`Write something, or press ‘/’ for commands, ‘@’ for game data`、`Add Strengths, separated by Enter`、`Add Weaknesses, separated by Enter`、`Describe build variant...` | 编辑器固定菜单／提示漏译；不得修改 contenteditable 用户内容。 |
| M14 | P2 | 规划器计数：`10000 characters remaining`、`2500 characters remaining`、`Characters remain: 300000` | 两套剩余字数模板均缺失。 |
| M15 | P3 | `Copy Code`、`Ad Placeholder`、`(Optional)`、`Join Creator Program`、`Remove Ads` | 固定 UI 漏译；本地词表已有 `(Optional)`，实页仍英文，需核对安装副本／节点跳过原因。 |
| M16 | P2 | 排行：`Go to Tier List Maker`、`Save as Image`、`Commentary`、`S Tier` 至 `D Tier` | 漏译；排行字母应保留，翻译等级／操作词。 |
| M17 | 待核实 | 职业 `Invoker`→`施法者`，剧情 `Interlude`→`間歇` | 本地词库对应记录来自游戏数据其他语境；需按昇华职业／剧情章节核对目标地区官方译名，不能直接沿用同形词。 |
| M18 | P2 | [传奇物品库](https://mobalytics.gg/poe-2/unique-items)：`Unique Weapons List`、`Unique Armor List`、`Unique Accessories List`、`One-Handed Maces`、`Two-Handed Maces`、`Body Armor`、`Focuses`、`Latest Builds` | 分类、单复数与美式拼写漏译；不能仅补英式 `Armour`。 |
| M19 | P2 | 物品库：`Base Stats`、`Source`、`General drop`，以及 `Physical: 33–49`、`Attacks/sec: 3.0`、`Crit: 6.5%`、`Str: 80`、`Dex: 89`、`Int: 36` | 表头、来源、属性缩写模板系统性漏译。22 个表格中提取到 819 个含英文字母的列表项实例，主要含重复数值模板，**不是 819 个独立缺陷**。 |
| M20 | P2 | 物品库复杂词缀：`Hits with this Weapon have 5% chance to Trigger Molten Shower per 25 Strength`、`113 to Physical Thorns damage per active Protective Rune`、`1 to 4 Added Physical Damage per 1% Block Chance` | 代表性完整词缀未匹配；需逐条对照来源确认是别名、数值格式还是版本差异。 |
| M21 | P2 | 物品库长词缀被拆成相邻列表项，例如 `On Hitting an enemy, gains maximum added Lightning damage equal to`／`the enemy's Power for 20 seconds, up to a total of 500`；弩箭不消耗弹药词缀同类 | 当前整句策略不会跨 `li` 合并，需专门识别同一词缀的换行结构；不得把不同词缀误合并。 |
| M22 | P2 | 物品库：`Sockets: S S S S`、`Has 6 Rune Sockets`、`Has 4 Augment Sockets`、`Grants Skill: Cast on Block`、`Radius: Very Large`、`<Keystone Passive Skill>`、`<Random stat penalty>` 等 | 结构标签、技能名、占位说明仍英文；内部插槽符号／占位参数保留，游戏名称需来源核对。 |

已观察正常：主要导航文字、职业多数名称、技能宝石多数名称、装备／宝石章节、常见词缀、目录链接、任务奖励部分数值词缀、变体切换组件中的通用按钮。刚导航时目录曾全英文，后续已翻译，未记为永久漏译。

## 4. NINJA

页面：[联盟入口](https://poe.ninja/poe2/builds)、[联赛流派](https://poe.ninja/poe2/builds/forbiddenrites)、[行情](https://poe.ninja/poe2/economy/forbiddenrites/currency)、[神圣石](https://poe.ninja/poe2/economy/forbiddenrites/currency/divine-orb)。

| 编号 | 优先级 | 位置与实际文本 | 问题／建议 |
| --- | --- | --- | --- |
| N01 | P1 | 行情侧栏 `/idols` 与 `/omens` 都显示“魔偶” | 两种类别不可区分，关联 G05；核对源数据配对和专用类别翻译。 |
| N02 | P2 | 行情分类：`Lineage Gems`、`Unique Weapons/Armours/Accessories/Flasks/Charms/Jewels/Relics`、`Atlas`、`Unique Tablets`、`Precursor Tablets` | 分类漏译；保留物品与联盟链接不变。 |
| N03 | P2 | 搜索／表头：`Search by item…`、`Filter by Name`、`Value Display`、`Adaptive`、`Volume / Hour`、`Most Popular` | 完整 UI 标签漏译；每小时成交量不能仅译“成交量”。 |
| N04 | P2 | 流派筛选：`Search filters...`、`Vaal Body Part`、`Keystone` | 单复数／新类别未覆盖；已有 `Keystones` 不能覆盖单数。 |
| N05 | P2 | 武器组合：`Two Handed Mace / Sceptre` | 同列表其他组合已中文，此组合不在适配器允许的组合列表中。 |
| N06 | P2 | 神圣石详情：`Exchange`、物品作用说明、右键／左键使用说明 | 物品名已中文，说明仍英文；动作说明应整句处理。 |
| N07 | P3 | 职业、货币图片 `alt` 为英文 | 与 G03 同一机制，屏幕阅读器仍读英文。 |
| N08 | 待核实 | `Forbidden Rites` 未译；已有 `Runes of Aldur` 中文而 `HC/SSF Runes of Aldur` 保留英文 | 官方赛季名与模式前缀组合缺少统一规则；私人联盟名必须保留，不应把所有联盟都强行翻译。 |
| N09 | 待核实 | 神圣石详情／行情曾长时间“載入中…” | 后续可正常显示，不计为翻译失败；性能原因未定位。 |

已观察正常：联盟栏目、角色数量句式、历史快照周／天／小时、职业选项、主要技能／精魂技能、代表性物品词缀、流派表头和多数数值筛选。

## 5. POBb.in

页面：[首页](https://pobb.in/)、[公开 PoE2 构筑](https://pobb.in/Jk5PC8sJXUxf)。

| 编号 | 优先级 | 位置与实际文本 | 问题／建议 |
| --- | --- | --- | --- |
| P01 | P1 | 属性数值／百分比粘连 | 详见 G01，截图和 DOM 均确认；需要专门的富文本数值结构回归。 |
| P02 | P2 | 配置：`26% Shock, 3x Frenzy, 3x Power, Custom Mods` | 逗号分隔的状态组合未译；严格拆分已知配置项，保留数值与未知自定义描述。 |
| P03 | P3 | `History`、`2 months ago`、`Path of Building buildcode`、`Skilltree Preview`、`Source code on GitHub` | 固定／辅助标签及时间漏译。不要点击个人历史来收集无关内容。 |
| P04 | P3 | 装备图标 `Amor Mandragora`、`Ancestral Tiara`、`Mageblood` 等 `alt` 英文 | 仅确认辅助说明漏译，未据此认定悬浮物品卡漏译。 |
| P05 | 待核实 | 自动生成样式标题 `Level 99 Hybrid Crit Whirling Assault Martial Artist` 保留英文 | 需区分自动构筑摘要和用户自定义标题，不能为补译而覆盖用户命名。 |

已观察正常：首页分享／创建／导入按钮，详情大部分属性标签、技能宝石、天赋预览空状态。未发布测试构筑。

## 6. Craft of Exile（旧版与新版）

页面：[旧版](https://www.craftofexile.com/?game=poe2)、[新版](https://beta.craftofexile.com/?game=poe2)。复现基底：胸甲→INT；新版实际选择的基底显示“符鍛羽絨之衣”。

| 编号 | 优先级 | 位置与实际文本 | 问题／建议 |
| --- | --- | --- | --- |
| C01 | P1 | 新版快捷键说明 `Hit`→`擊中`，`Hold … and …` 片段中夹入“和” | 操作语义错误，需按完整操作说明处理，保留快捷键图标。 |
| C02 | P2 | 旧版：`Search for a base or item`、`Search for an affix` | 文字出现在输入框 value 中，不能通过普遍翻译输入值解决；需识别站点的伪占位提示，避免污染真正搜索内容。 |
| C03 | P2 | 旧版：`Base group`、`Choose a base`、`Body Armour (INT)` 等组合、`Choose a crafting method`、`Close filters`、`Close all groups` | 固定文案及组合分类漏译。 |
| C04 | P2 | 新版：`Choose an item class`、`Body Armours (BASE/DEX/INT/STR…)`、`Selected item base` | 与旧版单数写法不同，需覆盖两种形式。 |
| C05 | P2 | 新版制作：`Search modifiers for this base`、`Choose a crafting method`、`Currencies`、`Socketables`、`Temple`、`Fluxes`、`Generate` | 固定操作和类别漏译；游戏系统名需校对来源。 |
| C06 | P1 | 新版条件组：`Requirements` 显示“物品需求”，`And`→`和`、`Not`→`不`，`Or` 仍英文 | 这是计算条件组而非装备穿戴需求；需统一表达“全部符合／任一符合／不符合”等逻辑语义。 |
| C07 | P2 | 新版条件：`Group type`、`Matches`、`Requirement`、`Add a requirement group` | 条件编辑入口漏译。 |
| C08 | P2 | 新版计算：`Simulate this outcome`、`Calculations`、`Create simulation`、`Evaluating setup validity`、`No crafting method selected`、`Executed in … 秒` | 操作、校验状态及计时模板漏译。未启动模拟。 |
| C09 | P2 | 标签：`Caster`、`Critical`、`Resistance`、`Non-*` 系列 | 正标签部分中文，反向标签多数英文；需要成体系、限定上下文处理。 |
| C10 | P2 | 表头：`Modifier types`、`Explicits`、`Corrupted Implicits`、`Base`、`Tiers`、`Type %`、`Weight %`、`Totals` | 与“前綴／後綴／物品等級／權重”混排，需统一术语。 |
| C11 | P1 | 新版物品卡：`7(5-10)% of Damage is taken from Mana before Life` 仍英文 | 同类词缀在表格能译、物品卡不能译，疑似数值区间与文本节点拆分导致；截图确认，需 DOM 结构级回归。 |
| C12 | P2 | 新版物品卡：`New Item`、`Requires level:`、`Int` | 漏译；只翻译标签，保留装备数值。 |
| C13 | P3 | `Connect with Patreon`、`Donations`、`Change language`、`Ad space` | 固定界面漏译；不涉及执行登录或捐赠。 |
| C14 | 待核实 | 新版物品分类显示“古典”“保險箱” | 语境可疑，尚未确认对应原文；不能据印象直接改成某个游戏术语。 |
| C15 | 待核实 | 旧版词缀表首次生成时大量英文，后续读取超时；新版截图出现 `Executed in 42.246 秒` | 明确记录现象，但无法证明耗时来自扩展；不要将短暂英文全部计入词库缺失。 |

已观察正常：新版首页主要功能介绍完整中文、代表性普通词缀模板、部分复合词缀、通货名称、物品等级、前后缀和权重基础标签。

## 7. Path of Exile 官网

页面：[首页](https://www.pathofexile.com/)、[论坛目录](https://www.pathofexile.com/forum)。官网当前主站含 PoE1 内容；扩展的官网模块本身覆盖该域，不应把它误称为 PoE2 专属官网。

| 编号 | 优先级 | 位置与实际文本 | 问题／建议 |
| --- | --- | --- | --- |
| O01 | P2 | `Logged in as`、`Messages`、`Standard League` | 账号栏／角色状态标签漏译；用户角色名保持原文。 |
| O02 | P2 | `Kirac's Vault Pass`、`My Watchlist`、`Redeem Key` | 菜单漏译，已有 `Vault Pass` 不匹配完整品牌名称。 |
| O03 | P2 | 折扣区：`29% Off`、`… discounted to 295 Points`、`Ends in 1 day` | 数量与倒计时模板漏译；商品名可以保留原文，不表示整个句子都不译。 |
| O04 | P2 | 直播区：`Livestreams`、`105 viewers` 等 | 栏目及观看人数漏译，直播标题和主播名保留。 |
| O05 | P2 | 论坛：`Threads:`、`Posts:`、`Last Post`、`Unread posts`、`Clear new posts status for this forum` | 目录计数、表头和辅助提示漏译；本轮未点击清除状态。 |
| O06 | P2 | 论坛板块：`Bug Reports (Path of Exile 1)`、`Feedback and Suggestions (Path of Exile 1)`、`Skill Gem Feedback`、`Support Gem Feedback`、`Art and Audio Feedback` 及固定板块简介 | 属于站点固定目录，不是用户帖子；应与保护帖子正文的规则分开。 |
| O07 | P3 | 折叠目录 `Expand`→`擴展` | UI 语境建议“展開”，与“收起”形成一致配对。 |
| O08 | P2 | [商城目录](https://www.pathofexile.com/shop)：`Skill Effects`、`Footprints`、`Guild Hideout`、`Pets`、`Account Features`、`Unlocked` | 商品分类漏译；“角色／公會／藏身處”已有中文，但对应图片 `alt` 仍英文，关联 G03。未进入购买流程。 |

已观察正常：首页大部分导航、页脚、阅读更多、新闻归档、订阅入口、官网／市集独立翻译模块。

## 8. Maxroll：受限项，不伪造结果

- 已尝试读取用户原有 `https://maxroll.gg/poe2` 标签页；浏览器明确返回站点安全策略阻止。
- 这不是“扩展未翻译”的证据，也不是可以通过其他访问方式规避的网络错误。
- 前轮对 `Meta` 等词的修正及模拟测试不能替代本轮真实页面验收。
- 后续需用户提供页面截图／导出的可见文本，或等待该站点在受支持环境可访问后补查：首页、流派列表／筛选、构筑装备／宝石／天赋、工具、攻略固定组件、移动布局。

## 9. 不应计为漏译的内容

- 玩家账号、角色名、作者名、评论正文、攻略正文、自定义构筑／变体名、私人联盟名：默认保留；若要全文翻译，应另立明确需求。
- 稀有／魔法物品随机组合名：不能用模糊拼词制造官方译名；需要独立数据来源策略。
- `~price`／`~b/o`、导入代码、路径、URL、内部宝石 ID、版本号、P/S 阶级标识：保持功能性内容不变。
- 双语模式的英文括注不是漏译。市集 API 标签与 DOM 结果使用不同翻译路径，展示一致性可另立需求。
- 第三方广告、YouTube 播放器、图片内文字、Canvas 文本：不能因未被 DOM 翻译而声称常规词表失败。

## 10. 原始统一修改建议（当前进度见文首）

1. 先处理 POBb.in 数值节点结构与其他同类富文本回归，防止显示误导。
2. 修正场景错译与分类错配：排序、快捷键、计算条件组、DPS、黑名单按钮、Idols/Omens。
3. 按站点补齐固定 UI 和严格动态模板，统一数量、时间、复数和空状态。
4. 补辅助属性与复杂词缀组件，保证禁用恢复、SPA 更新及输入值保护。
5. 游戏术语／地名／赛季名先查来源；用户正文、未知名词和功能性代码保持不变。
6. 最后做真实页面复查与自动化回归，特别包含数值上标、复合词缀、菜单渲染、扩展关闭恢复和大表格耗时；Maxroll 受限项单列，不以其他站点通过代替。
