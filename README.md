# Gallary · 个人摄影网站

为一位摄影师建造的个人作品站。两条主线：
- **作品 (Works)** — 策展过的「系列+故事」，每张照片有独立页面，仪式感优先。
- **日志 (Journal)** — 时间线归档，按年/月聚合，便于持续更新。

中英双语（`/` 中文，`/en/...` 英文）。Astro 静态站点 + Markdown 内容。

---

## 启动

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # 生成 dist/
npm run preview      # 预览构建产物
```

---

## 怎么添加新照片 / 新系列 / 新日志

整个站的内容都在 `src/content/` 里，每个文件就是一张照片或一个系列或一条日志。**编辑 / 新增 / 删除 markdown 文件即可，不用动代码。**

### 添加一张新照片

1. 在 `src/content/photos/` 新建一个文件，例如 `2025-08-rainy-day.md`。
2. 内容如下：

```markdown
---
image: "https://your-cdn.com/path/to/photo.jpg"   # 图片 URL（CDN）
width: 2000                                        # 可选，但有助于布局
height: 1333
alt_zh: "中文 alt（描述图片内容，给视障读者看）"
alt_en: "English alt"
caption_zh: "一句话说明（可空）"
caption_en: "Short caption (optional)"
date: 2025-08-15
location_zh: "上海"
location_en: "Shanghai"
tags: ["rain", "street"]
camera: "Hasselblad 500C/M"     # 可空
film: "Kodak Portra 400"        # 可空
---

（这里写长的故事，可有可无。直接用 markdown 写就行。）
```

> **重要**：`image` 字段不要指向本地原图。原图永远不要放进 git 仓库。
> 推荐做法：把展示版（长边 2400px、sRGB、嵌入版权）上传到 Cloudflare Images / Bunny CDN / ImageKit，把那里的 URL 填到 `image`。

### 添加一个新系列

1. 在 `src/content/series/` 新建 `your-series-slug.md`。
2. 列出哪些照片属于这个系列：

```markdown
---
title_zh: "你的系列中文名"
title_en: "Your Series in English"
year_start: 2024
year_end: null            # null 表示进行中（自动显示「至今 / present」）
intro_zh: "几句话的序言"
intro_en: "A few sentences of foreword"
cover: "https://your-cdn.com/cover.jpg"
cover_alt_zh: "封面图描述"
cover_alt_en: "Cover image description"
photos:                   # 顺序就是展示顺序
  - your-photo-id-1
  - your-photo-id-2
  - your-photo-id-3
featured: true            # 是否在首页展示（最多 3 个）
order: 10                 # 排序，数字小的在前
---

（系列页面正文，可写也可不写。）
```

`photos:` 列表里的每一项是 `src/content/photos/` 里那个 md 文件的**文件名（去掉 .md）**。

### 添加一条日志

1. 在 `src/content/journal/` 新建 `2025-08-something.md`。
2. 内容：

```markdown
---
title_zh: "日志标题"
title_en: "Journal title"
date: 2025-08-15           # 决定它落在哪一年/哪一月
location_zh: "苏州"
location_en: "Suzhou"
photos:                    # 引用 photos/ 里的照片
  - your-photo-id
tags: ["rain"]
---

（日志正文。可以是几句也可以是几段。）
```

### 隐藏一篇还没准备好的内容

任何 frontmatter 里加 `draft: true`，它就不会出现在站点上。

---

## 项目结构

```
src/
├── content.config.ts         # 内容 schema (zod)
├── content/
│   ├── series/               # 系列 ←
│   ├── photos/               # 照片 ← 你主要在这三个目录里工作
│   └── journal/              # 日志 ←
├── i18n/ui.ts                # 所有 UI 文案 (zh + en)
├── layouts/BaseLayout.astro
├── components/               # Header, Footer, PhotoFrame, SeriesCard, JournalListItem
├── views/                    # Home / WorksList / SeriesView / PhotoView / Journal* / About / Contact
├── pages/                    # 路由（每个文件就是一个页面）
│   ├── *.astro               # 中文 (默认)
│   └── en/...                # 英文镜像
├── lib/paths.ts              # 共享的内容查询 / 路径生成
└── styles/global.css         # 设计令牌（颜色、字体、间距）
```

---

## 设计原则（修改前请读一下）

1. **克制**。无品牌色、无暗黑模式、无轮播、无视差。任何"让网站显得活泼"的特性都会破坏作品的安静。
2. **照片周围至少 80–120px 留白**。这是画廊感的关键，比任何 CSS 技巧都重要。
3. **正文 17px / 行高 1.75**。读起来像一本印刷品。
4. **首页只展示 3 个系列**。把"少"作为风格的一部分。

---

## 部署

推荐 **Cloudflare Pages** 或 **Vercel**：
- 连接 git 仓库；
- 构建命令 `npm run build`；
- 输出目录 `dist`；
- 推送到 main 即自动部署。

记得在 `astro.config.mjs` 里把 `site` 改成正式域名（影响 sitemap 和 canonical URL）。

---

## TODO（按优先级）

- [ ] 接 CDN（Cloudflare Images / Bunny），替换占位的 picsum URL
- [ ] 用真实作品替换 demo 内容（`src/content/series/*` 和 `photos/*`）
- [ ] 改站名（`src/layouts/BaseLayout.astro` 和 `src/components/Header.astro` 里的 "无名工作室 / Untitled Studio"）
- [ ] 自定义字体托管（思源宋体 / 思源黑体 woff2 放到 `public/fonts/`，在 `global.css` 里 `@font-face`）
- [ ] 标签聚合页 `/tags/[tag]`（按计划 Phase 3）
- [ ] 站内搜索（Pagefind，纯静态、无后端）
- [ ] 一个 `npm run new-photo` 交互式 CLI，让作者不用记 frontmatter
