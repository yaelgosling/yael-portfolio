/* =========================================
   Things that follow the mouse: the frames on the home page and the drawings on the Hi page
   Like guillaumetomasi.com: everything drifts slowly away from the mouse,
   and things further from the middle move more, which gives a feeling of depth.
   ========================================= */
const home = document.querySelector(".home");

// Only with a real mouse, and not for people who asked their computer for less motion
const canMove =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const MAX_MOVE = 160;        // how far (Figma pixels) something at the edge can move
const EASING = 0.04;         // how quickly things catch up with the mouse (smaller = smoother)

// items: [{ element (gets --move-x and --move-y), placed (has --x --y --w --h) }]
// stageWidth/stageHeight: the Figma frame size. isActive(): whether they should move right now
function followMouse(items, stageWidth, stageHeight, isActive) {
  // A random number between min and max
  const between = (min, max) => min + Math.random() * (max - min);

  // How much each one moves: more for things further from the middle, with a bit of randomness
  const movers = items.map(({ element, placed }) => {
    const read = (name) => parseFloat(placed.style.getPropertyValue(name));
    const middleX = read("--x") + read("--w") / 2;
    const middleY = read("--y") + read("--h") / 2;
    const distanceX = Math.abs(middleX - stageWidth / 2) / (stageWidth / 2);
    const distanceY = Math.abs(middleY - stageHeight / 2) / (stageHeight / 2);
    return {
      element,
      strengthX: Math.max(0.3, distanceX) * between(0.5, 1.2),
      strengthY: Math.max(0.3, distanceY) * between(0.5, 1.2),
      moveX: 0,
      moveY: 0,
    };
  });

  // Where the mouse is: from -0.5 (left/top) to 0.5 (right/bottom)
  let mouseX = 0;
  let mouseY = 0;
  let isAnimating = false;

  // Every screen refresh, move each one a small step towards where it should be
  function animate() {
    let stillMoving = false;

    movers.forEach((mover) => {
      const targetX = -mouseX * 2 * MAX_MOVE * mover.strengthX;
      const targetY = -mouseY * 2 * MAX_MOVE * mover.strengthY;
      mover.moveX += (targetX - mover.moveX) * EASING;
      mover.moveY += (targetY - mover.moveY) * EASING;
      mover.element.style.setProperty("--move-x", mover.moveX.toFixed(2));
      mover.element.style.setProperty("--move-y", mover.moveY.toFixed(2));
      if (Math.abs(targetX - mover.moveX) > 0.05 || Math.abs(targetY - mover.moveY) > 0.05) {
        stillMoving = true;
      }
    });

    // Stop when everything has arrived, so the page rests when the mouse is still
    isAnimating = stillMoving;
    if (isAnimating) requestAnimationFrame(animate);
  }

  function startAnimating() {
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(animate);
    }
  }

  window.addEventListener("pointermove", (event) => {
    if (!isActive()) return;   // e.g. the home frames stay still behind the index or the Hi page
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
    startAnimating();
  });

  // Everything drifts back to its place
  function rest() {
    mouseX = 0;
    mouseY = 0;
    startAnimating();
  }

  // When the mouse leaves the window
  document.documentElement.addEventListener("mouseleave", rest);

  return rest;
}

let restHomeFrames = () => {};   // lets the home frames drift back to their places (set below)

if (canMove) {
  // The home frames ("Home New" is 1440 x 768)
  if (home) {
    const frames = [...home.querySelectorAll(".home__frames .home-frame")];
    restHomeFrames = followMouse(
      frames.map((frame) => ({ element: frame, placed: frame })),
      1440, 768,
      // still behind the index or the Hi page, and in classic view (everything tidy)
      () => !document.body.matches(".is-index-open, .is-hi-open") && !home.classList.contains("is-classic")
    );
  }

  // The drawings on the Hi page ("Hi page" is 1440 x 800). Each drawing moves with its text.
  // The picture of me stays still
  const doodles = [...document.querySelectorAll(".hi-doodle:not(.hi-doodle--me)")];
  if (doodles.length) {
    followMouse(
      doodles.map((doodle) => ({ element: doodle, placed: doodle.querySelector(".hi-doodle__picture") })),
      1440, 800,
      () => document.body.matches(".is-hi-open") && !document.body.matches(".is-index-open")
    );
  }
}


/* =========================================
   Words that roll on hover (like mason-wong.com): the word moves up and out, and the
   next word comes up from below in italic. Used in the bar, the index, the Hi page
   and Reach Out. Each word becomes two words on top of each other, in a window one
   word high. align: where the next word lines up ("center", "start" or "end")
   ========================================= */
function makeRoll(element, word, nextWord, align = "center", nextClass = "") {
  element.innerHTML = "";
  element.classList.add("roll-host");
  const roll = document.createElement("span");
  roll.className = `roll roll--${align}`;
  const track = document.createElement("span");
  track.className = "roll__track";
  [word, nextWord].forEach((text, index) => {
    const span = document.createElement("span");
    span.className = index === 0 ? "roll__word" : `roll__word roll__word--next ${nextClass}`;
    span.textContent = text;
    track.append(span);
  });
  roll.append(track);
  element.append(roll);
  if (!element.hasAttribute("aria-label")) element.setAttribute("aria-label", word);
}

// The same word again, in italic (or the word in data-roll-next): HOME, WORKS, HI, the names in the list,
// and the links on Reach Out and the Hi page (Instagram, the email address, the phone number)
[
  [".site-bar__text:not(.site-bar__view)", "center"],
  [".site-index__name:not(.site-index__name--soon)", "start"],   // projects that aren't ready stay still
  [".project-text--email", "start"],
].forEach(([selector, align]) => {
  document.querySelectorAll(selector).forEach((element) => {
    const word = element.textContent.trim();
    makeRoll(element, word, element.dataset.rollNext || word, align);   // data-roll-next: a different next word
  });
});

// "EMAIL ME" and "LET'S TALK" on the Hi page roll to the email address and the phone number
document.querySelectorAll(".hi-page__reveal").forEach((reveal) => {
  const label = reveal.querySelector(".hi-page__reveal-label").textContent.trim();
  const value = reveal.querySelector(".hi-page__reveal-value").textContent.trim();
  const align = reveal.classList.contains("hi-page__reveal--right") ? "end" : "start";
  makeRoll(reveal, label, value, align, "hi-page__reveal-value");
});


/* =========================================
   Home page: CLASSIC VIEW tidies the frames into rows and moves the bar to the top
   ("Home New Organise order" in Figma), and PLAY VIEW puts everything back.
   Like the other words, on hover the word rolls to itself in italic. Clicking rolls it on
   once more, to the other view's word (also italic, as the mouse is still on it).
   The home page always opens in play view.
   ========================================= */
let setHomeView = () => {};   // lets other parts switch the view (set below)

document.querySelectorAll(".site-bar__view").forEach((button) => {
  const label = (classic) => (classic ? "PLAY VIEW" : "CLASSIC VIEW");
  const ROLL_TIME = 450;   // the same as --roll-time in styles.css
  let rolling = null;

  function setClassic(classic) {
    clearTimeout(rolling);
    home.classList.toggle("is-classic", classic);
    makeRoll(button, label(classic), label(classic));
    button.setAttribute("aria-label", label(classic));
    button.setAttribute("aria-pressed", classic);
    if (classic) restHomeFrames();   // the frames stop following the mouse
  }
  setHomeView = setClassic;

  button.addEventListener("click", () => {
    const classic = !home.classList.contains("is-classic");
    home.classList.toggle("is-classic", classic);   // the frames and the bar start moving
    if (classic) restHomeFrames();

    // The word rolls on to the new view's word, then the button is rebuilt for that view
    const track = button.querySelector(".roll__track");
    const nextWord = document.createElement("span");
    nextWord.className = "roll__word roll__word--next roll__word--after";
    nextWord.textContent = label(classic);
    track.append(nextWord);
    track.style.transform = "translateY(calc(-2em * var(--roll-line)))";
    clearTimeout(rolling);
    rolling = setTimeout(() => setClassic(classic), ROLL_TIME);
  });

  setClassic(false);
});


/* =========================================
   Index: the name of the project you are on is italic
   ========================================= */
const pageName = (path) => path.replace(/\.html$/, "");   // "/i-dont-touch-meat.html" and "/i-dont-touch-meat" are the same page
document.querySelectorAll("a.site-index__name").forEach((name) => {
  if (pageName(name.pathname) === pageName(window.location.pathname)) name.classList.add("is-current");
});


/* =========================================
   Home page: a frame only changes to its hover version when the mouse is exactly on the
   drawn frame, not on the empty space around it. Each frame drawing is copied onto a hidden
   canvas to make its outline. Everything inside the outline counts as the frame, also the
   see-through gaps between the drawn lines and the picture
   ========================================= */
if (home && window.matchMedia("(hover: hover)").matches) {
  const shapes = [...home.querySelectorAll(".home__frames .home-frame")]
    .filter((frame) => frame.querySelector(".home-frame__hover"))
    .map((frame) => {
      const image = frame.querySelector(".home-frame__image");
      const shape = { frame, outside: null, width: 0, height: 0 };
      const draw = () => {
        const canvas = document.createElement("canvas");
        const width = (canvas.width = Math.round(image.naturalWidth * 2));
        const height = (canvas.height = Math.round(image.naturalHeight * 2));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;

        // Start from the see-through edge of the picture and spread over every see-through
        // pixel that can be reached from there: that's the outside. The rest is the frame
        const outside = new Uint8Array(width * height);
        const queue = [];
        const visit = (x, y) => {
          const i = y * width + x;
          if (!outside[i] && pixels[i * 4 + 3] <= 10) { outside[i] = 1; queue.push(i); }
        };
        for (let x = 0; x < width; x++) { visit(x, 0); visit(x, height - 1); }
        for (let y = 0; y < height; y++) { visit(0, y); visit(width - 1, y); }
        while (queue.length) {
          const i = queue.pop();
          const x = i % width, y = (i - x) / width;
          if (x > 0) visit(x - 1, y);
          if (x < width - 1) visit(x + 1, y);
          if (y > 0) visit(x, y - 1);
          if (y < height - 1) visit(x, y + 1);
        }
        Object.assign(shape, { outside, width, height });
      };
      if (image.complete && image.naturalWidth) draw();
      else image.addEventListener("load", draw, { once: true });
      return shape;
    });

  // Is the point (x, y) on the drawing of this frame?
  function onDrawing({ frame, outside, width, height }, x, y) {
    if (!outside) return false;
    const box = frame.getBoundingClientRect();
    if (x < box.left || x >= box.right || y < box.top || y >= box.bottom) return false;
    const px = Math.min(width - 1, Math.floor(((x - box.left) / box.width) * width));
    const py = Math.min(height - 1, Math.floor(((y - box.top) / box.height) * height));
    return !outside[py * width + px];
  }

  let mouse = null;

  function updateHover() {
    let hovered = null;
    const covered =
      !mouse ||
      document.body.matches(".is-index-open, .is-hi-open") ||
      !home.querySelector(".home__frames").contains(document.elementFromPoint(mouse.x, mouse.y));
    if (!covered) {
      // The frame drawn last is on top
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (onDrawing(shapes[i], mouse.x, mouse.y)) { hovered = shapes[i].frame; break; }
      }
    }
    shapes.forEach(({ frame }) => frame.classList.toggle("is-hovered", frame === hovered));
  }

  document.addEventListener("pointermove", (event) => {
    mouse = { x: event.clientX, y: event.clientY };
    updateHover();
  });
  document.documentElement.addEventListener("mouseleave", () => { mouse = null; updateHover(); });
  // The frames also move by themselves (following the mouse, or into classic view)
  setInterval(() => { if (mouse) updateHover(); }, 100);
}


/* =========================================
   Home page: clicking a frame opens its project page.
   The project page waits (already loaded) below the screen, slides up over the
   home page while the bar stays where it is, and then the browser opens it.
   ========================================= */
const PAGE_CHANGE_TIME = 900;  // the same as --page-change-time in styles.css

document.querySelectorAll(".home__frames .home-frame--link").forEach((link) => {
  let slide = null;

  // Load the project page below the screen (as soon as the mouse is over the frame)
  function prepareSlide() {
    if (slide) return slide;
    slide = document.createElement("iframe");
    slide.className = "page-slide";
    slide.src = link.href;
    slide.tabIndex = -1;
    slide.setAttribute("aria-hidden", "true");
    slide.ready = new Promise((resolve) => slide.addEventListener("load", resolve, { once: true }));
    document.body.appendChild(slide);
    return slide;
  }

  link.addEventListener("pointerenter", prepareSlide);
  link.addEventListener("focus", prepareSlide);

  link.addEventListener("click", async (event) => {
    // Only a click on the drawn frame itself counts, not on the empty space around it
    if (window.matchMedia("(hover: hover)").matches && !link.classList.contains("is-hovered")) {
      event.preventDefault();
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || event.metaKey || event.ctrlKey) return;   // open normally

    event.preventDefault();
    const page = prepareSlide();
    await page.ready;
    page.classList.add("is-sliding");
    home.classList.add("is-leaving");     // the bar moves up to its spot on the project page
    setTimeout(() => {
      sessionStorage.setItem("page-slid-in", "yes");   // the project page doesn't need to slide again
      window.location.href = link.href;
    }, PAGE_CHANGE_TIME);
  });
});

// Coming back with the browser's back button: put the waiting page away again
window.addEventListener("pageshow", () => {
  document.querySelectorAll(".page-slide").forEach((page) => page.classList.remove("is-sliding"));
  if (home) home.classList.remove("is-leaving");
});


/* =========================================
   Going back to the home page, from any page: the home page waits (already loaded) above
   the screen and rolls down from the top over the page, while the bar glides down to its
   spot in the middle. Then the browser opens the home page, always in play view, and
   CLASSIC VIEW rolls back into the bar.
   ========================================= */
const homeLinks = document.querySelectorAll('.site-bar a[href="index.html"]');

// Close the index and the Hi page (they slide away with everything else)
function closeOverlays() {
  document.body.classList.remove("is-index-open", "is-hi-open");
  document.documentElement.classList.remove("is-index-open-page", "is-hi-open-page");
}

if (home) {
  // On the home page itself, HOME just closes what is open and goes back to play view
  homeLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeOverlays();
      setHomeView(false);
    });
  });

  // Arriving back from another page: CLASSIC VIEW already rolled in while the bar moved
  sessionStorage.removeItem("home-slid-back");
} else {
  homeLinks.forEach((link) => {
    let behind = null;

    // Load the home page above the screen (as soon as the mouse is over HOME)
    function prepareHome() {
      if (behind) return behind;
      behind = document.createElement("iframe");
      behind.className = "page-from-top";
      behind.src = link.href;
      behind.tabIndex = -1;
      behind.setAttribute("aria-hidden", "true");
      behind.ready = new Promise((resolve) => behind.addEventListener("load", resolve, { once: true }));
      document.body.appendChild(behind);
      return behind;
    }

    link.addEventListener("pointerenter", prepareHome);
    link.addEventListener("focus", prepareHome);

    link.addEventListener("click", async (event) => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion || event.metaKey || event.ctrlKey) return;   // open normally

      event.preventDefault();
      await prepareHome().ready;
      // The index closes (it is part of the bar); everything else is covered by the home page
      document.body.classList.remove("is-index-open");
      document.documentElement.classList.remove("is-index-open-page");
      document.body.classList.add("is-leaving-home");
      // CLASSIC VIEW rolls down into the bar while the bar glides to the middle
      const view = document.createElement("span");
      view.className = "site-bar__text site-bar__box site-bar__view is-word-away";
      view.style.setProperty("--x", 0);
      view.style.setProperty("--y", 35);
      makeRoll(view, "CLASSIC VIEW", "CLASSIC VIEW");
      link.closest(".site-bar").appendChild(view);
      requestAnimationFrame(() => requestAnimationFrame(() => view.classList.remove("is-word-away")));
      setTimeout(() => {
        sessionStorage.setItem("home-slid-back", "yes");
        window.location.href = link.href;
      }, PAGE_CHANGE_TIME);
    });
  });

  // Coming back with the browser's back button: put everything back
  window.addEventListener("pageshow", () => {
    document.body.classList.remove("is-leaving-home");
    document.querySelectorAll(".site-bar__view").forEach((view) => view.remove());
  });
}


/* =========================================
   Inside a waiting copy of a page (an iframe), the bar is hidden: the real page's bar
   is the one you see
   ========================================= */
if (window.frameElement) document.documentElement.classList.add("is-preview");


/* =========================================
   Project page: the page slides up when it opens (unless it already slid up over the
   home page). Inside the waiting copy on the home page, nothing moves and the bar is hidden.
   ========================================= */
if (document.body.classList.contains("project-page")) {
  if (window.frameElement) {
    document.documentElement.classList.add("is-preview");
  } else if (sessionStorage.getItem("page-slid-in")) {
    sessionStorage.removeItem("page-slid-in");
  } else {
    document.body.classList.add("is-sliding-in");
  }
}


/* =========================================
   Project page: the work arrow points left once the strip reaches the end,
   and right again once it is back at the start
   ========================================= */
document.querySelectorAll(".project-strip").forEach((strip) => {
  const work = strip.closest(".project-work");

  function updateArrow() {
    const end = strip.scrollWidth - strip.clientWidth;
    if (strip.scrollLeft >= end - 2) work.classList.add("is-at-end");
    if (strip.scrollLeft <= 2) work.classList.remove("is-at-end");
  }
  strip.addEventListener("scroll", updateArrow, { passive: true });
});


/* =========================================
   Project page: the work page gets more and more blurry while "Reach Out" slides up
   ========================================= */
document.querySelectorAll(".project-reach-blur").forEach((blur) => {
  function updateBlur() {
    const end = document.documentElement.scrollHeight - window.innerHeight;
    const progress = end > 0 ? Math.min(window.scrollY / end, 1) : 0;
    blur.style.setProperty("--reach-progress", progress);
    // Once "Reach Out" starts coming up, the work behind it stays still: the blur covers it,
    // and clicking the blur takes you back down to the work (scrolling back works too)
    document.body.classList.toggle("is-reach-open", window.scrollY > 2);
  }
  blur.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", updateBlur, { passive: true });
  window.addEventListener("resize", updateBlur);
  updateBlur();
});


/* =========================================
   Project page: the scroll arrow (the mouse) is always the same size as the flip back
   button, which grows and shrinks with the window. A mouse picture can't do that by itself,
   so its drawing is made again at the right size whenever the window changes
   ========================================= */
document.querySelectorAll(".project-work").forEach(async (work) => {
  const files = {
    right: "images/project/scroll-arrow-small.svg",
    left: "images/project/scroll-arrow-small-left.svg",
  };
  const drawings = {};
  try {
    for (const side in files) drawings[side] = await (await fetch(files[side])).text();
  } catch (error) {
    return;   // the arrow from styles.css (at its Figma size) is used instead
  }

  function sizeArrows() {
    const pixel = Math.min(window.innerWidth / 1440, window.innerHeight / 800);   // like --stage-pixel
    const width = Math.max(16, Math.round(53 * pixel));
    const height = Math.max(14, Math.round(45 * pixel));
    for (const side in drawings) {
      const svg = drawings[side].replace('width="53" height="45"', `width="${width}" height="${height}"`);
      const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${Math.round(width / 2)} ${Math.round(height / 2)}`;
      work.style.setProperty(`--scroll-arrow-${side}`, `${url}, ${side === "right" ? "e-resize" : "w-resize"}`);
    }
  }
  sizeArrows();
  window.addEventListener("resize", sizeArrows);
});


/* =========================================
   Project page: the next and previous project frames (once they are links) open that
   project the same way: its page slides up over this one, while the bar stays where it is
   ========================================= */
document.querySelectorAll("a.project-nav").forEach((link) => {
  let slide = null;

  function prepareSlide() {
    if (slide) return slide;
    slide = document.createElement("iframe");
    slide.className = "page-slide";
    slide.src = link.href;
    slide.tabIndex = -1;
    slide.setAttribute("aria-hidden", "true");
    slide.ready = new Promise((resolve) => slide.addEventListener("load", resolve, { once: true }));
    document.body.appendChild(slide);
    return slide;
  }

  link.addEventListener("pointerenter", prepareSlide);
  link.addEventListener("focus", prepareSlide);

  link.addEventListener("click", async (event) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || event.metaKey || event.ctrlKey) return;   // open normally
    event.preventDefault();
    const page = prepareSlide();
    await page.ready;
    page.classList.add("is-sliding");
    setTimeout(() => {
      sessionStorage.setItem("page-slid-in", "yes");   // the new page doesn't need to slide again
      window.location.href = link.href;
    }, PAGE_CHANGE_TIME);
  });
});


/* =========================================
   Project page: the "flip back button" swipes the strip back to the start by itself,
   speeding up and slowing down like a real swipe
   ========================================= */
document.querySelectorAll(".project-flip").forEach((button) => {
  const strip = button.closest(".project-strip");
  const FLIP_TIME = 1400;   // how long the swipe back takes (milliseconds)
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // slow, fast, slow

  button.addEventListener("click", () => {
    const from = strip.scrollLeft;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      strip.scrollLeft = 0;
      return;
    }
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / FLIP_TIME, 1);
      strip.scrollLeft = from * (1 - ease(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
});


/* =========================================
   Project page: the faster pictures ("top faster images" in Figma). While you swipe they
   move a bit faster than the rest, which gives depth. Each one is exactly in its Figma place
   when it is in the middle of the window
   ========================================= */
const FAST_EXTRA = 0.3;   // how much faster (0.3 = 30% faster than the rest)

document.querySelectorAll(".project-strip").forEach((strip) => {
  const track = strip.querySelector(".project-strip__track");
  const pieces = [...strip.querySelectorAll(".project-strip__fast-piece")].map((element) => {
    const read = (name) => parseFloat(element.style.getPropertyValue(name));
    return { element, middle: read("--x") + read("--w") / 2 };
  });
  if (!pieces.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const trackWidth = parseFloat(track.style.getPropertyValue("--w"));
  let waiting = false;

  function update() {
    waiting = false;
    const pixel = track.offsetWidth / trackWidth;   // one Figma pixel on this screen
    // The middle of the window, in Figma pixels along the strip
    const windowMiddle =
      (strip.getBoundingClientRect().left + strip.clientWidth / 2 - track.getBoundingClientRect().left) / pixel;
    pieces.forEach(({ element, middle }) => {
      element.style.setProperty("--shift", (-(windowMiddle - middle) * FAST_EXTRA).toFixed(2));
    });
  }

  function requestUpdate() {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }

  strip.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
});


/* =========================================
   Project page: click the animation to play or pause it. If the video isn't all on the
   screen, the strip glides along so the video sits in the middle (and if "Reach Out" is
   covering it, the page scrolls back up)
   ========================================= */
document.querySelectorAll(".project-video").forEach((video) => {
  const strip = video.closest(".project-strip");

  function bringIntoView() {
    const box = video.getBoundingClientRect();
    const view = strip.getBoundingClientRect();
    if (box.left < view.left || box.right > view.right) {
      const middle = box.left + box.width / 2;
      strip.scrollBy({ left: middle - (view.left + view.width / 2), behavior: "smooth" });
    }
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  video.addEventListener("click", () => {
    bringIntoView();
    if (video.paused) video.play();
    else video.pause();
  });

  // Hide the play symbol while the video plays, show it again when it stops
  video.addEventListener("play", () => video.classList.add("is-playing"));
  video.addEventListener("pause", () => video.classList.remove("is-playing"));
  video.addEventListener("ended", () => video.classList.remove("is-playing"));
});


/* =========================================
   The index (WORKS in the bar): clicking WORKS opens the list and blurs everything else.
   Clicking on the blur (or pressing Escape) closes it.
   ========================================= */
const indexButton = document.querySelector(".site-bar__index");

if (indexButton) {
  const blur = document.createElement("div");
  blur.className = "site-index-blur";
  document.body.appendChild(blur);

  function setIndexOpen(open) {
    document.body.classList.toggle("is-index-open", open);
    document.documentElement.classList.toggle("is-index-open-page", open);   // the page can't scroll
    indexButton.setAttribute("aria-expanded", open);
  }

  indexButton.addEventListener("click", () => {
    setIndexOpen(!document.body.classList.contains("is-index-open"));
  });
  blur.addEventListener("click", () => setIndexOpen(false));

  // Clicking a project in the list: the index rolls up (like clicking off it) and, at the same
  // time, the project page slides up over everything while the bar and the blur stay
  // (from the home page or from another project page). On the project you are
  // already on, the index just rolls up
  document.querySelectorAll("a.site-index__name").forEach((name) => {
    let slide = null;

    // Load the project page below the screen, ready to slide up
    function prepareSlide() {
      if (slide || name.classList.contains("is-current")) return slide;
      slide = document.createElement("iframe");
      slide.className = "page-slide";
      slide.src = name.href;
      slide.tabIndex = -1;
      slide.setAttribute("aria-hidden", "true");
      slide.ready = new Promise((resolve) => slide.addEventListener("load", resolve, { once: true }));
      document.body.appendChild(slide);
      return slide;
    }

    name.addEventListener("pointerenter", prepareSlide);
    name.addEventListener("focus", prepareSlide);

    name.addEventListener("click", async (event) => {
      if (event.metaKey || event.ctrlKey) return;   // opening in a new tab works as usual
      event.preventDefault();
      if (name.classList.contains("is-current")) return setIndexOpen(false);

      const page = prepareSlide();
      await page.ready;                                        // (usually loaded already, on hover)
      document.body.classList.add("is-opening-from-index");   // the blur stays
      if (home) home.classList.add("is-leaving");              // on the home page the bar stays at the top
      setIndexOpen(false);                                     // the index rolls up...
      page.classList.add("is-sliding");                        // ...while the project page slides up
      setTimeout(() => {
        sessionStorage.setItem("page-slid-in", "yes");         // it doesn't need to slide again
        window.location.href = name.href;
      }, PAGE_CHANGE_TIME);
    });
  });

  // Coming back with the browser's back button: put everything back
  window.addEventListener("pageshow", () => document.body.classList.remove("is-opening-from-index"));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setIndexOpen(false);
  });
}


/* =========================================
   The Hi page: clicking HI slides it up from the bottom, clicking HI again
   (or pressing Escape) slides it back down
   ========================================= */
const hiButton = document.querySelector(".site-bar__hi");
const hiPage = document.querySelector(".hi-page");

if (hiButton && hiPage) {
  function setHiOpen(open) {
    if (open) document.body.classList.remove("is-index-open");   // close the index first
    document.body.classList.toggle("is-hi-open", open);
    document.documentElement.classList.toggle("is-hi-open-page", open);
    document.documentElement.classList.toggle("is-index-open-page", false);
    hiButton.setAttribute("aria-expanded", open);
    hiPage.setAttribute("aria-hidden", !open);
  }

  hiButton.addEventListener("click", () => {
    setHiOpen(!document.body.classList.contains("is-hi-open"));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setHiOpen(false);
  });

  // "Email me" is a link: a click opens a new email straight away and also copies the address.
  // "Let's talk": a click copies the number.
  async function copy(reveal) {
    reveal.classList.add("is-showing");
    const value = reveal.querySelector(".hi-page__reveal-value").textContent;
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      // Copying isn't allowed here: it can still be selected and copied by hand
    }
  }

  hiPage.querySelectorAll(".hi-page__reveal").forEach((reveal) => {
    reveal.addEventListener("click", () => copy(reveal));
    reveal.addEventListener("mouseleave", () => reveal.classList.remove("is-showing"));
  });
}


/* =========================================
   The reload page ("reload page" in Figma): comes on when the internet goes down, or when
   nobody has touched the website for an hour. Clicking it reloads the page. It is made
   straight away (with its picture), so it can still show without internet
   ========================================= */
if (!window.frameElement) {
  const IDLE_TIME = 60 * 60 * 1000;   // one hour, in milliseconds

  const reload = document.createElement("div");
  reload.className = "reload-page";
  reload.setAttribute("role", "button");
  reload.setAttribute("aria-label", "Well shit. Maybe reload the page");
  reload.innerHTML = `
    <div class="reload-page__gradient"></div>
    <div class="reload-page__stage">
      <p class="project-title" style="--x: 604; --y: 363">WELL SHIT....</p>
      <div class="reload-page__picture"><img src="images/reload/surprised-me.gif" alt=""></div>
      <p class="project-text" style="--x: 944; --y: 758; --w: 150">Maybe reload the page...</p>
    </div>`;
  document.body.appendChild(reload);

  const show = () => document.body.classList.add("is-reload-showing");
  reload.addEventListener("click", () => window.location.reload());

  // The internet goes down (and when it comes back, the page can be reloaded)
  window.addEventListener("offline", show);

  // An hour without any mouse, keyboard, touch or scrolling
  let idle = setTimeout(show, IDLE_TIME);
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((type) => {
    window.addEventListener(type, () => {
      if (document.body.classList.contains("is-reload-showing")) return;
      clearTimeout(idle);
      idle = setTimeout(show, IDLE_TIME);
    }, { passive: true, capture: true });
  });
}


/* =========================================
   Process page: click a date tab to open or close its card
   ========================================= */
document.querySelectorAll(".card__tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const card = tab.closest(".card");
    const isOpen = card.classList.toggle("is-open");
    tab.setAttribute("aria-expanded", isOpen);
    card.querySelector(".card__content").hidden = !isOpen;
  });
});
