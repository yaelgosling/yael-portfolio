# My portfolio site – how to update it

This guide explains how to update my portfolio site without writing code myself.
Claude Code does most of the work. I tell it what to change, then I check and publish.

- **Figma file:** https://www.figma.com/design/PVsgdDyv151sh6LCOHO3Vf/brand-book
- **Code on GitHub:** https://github.com/yaelgosling/yael-portfolio
- **Live site:** Vercel republishes it on its own after every push

---

## Before you start

1. Open VS Code and open the folder `Documents › Bezalel › שנה ד › portfolio`.
2. Open the Claude Code panel.
3. Claude reads `CLAUDE.md` at the start of every chat. The site's rules are written there.

**My three rules:**
- **Figma first.** Change it in Figma, and only then tell Claude to bring the change to the site.
- **One change per prompt.** That way it's easy to check and easy to undo.
- **Check before you publish,** on the computer and on a phone.

---

## What's in the folder

| File / folder | What's in it |
|---|---|
| `index.html` | The home page: the project frames |
| `the-witch.html`, `i-dont-touch-meat.html`, `grunge.html`, `judges-chapter-4.html`, `mtv-ident.html` | One page per project |
| `process.html` | The Process page: one card per week |
| `styles.css` | All the design. The variables (colours, fonts, sizes) are at the top |
| `script.js` | The movement and behaviour: the rolling bar, the index, Hi, the videos |
| `images/` | All pictures and videos. One folder per project, and `images/process` for the Process page |
| `CLAUDE.md` | The rules Claude works by |

### Three things to know about this site

**1. Every project page has two versions: computer and phone.**
The text and pictures appear twice in the same file: once in the computer version (the strip you scroll sideways) and once in the phone version (which scrolls down).
When you change text or a picture, ask Claude to change it **in both versions**.

**2. The bar, the index and the Hi page are copied into every page.**
They are written out again in each of the seven HTML files. When you change them, ask Claude to change them **on every page**.

**3. The positions come from Figma.**
Every picture and piece of text has numbers like `--x: 738; --y: 112; --w: 914`. These are its position and width in the Figma frame, in Figma pixels.
The computer frame is 1440 wide and the phone frame is 390 wide. If you move something in Figma, give Claude the new numbers.

---

## 1. Replace a picture

**Preparing the picture:**
- **Format:** JPG for photos and mockups. PNG only when you need transparency.
- **Computer size:** about 2× its width in Figma. For example, 400 wide in Figma → an 800-wide file.
- **Phone size:** make a second copy, about 3× its width in the phone frame, with `-phone` at the end of the name. For example `poster.jpg` and `poster-phone.jpg`.
- **File size:** up to about 400KB per picture. If it's heavier, make it smaller or export at 80% quality.
- **Name:** in English, lowercase, no spaces. For example `book-cover-2.jpg`.

**Steps:**
1. Put the file (or both files) in the project's folder inside `images/`.
2. Give Claude the prompt.
3. Check, then publish (section 7).

**Example prompt:**
```
On grunge.html, replace the picture poster.jpg with the new picture images/grunge/new-poster.jpg,
and in the phone version with images/grunge/new-poster-phone.jpg. If the width-to-height ratio
changed, update --h so the picture doesn't stretch. Also change the alt (description) to:
"[short description of the picture]". Don't change anything else. When you're done, tell me what you changed.
```

**If the picture moved in Figma:**
```
On grunge.html, the picture poster.jpg moved in Figma, in the frame [frame name].
New computer position: x [number], y [number], width [number]. Don't change anything else.
```

---

## 2. Update text

### Text on a project page
```
On the-witch.html, replace the paragraph that starts with "This is one of my favourite projects"
with this text: "[new text]". Change it in both the computer and the phone version.
If the new text is longer and runs into something else, don't move anything. Just tell me, and I'll decide in Figma.
```

### Text on the Hi (about) page
```
On the Hi page, replace the text "[old text]" with "[new text]".
The Hi page is copied into every HTML file, so change it in all of them and check they all match.
Don't change anything else.
```

### A project's name, or its type in the index
```
Rename the project "[old name]" to "[new name]" everywhere it appears: the index, the phone
project list, the title on the project page, the <title>, and the "Next project" buttons on other pages.
Before you change anything, give me a list of all the places.
```

---

## 3. Add or replace a video

**Preparing the video:**
- **Format:** MP4.
- **File size:** under 10MB. If it's heavier, make it smaller or shorter.
- **Poster:** a JPG of the first frame, so something shows straight away. Make a `-phone` version too.
- **Sound:** decide whether it plays with sound or stays silent.

**Example prompt:**
```
On mtv-ident.html, replace the video with the new video images/mtv-ident/[name].mp4.
The posters: images/mtv-ident/[name]-poster.jpg and [name]-poster-phone.jpg.
The video is [with sound / silent]. Change it on both computer and phone, and don't change anything else.
```

---

## 4. Add an entry to the Process page

1. Export the week's picture or video into the `images/process` folder.
2. Design the card in Figma, next to the earlier cards.
3. Give Claude the prompt.

**Example prompt:**
```
Add a new card to process.html after the 23/11 card, with the same structure as the existing cards.
Date: [e.g. 29/11]. Title: "[e.g. FINAL TOUCHES]".
Picture: images/process/[file name]. Text: "[2–3 lines: what changed and why]".
Colours and position follow the frame [frame name] in Figma: [link]. Don't change the existing cards.
```

---

## 5. Change a colour, font or size (a variable)

All the design decisions live at the top of `styles.css`, inside `:root`. Change it in one place, and it changes across the whole site.

**The main variables:**

| Variable | What it does |
|---|---|
| `--color-white` | Page background |
| `--color-black` | Text |
| `--color-orange` | The orange of the cards |
| `--color-blue` | The blue of the cards |
| `--color-lime` | The lime of the cards and small labels |
| `--font-display` | Font for titles and the menu (Instrument Serif) |
| `--font-body` | Font for text on project pages (Inter) |
| `--project-text-size` | Text size on project pages, computer |
| `--project-title-size` | Project title size, computer |
| `--bar-text-size` | Size of the words in the bar |
| `--page-change-time` | How long the change between pages takes |
| `--roll-time` | How long a word in the bar takes to roll |
| `--phone-space` | Side spacing on phones |

**Steps:**
1. Change the variable in Figma.
2. Give Claude the prompt.
3. Go through every page and check the change reached everywhere it should.

**Example prompt:**
```
I updated the variable color/orange in Figma to [#colour code]. Update only --color-orange in styles.css.
Don't change anything else. Before you change it, list which pages the change will show on.
```

---

## 6. Add a new project

This is the biggest task, so do it in steps.

**Preparation:**
1. In Figma: design the project page for computer (1440) and phone (390), its frame on the home page, and its place in the index.
2. Make a new folder inside `images/` with the project's name in English, for example `images/new-project`.
3. Put the pictures (each with a `-phone` copy) and videos in it.

**Prompt 1, the page itself:**
```
I want to add a new project called "[project name]", type "[e.g. Illustration]".
Create a new page [new-project].html, based on the structure of the-witch.html.
The design follows the Figma frames: [link to computer frame] and [link to phone frame].
The pictures and videos are in images/[new-project]. The text: "[text]".
Don't change any other pages yet. When you're done, give me a local preview link.
```

**Prompt 2, connecting it to the rest of the site** (once the page looks right):
```
Connect [new-project].html to the rest of the site: add it to the index and the phone project list
on every page, add its frame to the home page on computer and phone following [Figma link],
and update the "Next project" buttons so the order still runs through. Before you change anything,
give me a list of all the changes.
```

---

## 7. Check and publish

**Check locally:**
```
Start a local preview of the site and give me the link.
```
- Check on the computer, and in Chrome's phone view (Cmd+Option+I → the phone icon at the top).
- Check nothing else broke: page changes, the bar, the index and Hi.

**Publish:**
```
Commit with a message that describes the change, and push.
When Vercel is done, give me the live address of the pages that changed.
```
- Open the live site **on a real phone** and check again.

**If the change doesn't show on the live site:**
The browser remembers the old version of `styles.css` and `script.js`. To make it load the new one, every page has a version number (`styles.css?v=145`, `script.js?v=123`). Raise it by one.
```
Raise the version number of styles.css (and of script.js if it changed) by one in every HTML file,
then commit and push.
```

---

## 8. Something went wrong

- **The result is wrong and I haven't published yet:** type `/rewind` in the Claude Code panel and go back to before the change. Write the prompt more precisely instead of fixing a fix on top of a fix.
- **I already published and something broke on the live site:**
  ```
  The last change broke [what broke]. Put the site back to how it was before the last commit, and push.
  ```
- **Claude changed more than I asked:** add "Don't change anything else" to the prompt, and use exact names: the file name, the picture name, the variable name.
