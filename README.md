# Reel Invitation — Made for BLK.HN

An intuitive, high-performance web tool designed to mass-personalize and export 9:16 vertical video invitation reels, or invitation images (PNG / JPG), for customers.

---

## ⚡ How it works (4 simple steps)

1. **Choose your video or image**: a vertical 9:16 video (MP4, MOV or WebM, best at 1080×1920) or an invitation image
   (PNG, JPG or WebP) with an empty space for the name.
2. **Type guest names**: one name per line, or import a `.txt` / `.csv` file (first column; a "Name" / "Họ và tên" header row is skipped).
3. **Style the name**: pick a font, size, color, effect and position. Drag or tap the name on the live preview to move it.
   Bold/italic/uppercase, letter spacing, your own font file and "show the name only during part of the video" are under **More options**.
4. **Create**: one file per name. Videos become MP4s with the original audio kept; images keep their full resolution
   (JPG stays JPG, PNG/WebP become PNG with transparency kept). Download them one by one or all at once as a ZIP.

### 🇻🇳 English & Tiếng Việt

The whole interface is available in English and Vietnamese. The language is picked automatically from the browser
and can be switched at any time with the **English / Tiếng Việt** buttons (the choice is remembered).
Share a link that opens straight in Vietnamese with `?lang=vi`, e.g. `https://markdo27.github.io/Massname/?lang=vi`.

All fonts (Playfair Display, Montserrat, Great Vibes, Anton) include full Vietnamese glyphs, so names such as
"Nguyễn Thị Hằng" render correctly.

### 🎬 How files are made

- **Images** are always made in the browser, instantly, on any modern browser. Nothing is uploaded.

Videos use one of two engines:

- **In the browser** (used on GitHub Pages or whenever the local server isn't running): the video is processed on the
  visitor's own computer with WebCodecs. Nothing is uploaded. Works best in **Google Chrome or Microsoft Edge** on a computer.
- **Local FFmpeg server** (used automatically when you run the app locally with `npm run dev` / `npm start`):
  the video is rendered by FFmpeg on your machine and works in any browser.

---

## 🚀 Running Locally

### 1-Click Launcher (Windows)
Double-click:
```
start.bat
```
Opens browser automatically at `http://localhost:5173`.

### Or via Terminal
```bash
npm run dev
```

---

## 🌐 Deployment

- **GitHub Repository**: [https://github.com/markdo27/Massname](https://github.com/markdo27/Massname)
- **Live GitHub Pages**: [https://markdo27.github.io/Massname/](https://markdo27.github.io/Massname/)

---

*Made with ❤️ for BLK.HN*
