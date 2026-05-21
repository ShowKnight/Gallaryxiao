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

照片图片直接放进仓库，由 GitHub Pages 托管。**唯一的铁律：进仓库前必须先压缩**——相机原图一张 5MB+，绝不能直接 commit。

**第 1 步 · 压缩图片**

把相机原图（可以一次选很多张）丢给压缩脚本：

```bash
npm run prep -- ~/Desktop/相机原图/*.jpg
# 想给文件名统一前缀（按系列分组），加 --prefix：
npm run prep -- ~/Desktop/letters/*.jpg --prefix letters
```

脚本会自动：缩到长边 2400px、转 sRGB、**剥掉 EXIF/GPS**、压成 ~300–800KB 的 JPEG，
输出到 `src/content/photos/_media/`。原图你自己在硬盘/网盘留底就行，不进仓库。

**第 2 步 · 新建照片 markdown**

在 `src/content/photos/` 新建一个文件，例如 `2025-08-rainy-day.md`：

```markdown
---
image: "./_media/rainy-day.jpg"   # 指向第 1 步压好的图（相对路径）
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

构建时 Astro 会自动从这张图再生成 WebP、多种屏幕尺寸、懒加载——你什么都不用管。

> **`image` 字段两种写法**：
> - `"./_media/xxx.jpg"` —— 仓库内的本地图（推荐，走 Astro 优化）
> - `"https://..."` —— 远程 URL（以后若改用 CDN 仍兼容）
>
> **不要**把相机原图直接放进 `_media/`。永远先 `npm run prep` 压一遍。

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
cover: "../photos/_media/your-photo-01.jpg"   # 复用系列里某张照片的图；也可填 https:// 远程 URL
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
│   │   └── _media/           #   ← 压好的照片图片（npm run prep 生成）
│   └── journal/              # 日志 ←
├── i18n/ui.ts                # 所有 UI 文案 (zh + en)
├── layouts/BaseLayout.astro
├── components/               # Header, Footer, Img, PhotoFrame, SeriesCard, JournalListItem
├── views/                    # Home / WorksList / SeriesView / PhotoView / Journal* / About / Contact
├── pages/                    # 路由（每个文件就是一个页面）
│   ├── *.astro               # 中文 (默认)
│   └── en/...                # 英文镜像
├── lib/
│   ├── paths.ts              # 共享的内容查询 / 路径生成
│   └── image.ts              # 远程图片 URL helper（veImageX / CDN 兼容用）
└── styles/global.css         # 设计令牌（颜色、字体、间距）

scripts/
└── prep-images.mjs           # npm run prep —— 把相机原图批量压成展示版
```

---

## 设计原则（修改前请读一下）

1. **克制**。无品牌色、无暗黑模式、无轮播、无视差。任何"让网站显得活泼"的特性都会破坏作品的安静。
2. **照片周围至少 80–120px 留白**。这是画廊感的关键，比任何 CSS 技巧都重要。
3. **正文 17px / 行高 1.75**。读起来像一本印刷品。
4. **首页只展示 3 个系列**。把"少"作为风格的一部分。

---

## 部署到 GitHub Pages（最快上线）

仓库已配好工作流 `.github/workflows/deploy.yml`，推送到 `main` 会自动构建并发布。

**第一次需要手动开一下开关：**

1. GitHub 仓库 → **Settings** → **Pages** → **Build and deployment** → Source 选 **GitHub Actions**。
2. 把当前分支合并进 `main`（或直接在 Actions 页面手动运行 "Deploy to GitHub Pages"）。
3. 等工作流跑完，站点上线在 **https://showknight.github.io/Gallaryxiao/**。

> 站点发布在子路径 `/Gallaryxiao/` 下，所以 `astro.config.mjs` 里设了 `base: '/Gallaryxiao/'`。
> 注意大小写必须和仓库名 `Gallaryxiao` 完全一致 —— GitHub Pages 路径区分大小写。
> 本地 `npm run dev` / `npm run preview` 也会带这个前缀（`http://localhost:4321/Gallaryxiao/`）。

**换成自定义域名时**：把工作流里 build 步骤的环境变量设成 `SITE_URL=https://你的域名`
与 `BASE_PATH=/`，新建 `public/CNAME`（内容就是域名一行），并在 Settings → Pages 填 Custom domain。

---

## 部署到 Cloudflare Pages

1. 登录 https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 选择本仓库 `ShowKnight/Gallaryxiao`，branch 选 `main`。
3. 构建设置：
   - Framework preset: **Astro**（会自动填好）
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Environment variables** 加：
   - `SITE_URL` = `https://shellyxiao.com`（或你的正式域名）
   - `PUBLIC_IMAGE_HOST` = `tos-cn-i-XXXX.volccdn.com`（火山 veImageX 给你的访问域名）
   - `IMAGE_HOST` = 同上
   - `NODE_VERSION` = `22`
5. 点 **Save and Deploy**，几分钟后给你一个 `xxx.pages.dev` 地址。
6. **绑域名**：在 Pages 项目里 → **Custom domains** → Add → 输入 `shellyxiao.com` 和 `www.shellyxiao.com`。Cloudflare 自动签 HTTPS。

---

## 图片托管

**当前方案：图片放进仓库，GitHub Pages 托管。** 流程见上面「添加一张新照片」——
`npm run prep` 压缩 → 放进 `src/content/photos/_media/` → Astro 构建时再优化成 WebP/多尺寸。

这个方案对几百张照片、温和访问量完全够用（GitHub Pages 站点上限 1GB、流量
100GB/月）。**铁律只有一条：进仓库前必须 `npm run prep` 压缩，绝不 commit 相机原图。**

### 未来若要换 CDN（火山 veImageX / Cloudflare 等）

当照片量逼近 1GB、或想要访问时实时裁图，再考虑迁到 CDN。代码已经为此留好口子：
`src/lib/image.ts` 的 `imageUrl()` 会处理远程 URL，`image:` 字段同时支持本地路径和
`https://` URL。届时把 `image:` 改成 CDN URL 即可，组件代码不用动。
（veImageX 的服务 / 模板 / 上传脚本 `scripts/upload.mjs` 已经写好，需要时启用。）

---

## TODO（按优先级）

- [ ] 改站名（`src/layouts/BaseLayout.astro` 和 `src/components/Header.astro` 里的 "无名工作室 / Untitled Studio" → "肖双巧 / Shelly Xiao" 之类）
- [ ] 注册域名（建议 `shellyxiao.com`，可选加 `shellyxiao.photo`）
- [ ] 用真实照片替换 demo 内容（`npm run prep` 压缩 → 写 `src/content/photos/*.md`）
- [ ] 自定义字体托管（思源宋体 / 思源黑体 woff2 放到 `public/fonts/`，在 `global.css` 里 `@font-face`）
- [ ] 标签聚合页 `/tags/[tag]`
- [ ] 站内搜索（Pagefind，纯静态、无后端）
- [ ] 一个 `npm run upload-photo` 交互式 CLI（上传到 veImageX + 生成 markdown）
- [ ] 一个 `npm run new-photo` 交互式 CLI，让作者不用记 frontmatter
