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
// maxMove: how far (Figma pixels) something at the edge can move
function followMouse(items, stageWidth, stageHeight, isActive, maxMove = MAX_MOVE) {
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
      if (mover.element.classList.contains("is-hovered")) return;   // stays still while the mouse is on it
      const targetX = -mouseX * 2 * maxMove * mover.strengthX;
      const targetY = -mouseY * 2 * maxMove * mover.strengthY;
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

  return { rest };
}

/* ---------- Phone: the frames drift when the phone tilts ----------
   Like the frames on the computer following the mouse: tilting the phone is like moving the
   mouse, and everything drifts slowly the other way, a little. Things further from the middle
   move more (with a bit of randomness), which gives a feeling of depth. When the phone is held
   still they glide back to their places. Gentle: no bouncing, turning or shaking */
const PHONE_MAX_MOVE = 140;   // how far (Figma pixels) something at the edge can move, at a big tilt
const TILT_SMOOTHING = 0.12; // how quickly the frames follow a change in tilt, per screen refresh (smaller = smoother)
const PHONE_FULL_TILT = 30;  // tilting this much (degrees) is like the mouse at the edge of the screen
const TILT_SETTLE = 0.01;    // how quickly the way you hold the phone becomes the "flat" position

// elements with --x --y --w --h (Figma pixels), in a frame width x height
function driftWithPhone(elements, width, height) {
  const between = (min, max) => min + Math.random() * (max - min);
  return elements.map((element) => {
    const read = (name) => parseFloat(element.style.getPropertyValue(name));
    const middleX = read("--x") + read("--w") / 2;
    const middleY = read("--y") + read("--h") / 2;
    return {
      element,
      strengthX: Math.max(0.3, Math.abs(middleX - width / 2) / (width / 2)) * between(0.5, 1.2),
      strengthY: Math.max(0.3, Math.abs(middleY - height / 2) / (height / 2)) * between(0.5, 1.2),
      x: 0, y: 0,
    };
  });
}

const swayGroups = [];   // every group of things that drifts, with its isActive()
let tiltX = 0;           // how the phone is tilted, like the mouse: from -0.5 to 0.5 (smoothed)
let tiltY = 0;
let sensorX = 0;         // the tilt as the phone's sensor last said it (it comes in small jumps)
let sensorY = 0;
// Tilting further and further only ever brings a frame softly towards its furthest point: it
// never stops dead there (that looked like the frames bouncing off a wall)
const softLimit = (value) => 0.5 * Math.tanh(value * 2);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const phoneFrames = [...document.querySelectorAll(".phone-frame")];
const phoneDoodles = [...document.querySelectorAll(".phone-doodle:not(.phone-doodle--still)")];

if (!reducedMotion && phoneFrames.length) {
  swayGroups.push({
    items: driftWithPhone(phoneFrames, 390, 844),   // the home page ("phone home playful", 390 x 844)
    // only after they came out, and not behind WORKS or HI
    isActive: () => phoneFrames[0].closest(".phone-home").classList.contains("is-playful") &&
                    !document.body.matches(".is-phone-works-open, .is-phone-hi-open, .is-phone-reach-open"),
  });
}

if (!reducedMotion && phoneDoodles.length) {
  swayGroups.push({
    items: driftWithPhone(phoneDoodles, 390, 844),
    isActive: () => document.body.classList.contains("is-phone-hi-open"),
  });
}

// Every screen refresh: each one moves a small step towards where it should be (like on the computer)
let lastStep = performance.now();
function swayStep(now) {
  const steps = Math.min((now - lastStep) / 16.7, 3);   // about 1 per screen refresh
  lastStep = now;
  const ease = 1 - Math.pow(1 - EASING, steps);
  // The sensor's little jumps are smoothed out first, so even a quick tilt glides
  const follow = 1 - Math.pow(1 - TILT_SMOOTHING, steps);
  tiltX += (sensorX - tiltX) * follow;
  tiltY += (sensorY - tiltY) * follow;

  swayGroups.forEach(({ items, isActive }) => {
    const active = isActive();
    items.forEach((item) => {
      const targetX = active ? -tiltX * 2 * PHONE_MAX_MOVE * item.strengthX : 0;
      const targetY = active ? -tiltY * 2 * PHONE_MAX_MOVE * item.strengthY : 0;
      item.x += (targetX - item.x) * ease;
      item.y += (targetY - item.y) * ease;
      item.element.style.setProperty("--move-x", item.x.toFixed(2));
      item.element.style.setProperty("--move-y", item.y.toFixed(2));
    });
  });

  requestAnimationFrame(swayStep);
}

if (swayGroups.length) {
  // Tilting: side to side counts from upright; forwards and backwards count from the way you
  // usually hold it (which slowly becomes the new "flat")
  let usualForwards = null;
  window.addEventListener("deviceorientation", (event) => {
    if (event.gamma === null || event.beta === null) return;   // no tilt sensor
    if (usualForwards === null) usualForwards = event.beta;
    usualForwards += (event.beta - usualForwards) * TILT_SETTLE;
    const nextX = softLimit(event.gamma / PHONE_FULL_TILT / 2);
    const nextY = softLimit((event.beta - usualForwards) / PHONE_FULL_TILT / 2);
    // A phone held almost upright sometimes says it flipped from one side right over to the
    // other in an instant: that isn't a real tilt, so it's left out
    if (Math.abs(nextX - sensorX) > 0.6 || Math.abs(nextY - sensorY) > 0.6) return;
    sensorX = nextX;
    sensorY = nextY;
  });

  // iPhones only share the tilt after asking ("Allow motion and orientation access?"),
  // and only right after a tap, so they ask on the first tap on the screen
  if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
    document.addEventListener("touchend", () => {
      DeviceOrientationEvent.requestPermission().catch(() => {});
    }, { once: true });
  }

  requestAnimationFrame(swayStep);
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
    ).rest;
  }

  // The drawings on the Hi page ("Hi page" is 1440 x 800). Each drawing moves with its text.
  // The picture of me stays still
  const doodles = [...document.querySelectorAll(".hi-doodle:not(.hi-doodle--me)")];

  // Hovering over a drawing: it changes to its hover drawing, shows its text and stops moving
  // (so it doesn't slide out from under the mouse). It stays like that until the mouse leaves
  // both the drawing and its hover drawing
  doodles.forEach((doodle) => {
    const pictures = [...doodle.querySelectorAll(".hi-doodle__picture")];
    const normal = pictures.find((picture) => !picture.classList.contains("hi-doodle__picture--hover"));
    normal.addEventListener("pointerenter", () => doodle.classList.add("is-hovered"));
    pictures.forEach((picture) => {
      picture.addEventListener("pointerleave", (event) => {
        if (!pictures.some((other) => other.contains(event.relatedTarget))) doodle.classList.remove("is-hovered");
      });
    });
  });

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
const COPIED_TIME = 2500;   // how long "Copied" stays before it rolls back down (milliseconds)

// The email address and phone number (Reach Out, and "Email me" and "Let's talk" on the Hi page):
// a third word, "Copied", waits under the others. Clicking copies and rolls up to it
function addCopiedWord(element) {
  const track = element.querySelector(".roll__track");
  if (!track || track.querySelector(".roll__word--copied")) return;
  const word = document.createElement("span");
  word.className = "roll__word roll__word--copied";
  word.setAttribute("aria-hidden", "true");
  word.textContent = "Copied";
  track.append(word);
}

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

// Rolls a word in the bar on to another word: the word moves up and out, and the new word
// (plain, not italic) comes up from below. Used for the white spot in the bar when changing
// pages: CLASSIC VIEW rolls on to PROCESS leaving the home page, and PROCESS rolls on to
// CLASSIC VIEW going back home
function rollBarWord(element, text) {
  const track = element.querySelector(".roll__track");
  if (!track) return;
  element.style.pointerEvents = "none";
  const shifted = getComputedStyle(track).transform !== "none";   // already rolled up one word
  let word;
  if (shifted) {
    // The italic word is showing (or the word already rolled away): the new word waits one further down
    word = document.createElement("span");
    word.className = "roll__word roll__word--next roll__word--after";
    track.append(word);
  } else {
    word = track.querySelector(".roll__word--next");
  }
  word.textContent = text;
  word.style.fontStyle = "normal";
  word.style.visibility = "visible";
  word.style.transition = "none";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    track.style.transform = `translateY(calc(${shifted ? -2 : -1}em * var(--roll-line)))`;
  }));
  // Once it has rolled, the word is drawn again exactly the way the next page draws it (not
  // rolled), so nothing twitches when the next page takes over
  track.addEventListener("transitionend", () => {
    makeRoll(element, text, text);
    // Locked plain, like on the next page (on the process page PROCESS would otherwise roll to italic)
    const fresh = element.querySelector(".roll__track");
    fresh.style.transition = "none";
    fresh.style.transform = "none";
  }, { once: true });
}

// The same word again, in italic (or the word in data-roll-next): HOME, WORKS, HI, the names in the list,
// and the links on Reach Out and the Hi page (Instagram, the email address, the phone number)
[
  [".site-bar__text:not(.site-bar__view)", "center"],

  [".site-index__name:not(.site-index__name--soon)", "start"],   // projects that aren't ready stay still
  [".project-text--email", "start"],
].forEach(([selector, align]) => {
  document.querySelectorAll(selector).forEach((element) => {
    if (element.querySelector(":scope > .roll")) return;   // already written rolled in the page (the bar)
    const word = element.textContent.trim();
    makeRoll(element, word, element.dataset.rollNext || word, align);   // data-roll-next: a different next word
    if (element.classList.contains("project-reach__copy")) addCopiedWord(element);
  });
});

/* Reach Out: clicking the email address copies it instead of opening an email.
   The phone number works the same way (on the computer a phone link would only open FaceTime;
   the phone version of the page still calls the number).
   It rolls up to "Copied" (black Instrument Serif italic, the same size), like the other words.
   It rolls back down when one of the other links is clicked (the email, the phone number or
   Instagram), and it's gone whenever Reach Out is opened again */
document.querySelectorAll(".project-reach__copy").forEach((link) => {
  const reach = link.closest(".project-reach");

  link.addEventListener("mousedown", (event) => event.preventDefault());   // no text selection
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    window.getSelection().removeAllRanges();
    const value = link.getAttribute("aria-label");   // the address or number, as it's written on the page
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      // Copying isn't allowed here: it can still be selected and copied by hand
    }
    link.classList.add("is-copied");
    // "Copied" rolls back down after a few seconds
    clearTimeout(link.copiedTimer);
    link.copiedTimer = setTimeout(() => link.classList.remove("is-copied"), COPIED_TIME);
  });

  // Clicking one of the other links (email, phone number, Instagram) rolls this label back down
  reach.querySelectorAll(".project-text--email").forEach((other) => {
    if (other !== link) other.addEventListener("click", () => link.classList.remove("is-copied"));
  });

  // Once Reach Out is all the way down again, the label is gone (without rolling),
  // so it's never there when Reach Out comes back up
  window.addEventListener("scroll", () => {
    if (window.scrollY <= 2 && link.classList.contains("is-copied")) {
      link.classList.add("is-resetting");
      link.classList.remove("is-copied");
      requestAnimationFrame(() => requestAnimationFrame(() => link.classList.remove("is-resetting")));
    }
  }, { passive: true });
});

// "EMAIL ME" and "LET'S TALK" on the Hi page roll to the email address and the phone number
document.querySelectorAll(".hi-page__reveal").forEach((reveal) => {
  const label = reveal.querySelector(".hi-page__reveal-label").textContent.trim();
  const value = reveal.querySelector(".hi-page__reveal-value").textContent.trim();
  const align = reveal.classList.contains("hi-page__reveal--right") ? "end" : "start";
  makeRoll(reveal, label, value, align, "hi-page__reveal-value");
  addCopiedWord(reveal);
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

  // quiet: only change the words, without building the button again, so a roll that is
  // already moving (PROCESS rolling away, CLASSIC VIEW rolling back) carries on smoothly
  function setClassic(classic, quiet = false) {
    clearTimeout(rolling);
    home.classList.toggle("is-classic", classic);
    if (quiet && button.querySelector(".roll__track:not([style])")) {
      button.querySelectorAll(".roll__word").forEach((word) => { word.textContent = label(classic); });
    } else {
      makeRoll(button, label(classic), label(classic));
    }
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

  setClassic(false, true);   // the words are already in the page: only set the rest
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

// Only one page change at a time: once a click has started going to another page, more clicks
// (on PROCESS, WORKS, a frame...) do nothing until the new page is there
let changingPage = false;
function startPageChange(clicked) {
  if (changingPage) return false;
  changingPage = true;
  // The word you clicked (PROCESS, a name in the list...) stays in italic: nothing can be hovered
  // any more while the page changes, and it shouldn't roll back to plain and then to italic again
  const track = clicked && clicked.querySelector(":scope > .roll .roll__track");
  if (track && getComputedStyle(track).transform !== "none") {
    track.style.transition = "none";
    track.style.transform = getComputedStyle(track).transform;
  }
  document.body.classList.add("is-changing-page");
  return true;
}
window.addEventListener("pageshow", () => {
  changingPage = false;
  document.body.classList.remove("is-changing-page");
});

// Waits for the waiting copy of the next page to be loaded, but only a very short moment:
// then the page slides in anyway (so a click always does something straight away)
function pageReady(page) {
  return Promise.race([page.ready, new Promise((resolve) => setTimeout(resolve, 200))]);
}

// Runs `then` once the bar has really finished gliding (and that last spot is on the screen),
// so the next page takes over from the bar exactly where it stops. (A timer alone could go off
// a moment before the bar's last tiny step, and then the words jumped a tiny bit)
function whenBarArrives(bar, then) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    requestAnimationFrame(() => requestAnimationFrame(then));
  };
  bar.addEventListener("transitionend", (event) => {
    if (event.target === bar && event.propertyName === "transform") finish();
  });
  setTimeout(finish, PAGE_CHANGE_TIME + 250);   // just in case
}

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
    if (!startPageChange()) return;
    const page = prepareSlide();
    await pageReady(page);
    page.classList.add("is-sliding");
    home.classList.add("is-leaving");     // the bar moves up to its spot on the project page
    whenBarArrives(home.querySelector(".site-bar"), () => {
      sessionStorage.setItem("page-slid-in", "yes");   // the project page doesn't need to slide again
      window.location.href = link.href;
    });
  });
});

// Coming back with the browser's back button: put the waiting page away again
window.addEventListener("pageshow", (event) => {
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
      setHomeView(false, true);
    });
  });

  // Arriving back from another page: CLASSIC VIEW already rolled in while the bar moved
  sessionStorage.removeItem("home-slid-back");

  // Opening or refreshing the home page: the frames jump out from behind the bar, one after
  // the other (like on the phone), once the page has loaded and has been there a moment
  if (document.documentElement.classList.contains("is-home-intro")) {
    home.querySelectorAll(".home__frames .home-frame").forEach((frame, index) => frame.style.setProperty("--order", index));
    const openedAt = performance.now();
    const HOME_INTRO_WAIT = 700;   // the bar shows alone this long first (milliseconds)
    const jumpOut = () => {
      setTimeout(() => document.documentElement.classList.remove("is-home-intro"),
        Math.max(0, HOME_INTRO_WAIT - (performance.now() - openedAt)));
    };
    if (document.readyState === "complete") jumpOut();
    else window.addEventListener("load", jumpOut, { once: true });
  }
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
      if (!startPageChange(link)) return;
      await pageReady(prepareHome());
      // The index closes (it is part of the bar); everything else is covered by the home page
      document.body.classList.remove("is-index-open");
      document.documentElement.classList.remove("is-index-open-page");
      document.body.classList.add("is-leaving-home");
      // PROCESS rolls on to CLASSIC VIEW while the bar glides to the middle
      link.closest(".site-bar").querySelectorAll(".site-bar__process").forEach((process) => rollBarWord(process, "CLASSIC VIEW"));
      whenBarArrives(link.closest(".site-bar"), () => {
        sessionStorage.setItem("home-slid-back", "yes");
        window.location.href = link.href;
      });
    });
  });

  // Coming back with the browser's back button: put everything back
  window.addEventListener("pageshow", (event) => {
    document.body.classList.remove("is-leaving-home");
    if (event.persisted) window.location.reload();   // the bar's words were rolled on: start fresh
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


// Is this scroll from a mouse wheel (not a trackpad)? Trackpads send a smooth stream of pixel
// steps, and in Chrome and Safari their old-style "wheelDeltaY" is exactly -3 times the step.
// A mouse wheel's isn't (or it scrolls by lines)
function isMouseWheel(event) {
  if (event.deltaMode !== 0) return true;
  // (allowing for rounding: trackpads often send steps like 4.5, which then don't match exactly)
  if (event.wheelDeltaY) return Math.abs(event.wheelDeltaY + event.deltaY * 3) > 3;
  if (event.wheelDeltaX) return Math.abs(event.wheelDeltaX + event.deltaX * 3) > 3;
  return false;
}


/* =========================================
   Project page (computer): the left and right arrow keys move the strip left and right
   ========================================= */
document.querySelectorAll(".project-strip").forEach((strip) => {
  window.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (!strip.offsetWidth) return;                                 // the phone version is showing
    if (event.altKey || event.metaKey || event.ctrlKey) return;     // keep the browser's own shortcuts
    if (document.body.matches(".is-index-open, .is-hi-open")) return;
    if (window.scrollY > 2) return;                                 // Reach Out is open
    event.preventDefault();
    const step = window.innerWidth * 0.4;
    strip.scrollBy({ left: event.key === "ArrowRight" ? step : -step, behavior: "smooth" });
  });
});


/* =========================================
   Project page (computer): scrolling moves along one path: first the strip sideways, then
   "Reach Out" up from the bottom (and the same way back). Down (or a swipe to the right) goes
   forwards; with a mouse wheel it's the other way round (see above).

   It works swipe by swipe:
   - A swipe is everything from the moment the fingers start until the trackpad has finished
     gliding (or one turn of a mouse wheel). Whether it's a mouse or a trackpad, and whether the
     swipe is sideways or up-down, is decided for the whole swipe, so it never changes halfway
     (that made Reach Out shake).
   - Once Reach Out is all the way up, swiping on does nothing: it stays still.
   - A swipe that brings Reach Out all the way down stops there, however big it is: the
     project only starts moving back with the next swipe
   ========================================= */
document.querySelectorAll(".project-strip").forEach((strip) => {
  let swipe = null;
  let lastWheelAt = -Infinity;

  // Is this the start of a new swipe? After a pause, or when the movement turns the other way,
  // or when the trackpad's gliding had slowed right down and then the fingers swipe again
  function isNewSwipe(event, size, sign) {
    if (!swipe) return true;
    if (event.timeStamp - lastWheelAt > 180) return true;
    if (sign && swipe.sign && sign !== swipe.sign && size >= 4) return true;
    if (swipe.slowedDown && size >= 12 && size > swipe.slowest * 3) return true;
    return false;
  }

  window.addEventListener("wheel", (event) => {
    if (!strip.offsetWidth) return;                                 // the phone version is showing
    if (event.ctrlKey) return;                                      // zooming with the trackpad
    // WORKS or HI is open: the page underneath stays frozen until it's closed
    if (document.body.matches(".is-index-open, .is-hi-open")) {
      event.preventDefault();
      return;
    }
    event.preventDefault();

    const lines = event.deltaMode === 1 ? 40 : 1;                   // some mice count in lines
    const dx = event.deltaX * lines;
    const dy = event.deltaY * lines;
    const size = Math.max(Math.abs(dx), Math.abs(dy));
    if (!size) return;

    if (isNewSwipe(event, size, 0)) {
      swipe = { mouse: isMouseWheel(event), sideways: 0, upDown: 0, sign: 0, fastest: size, slowest: size, slowedDown: false, closedReach: false };
    }
    lastWheelAt = event.timeStamp;
    swipe.sideways += Math.abs(dx);
    swipe.upDown += Math.abs(dy);
    // Forwards or backwards along the path
    let amount = swipe.sideways > swipe.upDown ? dx : (swipe.mouse ? -dy : dy);
    const sign = Math.sign(amount);
    if (swipe.sign && sign && sign !== swipe.sign && size >= 4) {
      // turned the other way: that's a new swipe
      swipe = { mouse: swipe.mouse, sideways: Math.abs(dx), upDown: Math.abs(dy), sign: 0, fastest: size, slowest: size, slowedDown: false, closedReach: false };
      amount = swipe.sideways > swipe.upDown ? dx : (swipe.mouse ? -dy : dy);
    }
    if (!swipe.sign) swipe.sign = Math.sign(amount);
    swipe.fastest = Math.max(swipe.fastest, size);
    swipe.slowest = Math.min(swipe.slowest, size);
    if (size <= Math.max(2, swipe.fastest * 0.2)) swipe.slowedDown = true;
    if (!amount) return;
    const smooth = swipe.mouse || Math.abs(amount) >= 50;           // a mouse moves in big steps, so it glides

    const end = strip.scrollWidth - strip.clientWidth;
    const reachUp = window.scrollY > 2;
    // The Reach Out part of the path
    if (reachUp || (amount > 0 && strip.scrollLeft >= end - 2)) {
      if (amount < 0 && window.scrollY + amount * (smooth ? 1.5 : 1) <= 2) {
        window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "instant" });   // all the way down: the swipe stops here
        swipe.closedReach = true;
        return;
      }
      if (swipe.closedReach) return;
      window.scrollBy({ top: amount * (smooth ? 1.5 : 1), behavior: smooth ? "smooth" : "instant" });
      return;
    }
    // The strip part of the path (not in the swipe that just brought Reach Out down)
    if (swipe.closedReach) return;
    if (smooth) strip.scrollBy({ left: amount * 1.5, behavior: "smooth" });
    else strip.scrollLeft += amount;
  }, { passive: false });
});


/* =========================================
   Project page: the work page gets more and more blurry while "Reach Out" slides up
   ========================================= */
document.querySelectorAll(".project-reach-blur").forEach((blur) => {
  const work = document.querySelector(".project-work");
  function updateBlur() {
    const end = document.documentElement.scrollHeight - window.innerHeight;
    const progress = end > 0 ? Math.min(window.scrollY / end, 1) : 0;
    work.style.setProperty("--reach-progress", progress);   // how blurry the work page is
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
   Project page (computer): refreshing the page keeps you where you were. The strip stays at
   the same place, and "Reach Out" is only up if it was up before. (The browser's own way of
   doing this got it wrong and brought "Reach Out" up.) Coming to the page from another page,
   it starts at the beginning as usual
   ========================================= */
document.querySelectorAll(".project-strip").forEach((strip) => {
  if (!strip.offsetWidth) return;   // the phone version is showing
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const key = `place:${location.pathname}`;

  // Just before the page goes away (refresh, or going to another page): remember the place
  window.addEventListener("pagehide", () => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ strip: strip.scrollLeft, reach: window.scrollY > 2 }));
    } catch (error) {
      // Can't remember it here (private window): a refresh starts at the beginning
    }
  });

  let place = null;
  const navigation = performance.getEntriesByType("navigation")[0];
  if (navigation && navigation.type === "reload") {
    try {
      place = JSON.parse(sessionStorage.getItem(key));
    } catch (error) {
      place = null;
    }
  }
  strip.scrollLeft = place ? place.strip : 0;
  window.scrollTo(0, place && place.reach ? document.documentElement.scrollHeight : 0);
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
    // Over the pictures and videos: the same arrow, just the outline (no white inside)
    "right-outline": "images/project/scroll-arrow-small-outline.svg",
    "left-outline": "images/project/scroll-arrow-small-left-outline.svg",
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
      work.style.setProperty(`--scroll-arrow-${side}`, `${url}, ${side.startsWith("right") ? "e-resize" : "w-resize"}`);
    }
  }
  sizeArrows();
  window.addEventListener("resize", sizeArrows);
});


/* =========================================
   Project page: the next and previous project frames (once they are links) open that
   project the same way: its page slides up over this one, while the bar stays where it is
   ========================================= */
// The next/previous project frames, and PROCESS in the bar (not on the process page itself)
document.querySelectorAll("a.project-nav, a.site-bar__process").forEach((link) => {
  if (link.classList.contains("site-bar__process") && document.body.classList.contains("process-page")) {
    // Already here: clicking it closes WORKS or HI, so you see the process page again
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeOverlays();
    });
    return;
  }
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
  // PROCESS: the process page gets ready out of sight soon after this page has opened,
  // so clicking it slides the process page up straight away
  if (link.classList.contains("site-bar__process") && !window.frameElement) {
    if (document.readyState === "complete") prepareSlide();
    else window.addEventListener("load", prepareSlide, { once: true });
  }

  link.addEventListener("click", async (event) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || event.metaKey || event.ctrlKey) return;   // open normally
    event.preventDefault();
    if (!startPageChange(link)) return;
    if (home) {
      // Home page: the bar stays at the top (PROCESS too) and WORKS rolls up while the page slides up
      home.classList.add("is-leaving");
      document.body.classList.remove("is-index-open");
      document.documentElement.classList.remove("is-index-open-page");
    } else {
      closeOverlays();   // other pages: WORKS or HI rolls away while the page slides up
    }
    const page = prepareSlide();
    await pageReady(page);
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
      if (!startPageChange(name)) return;

      const page = prepareSlide();
      await pageReady(page);                                   // (usually loaded already, on hover)
      document.body.classList.add("is-opening-from-index");   // the blur stays
      if (home) {
        home.classList.add("is-leaving");                       // on the home page the bar stays at the top
      }
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
    // Closing the Hi page: a COPIED label goes away at once, so it's not there next time
    if (!open) {
      hiPage.querySelectorAll(".hi-page__reveal.is-copied").forEach((reveal) => {
        reveal.classList.add("is-resetting");
        reveal.classList.remove("is-copied");
        requestAnimationFrame(() => requestAnimationFrame(() => reveal.classList.remove("is-resetting")));
      });
    }
  }

  hiButton.addEventListener("click", () => {
    // WORKS is open over the Hi page: HI just closes WORKS, so you see the Hi page again
    if (document.body.classList.contains("is-hi-open") && document.body.classList.contains("is-index-open")) {
      document.body.classList.remove("is-index-open");
      document.documentElement.classList.remove("is-index-open-page");
      document.querySelectorAll(".site-bar__index").forEach((button) => button.setAttribute("aria-expanded", false));
      return;
    }
    setHiOpen(!document.body.classList.contains("is-hi-open"));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setHiOpen(false);
  });

  // "Email me" and "Let's talk": a click copies the email address or the phone number
  // (instead of opening an email or FaceTime), and it rolls up to "Copied", like on Reach Out.
  // It stays until something else is clicked
  async function copy(reveal) {
    reveal.classList.add("is-showing");
    const value = reveal.querySelector(".hi-page__reveal-value").textContent;
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      // Copying isn't allowed here: it can still be selected and copied by hand
    }
    reveal.classList.add("is-copied");
    window.getSelection().removeAllRanges();   // no blue "selected" highlight
    // "Copied" rolls back down after a few seconds
    clearTimeout(reveal.copiedTimer);
    reveal.copiedTimer = setTimeout(() => reveal.classList.remove("is-copied"), COPIED_TIME);
  }

  const reveals = [...hiPage.querySelectorAll(".hi-page__reveal")];
  reveals.forEach((reveal) => {
    reveal.addEventListener("mousedown", (event) => event.preventDefault());   // no text selection
    reveal.addEventListener("click", (event) => {
      event.preventDefault();
      copy(reveal);
    });
    reveal.addEventListener("mouseleave", () => reveal.classList.remove("is-showing"));
  });

  // A click anywhere else rolls the label back down
  document.addEventListener("click", (event) => {
    reveals.forEach((reveal) => {
      if (!reveal.contains(event.target)) reveal.classList.remove("is-copied");
    });
  });
}


/* =========================================
   Process page: click a date tab to open or close its card
   ========================================= */
// Process page: clicking a card's top bar unrolls the rest of the card (styles.css), clicking again rolls it up
document.querySelectorAll(".process-card__tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const card = tab.closest(".process-card");
    const isOpen = card.classList.toggle("is-open");
    tab.setAttribute("aria-expanded", isOpen);
    card.querySelector(".process-card__content").setAttribute("aria-hidden", !isOpen);
    // The videos play only while the card is open, and always from the start: opening, they
    // start again from the beginning; closing, they stop and go back to the start once the
    // card has rolled up
    clearTimeout(card.videoReset);
    const videos = card.querySelectorAll("video");
    if (isOpen) {
      // (always without sound: the videos are silent, and kept muted to be sure)
      videos.forEach((video) => { video.muted = true; video.currentTime = 0; video.play().catch(() => {}); });
    } else {
      card.videoReset = setTimeout(() => {
        videos.forEach((video) => { video.pause(); video.currentTime = 0; });
      }, 700);   // --index-open-time in styles.css
    }
  });
  // The rest of the card's top bar opens it too
  tab.closest(".process-card").querySelector(".process-card__head").addEventListener("click", () => tab.click());
});


/* ---------- Phone home page ----------
   It starts blank (only the bar), like a loading page. A second after the page opens,
   the frames jump out from behind the bar ("phone home playful" in Figma) */
const phoneHome = document.querySelector('.phone-home');
const PHONE_WAIT = 1000;   // how long the blank page shows (milliseconds)

// Each frame changes from its gradient drawing to its work once it lands in its place
// (when its jump ends; FRAME_LAND_WAIT in case the browser never says so)
const FRAME_LAND_WAIT = 2500;
const GRADIENT_STAY = 200;   // how long a frame keeps its gradient after it lands (milliseconds)
function landFramesNow() {
  phoneHome.querySelectorAll(".phone-frame").forEach((frame) => frame.classList.add("is-arrived"));
}
if (phoneHome) {
  phoneHome.querySelectorAll(".phone-frame").forEach((frame) => {
    frame.addEventListener("transitionend", (event) => {
      if (event.target === frame && event.propertyName === "transform" && phoneHome.classList.contains("is-playful")) {
        setTimeout(() => frame.classList.add("is-arrived"), GRADIENT_STAY);
      }
    });
  });
}

if (phoneHome && window.frameElement) {
  // A waiting copy of the home page (rolling down from the top): the frames are already out
  phoneHome.classList.add("is-instant", "is-playful");
  landFramesNow();
} else if (phoneHome) {
  const openedAt = performance.now();

  // Waits until the frames' own pictures have loaded (not the rest of the page: the Hi page,
  // the works list...), but never less than a second after opening
  let started = false;
  function startFrames() {
    if (started) return;
    started = true;
    const waitLeft = Math.max(0, PHONE_WAIT - (performance.now() - openedAt));
    setTimeout(function () {
      phoneHome.classList.add('is-playful');
      setTimeout(landFramesNow, FRAME_LAND_WAIT);
    }, waitLeft);
  }
  const framePictures = [...phoneHome.querySelectorAll(".phone-home__frames img")];
  Promise.all(framePictures.map((img) => (img.complete ? null : new Promise((done) => {
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  })))).then(startFrames);
  window.addEventListener('load', startFrames);   // (just in case)
}


/* ---------- Phone home page: the work frames ----------
   They always show their work (their hover picture, the same one as on the computer, copied
   from the computer frame named in data-hover). Tapping one opens the project (data-href),
   once the phone version of that project exists */
const phoneWorkFrames = [...document.querySelectorAll(".phone-frame[data-hover]")];
const PHONE_ROLL_WAIT = 750;         // a tapped name in WORKS rolls to italic (0.45s) and stays a moment before the list closes
let phoneChanging = false;           // a page change has started (more taps do nothing)

phoneWorkFrames.forEach((frame) => {
  const computerImage = document.querySelector(`.home-frame__image[src="${frame.dataset.hover}"]`);
  const hover = computerImage && computerImage.parentElement.querySelector(".home-frame__hover");
  if (hover && !frame.querySelector(".home-frame__hover")) frame.append(hover.cloneNode(true));   // (usually already in the page)

  // A tap opens the project
  frame.addEventListener("click", () => {
    if (frame.dataset.href && phoneHome.classList.contains("is-playful") && !phoneChanging) {
      phoneChanging = true;
      phoneOpenProject(frame.dataset.href);
    }
  });
});

// Scrolling the home page: the work frames ("phone home over") move a bit faster than the
// drawings under them (FAST_EXTRA, like the fast pictures on a project page). Each one is
// exactly in its Figma place when it is in the middle of the screen; the ones at the very top
// are in their place when the page starts, and the ones at the very bottom when it ends
const phoneHomeScroller = document.querySelector(".phone-home__scroll");

if (phoneHomeScroller && !reducedMotion) {
  const fastFrames = [...document.querySelectorAll(".phone-frame--over")].map((element) => {
    const read = (name) => parseFloat(element.style.getPropertyValue(name));
    return { element, middle: read("--y") - 49 + read("--h") / 2 };   // from the top of the page (it starts at y 49)
  });

  let waiting = false;

  function updateShift() {
    waiting = false;
    const pixel = window.innerWidth / 390;   // one Figma pixel on this screen
    if (!phoneHomeScroller.offsetHeight) return;   // the phone version is hidden (a computer)
    const scrolled = phoneHomeScroller.scrollTop / pixel;   // in Figma pixels
    const furthest = (phoneHomeScroller.scrollHeight - phoneHomeScroller.clientHeight) / pixel;
    const halfScreen = phoneHomeScroller.clientHeight / 2 / pixel;
    fastFrames.forEach(({ element, middle }) => {
      // How far down the page is when this frame is in its Figma place
      const inPlace = Math.max(0, Math.min(furthest, middle - halfScreen));
      element.style.setProperty("--shift", (-(scrolled - inPlace) * FAST_EXTRA).toFixed(2));
    });
  }

  function requestShift() {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(updateShift);
    }
  }

  phoneHomeScroller.addEventListener("scroll", requestShift, { passive: true });
  window.addEventListener("resize", requestShift);
  updateShift();
}


/* =========================================
   Phone project page. There is no hover on a phone, so the pause play symbol and the
   flip back arrow turn orange for a moment when tapped, and then do their thing
   ========================================= */
const PHONE_TAP_TIME = 250;   // how long they stay orange (milliseconds), like --phone-tap-time

// Shows the orange version for a moment, then runs whenDone
function flashOrange(element, whenDone) {
  element.classList.add("is-tapped");
  setTimeout(() => {
    element.classList.remove("is-tapped");
    whenDone();
  }, PHONE_TAP_TIME);
}

// The box a phone page scrolls in. A project page scrolls like a normal web page (the whole
// window, so Safari's search bar gets small and the page shows behind it); others scroll in a box
function phoneScrollerOf(element) {
  const box = element.closest(".phone-scroll");
  if (!box || getComputedStyle(box).overflowY === "visible") return document.scrollingElement;
  return box;
}
// What to listen to for scrolling, and how much of the page shows at once
const scrollTarget = (scroller) => (scroller === document.scrollingElement ? window : scroller);
const scrollerView = (scroller) => (scroller === document.scrollingElement ? window.innerHeight : scroller.clientHeight);

// The video: tap to play or pause. If it isn't all on the screen, the page glides so it sits in the middle
document.querySelectorAll(".phone-video").forEach((video) => {
  const scroller = phoneScrollerOf(video);
  video.addEventListener("click", () => {
    const box = video.getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) {
      scroller.scrollBy({ top: box.top + box.height / 2 - window.innerHeight / 2, behavior: "smooth" });
    }
    if (video.paused) flashOrange(video, () => video.play());
    else video.pause();
  });

  // Hide the symbol while the video plays, show it again when it stops
  video.addEventListener("play", () => video.classList.add("is-playing"));
  video.addEventListener("pause", () => video.classList.remove("is-playing"));
  video.addEventListener("ended", () => video.classList.remove("is-playing"));
});

// The flip back button: glides back up to the top, speeding up and slowing down (like on the computer)
document.querySelectorAll(".phone-flip").forEach((button) => {
  const scroller = phoneScrollerOf(button);
  const FLIP_TIME = 1400;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // slow, fast, slow

  button.addEventListener("click", () => {
    flashOrange(button, () => {
      const from = scroller.scrollTop;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        scroller.scrollTop = 0;
        return;
      }
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / FLIP_TIME, 1);
        scroller.scrollTop = from * (1 - ease(t));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  });
});

// The faster pictures: while you scroll they move a bit faster than the rest (FAST_EXTRA, like on
// the computer). Each one is exactly in its Figma place when it is in the middle of the screen
document.querySelectorAll(".phone-project").forEach((page) => {
  const pieces = [...page.querySelectorAll(".phone-fast-piece")].map((element) => {
    const read = (name) => parseFloat(element.style.getPropertyValue(name));
    return { element, middle: read("--y") + read("--h") / 2 };
  });
  if (!pieces.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let waiting = false;

  function update() {
    waiting = false;
    const pixel = page.offsetWidth / 390;   // one Figma pixel on this screen
    if (!pixel) return;                       // the phone version is hidden (a computer)
    // The middle of the screen, in Figma pixels down the page
    const screenMiddle = (window.innerHeight / 2 - page.getBoundingClientRect().top) / pixel;
    pieces.forEach(({ element, middle }) => {
      element.style.setProperty("--shift", (-(screenMiddle - middle) * FAST_EXTRA).toFixed(2));
    });
  }

  function requestUpdate() {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }

  scrollTarget(phoneScrollerOf(page)).addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  document.body.addEventListener("animationend", requestUpdate);   // after the page has slid up
  update();
});


/* =========================================
   Phone: moving between pages. Like on the computer, the bar glides between the middle of
   the home page and the top of the screen while the pages slide:
   - a project slides up from the bottom (from a frame or from WORKS)
   - HOME: the home page rolls down from the top
   - WORKS: the bar goes up and the list opens under it
   - HI: the Hi page slides up under the bar
   Closing WORKS or HI on the home page brings the bar back down to the middle
   ========================================= */
const phoneBar = document.querySelector(".phone-bar");
const isPhoneHome = Boolean(document.querySelector(".phone-home"));
const PHONE_TOP = 49;        // like --phone-top in styles.css
const PHONE_HOME_TOP = 0;    // like --phone-home-top
const PHONE_BAR_MIDDLE = 796;   // like --phone-bar-middle (the middle of the home bar in Figma)
const INDEX_OPEN_TIME = 700;     // like --index-open-time (the WORKS list rolling up or down)

// The bar's height in Figma ("phone bar", 354 × 36 on every page)
const BAR_HEIGHT = 36;
const PHONE_BAR_TOP = 20;   // like --phone-bar-top: its top edge when it is at the top of the screen

// Where the top edge of the bar is (screen pixels) in a spot: "top" (20 from the top of the
// screen, "phone works placement" in Figma, on every page) or "middle" (the home page: its middle at y 796, at the bottom)
// The height of the screen without the phone's search bar (100svh in styles.css)
const screenProbe = document.createElement("div");
screenProbe.style.cssText = "position: fixed; top: 0; height: 100svh; width: 0; visibility: hidden; pointer-events: none";
document.documentElement.appendChild(screenProbe);

function phoneBarTop(where) {
  const page = window.innerWidth / 390;   // one Figma pixel on a phone page
  if (where === "top") return PHONE_BAR_TOP * page;
  // The home page fits the screen: up and down it uses a slightly smaller pixel on short phones
  // (like --phone-fit-pixel in styles.css)
  const fit = Math.min(page, screenProbe.offsetHeight / (844 - PHONE_HOME_TOP));
  return (PHONE_BAR_MIDDLE - PHONE_HOME_TOP) * fit - BAR_HEIGHT / 2 * page;
}

// Glides the bar to "top" or "middle" (in the same time and way as the pages slide).
// instant: no gliding. (On the home page the WORKS list hangs under the bar and travels with it)
function movePhoneBar(where, instant = false) {
  if (!phoneBar) return;
  if (instant) phoneBar.classList.add("is-instant");
  // The bar's own place (from the CSS): the middle on the home page, the top elsewhere
  const ownTop = phoneBarTop(isPhoneHome ? "middle" : "top");
  phoneBar.style.transform = `translateY(${phoneBarTop(where) - ownTop}px)`;
  if (instant) {
    phoneBar.offsetWidth;   // (makes the browser take it in before gliding is switched back on)
    phoneBar.classList.remove("is-instant");
  }
  if (isPhoneHome) {
    document.querySelectorAll(".phone-works").forEach((list) => {
      // the list really is at the top
      list.style.transform = `translateY(${phoneBarTop(where) - phoneBarTop("top")}px)`;
    });
  }
}

// Put the bar in its place (and on the home page the closed list under it in the middle)
if (phoneBar) {
  const placeNow = () => {
    const up = !isPhoneHome || document.body.matches(".is-phone-works-open, .is-phone-hi-open");
    movePhoneBar(up ? "top" : "middle", true);
  };
  placeNow();
  window.addEventListener("resize", placeNow);
}

// WORKS and HI: which one is open (or none)
// Opening WORKS while HI is open keeps HI behind the list (blurred), and closing the list
// goes back to HI
function setPhoneOpen(which) {
  document.querySelectorAll(".phone-works__row.is-tapped").forEach((row) => row.classList.remove("is-tapped"));
  const hiStaysBehind = which === "works" && document.body.classList.contains("is-phone-hi-open");
  document.body.classList.toggle("is-phone-works-open", which === "works");
  document.body.classList.toggle("is-phone-hi-open", which === "hi" || hiStaysBehind);
  document.body.classList.toggle("is-phone-works-over-hi", hiStaysBehind);
  if (!isPhoneHome) return;   // on a project page the bar stays at the top
  // Like on the computer, everything happens at once: WORKS rolls to italic and the list
  // unrolls while the bar glides up (and the other way round when it closes)
  movePhoneBar(which ? "top" : "middle");
}

// What shows when the WORKS list closes: HI if it was behind the list, otherwise nothing
function afterWorks() {
  return document.body.classList.contains("is-phone-works-over-hi") ? "hi" : null;
}

function currentPhoneOpen() {
  if (document.body.classList.contains("is-phone-works-open")) return "works";
  if (document.body.classList.contains("is-phone-hi-open")) return "hi";
  return null;
}

document.querySelectorAll(".phone-bar__works").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setPhoneOpen(currentPhoneOpen() === "works" ? afterWorks() : "works");
  });
});

document.querySelectorAll(".phone-bar__hi").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setPhoneOpen(currentPhoneOpen() === "hi" ? null : "hi");
  });
});

// Tapping the blur behind the list closes it
document.querySelectorAll(".phone-works-blur").forEach((blur) => {
  blur.addEventListener("click", () => setPhoneOpen(afterWorks()));
});

// A waiting copy of another page, loaded out of sight (an iframe), ready to slide in.
// kind: "page-slide" (waits below the screen) or "page-behind" (waits behind the page)
const phoneWaitingPages = {};
function phonePreparePage(href, kind) {
  if (phoneWaitingPages[href]) return phoneWaitingPages[href];
  const page = document.createElement("iframe");
  page.className = kind;
  page.src = href;
  page.tabIndex = -1;
  page.setAttribute("aria-hidden", "true");
  page.ready = new Promise((resolve) => page.addEventListener("load", resolve, { once: true }));
  document.body.appendChild(page);
  phoneWaitingPages[href] = page;
  return page;
}

// Waits for a waiting page to load (it usually loaded already, see below), so it never slides
// in half-drawn. If it takes very long, it slides in anyway
function phonePageReady(page, longest = 800) {
  return Promise.race([page.ready, new Promise((resolve) => setTimeout(resolve, longest))]);
}

// Opens a project: it slides up from the bottom while the bar glides to the top
// (and an open list rolls up into the bar at the same time)
const PHONE_LONGEST_WAIT = 500;    // the longest it waits for a project that isn't loaded yet
// Only one page change at a time: once one has started, more taps do nothing (no pile of pages)
let phoneNavigating = false;
function phoneStartNavigating() {
  if (phoneNavigating) return false;
  phoneNavigating = true;
  document.body.classList.add("is-changing-page");   // nothing on the page can be tapped any more
  return true;
}

// Can the page be reached right now? (asks for it, giving up after 8 seconds)
async function phoneCanReach(href) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const answer = await fetch(href, { method: "HEAD", cache: "no-store", signal: controller.signal });
    return answer.ok;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// When there's no internet (or it's so slow the page didn't open), the reload page shows until
// the page can be reached, then goes away by itself (and the page change carries on)
// check: also ask for the page until it answers (when the phone says it's online but the page
// still didn't open: the internet is there but very slow)
async function phoneWhenReachable(href, check = false) {
  if (window.showReloadPage) window.showReloadPage("waiting");
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  while (!navigator.onLine) await wait(500);
  if (check) while (!(await phoneCanReach(href))) await wait(2000);
  if (window.hideReloadPage) window.hideReloadPage();
}

// Goes to the page. If it still hasn't opened after a few seconds, the internet is probably the
// problem: the reload page shows until the page can be reached, then it opens
let phoneLeaveTimer = null;
function phoneLeaveTo(href) {
  window.location.href = href;
  clearTimeout(phoneLeaveTimer);
  phoneLeaveTimer = setTimeout(async () => {
    // The page answers: it's just slow, and still on its way (asking for it again would only
    // start it over, with a white flash). Only if it can't be reached does the reload page show
    if (navigator.onLine && (await phoneCanReach(href))) return;
    await phoneWhenReachable(href, true);
    window.location.href = href;
  }, 6000);
}
// Leaving the page (or coming back to it with the back button): that check isn't needed any more
window.addEventListener("pagehide", () => clearTimeout(phoneLeaveTimer));

async function phoneOpenProject(href) {
  if (!phoneStartNavigating()) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    phoneLeaveTo(href);
    return;
  }
  const page = phonePreparePage(href, "page-slide");
  // The project is waiting, ready, out of sight. If it couldn't load, check the internet first
  const ready = await Promise.race([page.ready.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), PHONE_LONGEST_WAIT))]);
  if (!ready && !navigator.onLine) await phoneWhenReachable(href);
  page.classList.add("is-sliding");
  document.body.classList.remove("is-phone-works-open", "is-phone-hi-open", "is-phone-works-over-hi");
  document.body.classList.add("is-phone-opening-project");   // HOME rolls back to the normal font
  movePhoneBar("top");
  setTimeout(async () => {
    if (!navigator.onLine) await phoneWhenReachable(href);   // no internet: wait for it
    sessionStorage.setItem("page-slid-in", "yes");   // the project page doesn't need to slide again
    phoneLeaveTo(href);
  }, PAGE_CHANGE_TIME);
}

// The WORKS list. Names roll to italic (made here, like the words in the bar).
// A tap ("phone works click new"): a project rolls to italic, and if it has a phone page it opens
// straight away; a project that isn't ready shows its "Coming Soon" box
const phoneWorksRows = [...document.querySelectorAll(".phone-works__row")];

phoneWorksRows.forEach((row) => {
  const name = row.querySelector(".phone-works__name");
  const isSoon = row.classList.contains("phone-works__row--soon");
  if (!isSoon) makeRoll(name, name.textContent, name.textContent, "start");

  const href = row.getAttribute("href");
  const here = window.location.pathname.replace(/\.html$/, "");
  const isCurrent = Boolean(href) && here.endsWith("/" + href.replace(/\.html$/, ""));
  row.classList.toggle("is-current", isCurrent);

  row.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isCurrent) {
      setPhoneOpen(null);   // already here: just close the list (and HI, if it was behind)
      return;
    }
    if (phoneChanging) return;
    phoneWorksRows.forEach((other) => other.classList.toggle("is-tapped", other === row));
    if (href) {
      // The project you're on rolls back from italic to normal, while the new one rolls to italic
      phoneWorksRows.forEach((other) => other.classList.remove("is-current"));
      // The name rolls to italic, then the list closes and the project opens
      phoneChanging = true;
      phonePreparePage(href, "page-slide");
      setTimeout(() => phoneOpenProject(href), PHONE_ROLL_WAIT);
    }
  });
});

// The previous and next project frames at the bottom of a project page: the project slides up
// (Nothing is added to the page while a finger touches a frame: phones then treat the first
// tap as a "hover" and need a second tap. The two projects get ready when the end of the page
// comes near instead)
const phoneNavLinks = [...document.querySelectorAll("a.phone-nav")];
if (phoneNavLinks.length && !window.frameElement) {
  const scroller = phoneScrollerOf(phoneNavLinks[0]);
  const prepareNear = () => {
    const left = scroller.scrollHeight - scrollerView(scroller) - scroller.scrollTop;
    if (left < scrollerView(scroller) * 1.5) {
      phoneNavLinks.forEach((link) => phonePreparePage(link.getAttribute("href"), "page-slide"));
      scrollTarget(scroller).removeEventListener("scroll", prepareNear);
    }
  };
  scrollTarget(scroller).addEventListener("scroll", prepareNear, { passive: true });
}

phoneNavLinks.forEach((link) => {
  const href = link.getAttribute("href");
  // A tap opens the project
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (phoneChanging) return;
    phoneChanging = true;
    phoneOpenProject(href);
  });
});

// Tapping somewhere else in the list rolls the names back
document.querySelectorAll(".phone-works").forEach((list) => {
  list.addEventListener("click", () => phoneWorksRows.forEach((row) => row.classList.remove("is-tapped")));
});

// HOME on the phone bar
document.querySelectorAll(".phone-bar__box--blue").forEach((link) => {
  if (isPhoneHome) {
    // On the home page it just closes WORKS or HI
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setPhoneOpen(null);
    });
    return;
  }

  // Anywhere else: the project slides down to show the home page (waiting behind it), while
  // the bar glides to the middle. The opposite of how the project came up
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!phoneStartNavigating()) return;   // a page change is already on its way
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      phoneLeaveTo(link.href);
      return;
    }
    const page = phonePreparePage(link.href, "page-behind");
    // If the WORKS list is open, it first rolls up into the bar, then the bar goes down
    if (document.body.classList.contains("is-phone-works-open")) {
      document.body.classList.remove("is-phone-works-open", "is-phone-works-over-hi");
      await new Promise((resolve) => setTimeout(resolve, INDEX_OPEN_TIME));
    }
    // The home page is waiting, ready, behind. If it couldn't load, check the internet first
    const ready = await Promise.race([page.ready.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 400))]);
    if (!ready && !navigator.onLine) await phoneWhenReachable(link.href);
    document.body.classList.remove("is-phone-works-open", "is-phone-hi-open", "is-phone-works-over-hi");
    document.querySelector("main").style.setProperty("--scrolled", `${window.scrollY}px`);
    document.body.classList.remove("is-phone-reach-open");
    document.documentElement.style.setProperty("--reach-progress", "0");
    document.body.classList.add("is-phone-going-home");   // HOME rolls to italic, the project slides down
    movePhoneBar("middle");
    setTimeout(async () => {
      if (!navigator.onLine) await phoneWhenReachable(link.href);   // no internet: wait for it
      sessionStorage.setItem("phone-home-back", "yes");
      phoneLeaveTo(link.href);
    }, PAGE_CHANGE_TIME);
  });
});

// Pictures load in order of need, so the page shows quickly:
// 1. What is on the first screen loads straight away (the rest waits: loading="lazy" in the HTML,
//    and the version the screen doesn't show, computer or phone, never loads at all)
// 2. Once the page has loaded, the rest of what this screen shows loads too, so it's all there
//    when you swipe or scroll to it.
// A waiting copy of a page (loaded in the background so changing page is instant) only ever
// loads its first screen: that's all it shows while it slides in
const isComputer = !window.matchMedia("(max-width: 700px)").matches;
function shownOnThisScreen(img) {
  return img.offsetParent !== null || getComputedStyle(img).position === "fixed" || img.closest(".phone-hi");
}
function loadNow(img) {
  if (img.loading === "lazy") img.loading = "eager";
}
// The computer home page: its frames are the first screen
if (isComputer) document.querySelectorAll('.home img[loading="lazy"]').forEach(loadNow);
// The first screen of the computer strip (about one and a half windows wide)
if (isComputer) {
  document.querySelectorAll('.project-work img[loading="lazy"]').forEach((img) => {
    if (img.getBoundingClientRect().left < window.innerWidth * 1.5) loadNow(img);
  });
}
if (!window.frameElement) {
  window.addEventListener("load", () => {
    const rest = isComputer
      ? '.project-work img[loading="lazy"], .hi-page img[loading="lazy"]'
      : '.phone-project img[loading="lazy"], .phone-hi img[loading="lazy"]';
    document.querySelectorAll(rest).forEach((img) => {
      if (isComputer || shownOnThisScreen(img)) loadNow(img);
    });
  });
}

// Each video's cover picture loads only in the version this screen shows (computer or phone)
document.querySelectorAll("video[data-poster]").forEach((video) => {
  if (video.offsetParent !== null) video.poster = video.dataset.poster;
});

// Get the next pages ready in the background a moment after this one has opened, so a tap
// changes the page straight away: on the home page the projects (one after the other),
// elsewhere the home page. On a project page the home page gets ready soon (2 seconds after the
// page opens at the latest), without waiting for every picture of the project to load first
function prepareNextPages() {
  if (prepareNextPages.done || window.frameElement || !window.matchMedia("(max-width: 700px)").matches) return;
  prepareNextPages.done = true;
  if (isPhoneHome) {
    const hrefs = [...document.querySelectorAll(".phone-frame[data-href]")].map((frame) => frame.dataset.href);
    const next = () => {
      const href = hrefs.shift();
      if (href) phonePreparePage(href, "page-slide").ready.then(next);
    };
    next();
  } else {
    document.querySelectorAll(".phone-bar__box--blue").forEach((link) => {
      phonePreparePage(link.href, "page-behind");
    });
  }
}
window.addEventListener("load", () => setTimeout(prepareNextPages, isPhoneHome ? 1500 : 300));
if (!isPhoneHome) setTimeout(prepareNextPages, 6000);   // (in case the page takes very long to load)

// Arriving back home from another page: the frames are already out (they came out while
// the home page rolled down), so they are there straight away
if (isPhoneHome && sessionStorage.getItem("phone-home-back")) {
  sessionStorage.removeItem("phone-home-back");
  const phoneHomePage = document.querySelector(".phone-home");
  phoneHomePage.classList.add("is-instant", "is-playful");
  landFramesNow();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    phoneHomePage.classList.remove("is-instant");
    document.documentElement.classList.remove("is-phone-home-back");
  }));
}

// Coming back with the browser's back button: put everything back
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  Object.keys(phoneWaitingPages).forEach((href) => {
    phoneWaitingPages[href].remove();
    delete phoneWaitingPages[href];
  });
  document.body.classList.remove("is-leaving-home", "is-phone-works-open", "is-phone-hi-open",
    "is-phone-works-over-hi", "is-phone-opening-project", "is-phone-going-home");
  phoneChanging = false;
  phoneNavigating = false;
  clearTimeout(phoneLeaveTimer);
  document.body.classList.remove("is-changing-page");
  document.querySelectorAll(".phone-frame.is-tapped, .phone-nav.is-tapped, .phone-works__row.is-tapped")
    .forEach((element) => element.classList.remove("is-tapped"));
  // The project you're on is italic again
  phoneWorksRows.forEach((row) => {
    const href = row.getAttribute("href");
    const here = window.location.pathname.replace(/\.html$/, "");
    row.classList.toggle("is-current", Boolean(href) && here.endsWith("/" + href.replace(/\.html$/, "")));
  });
  if (phoneBar) movePhoneBar(isPhoneHome ? "middle" : "top", true);
});


/* =========================================
   Phone: REACH OUT. It comes when you keep swiping up at the end of the page (the home page or
   a project page). It follows the finger, and the
   page behind blurs more and more. Let go past a third of the way (or with a
   quick flick) and it goes all the way up, otherwise back down. Swiping down puts it away
   ========================================= */
const phoneReach = document.querySelector(".phone-reach");

const projectScrollBox = document.querySelector("main > .phone-scroll, .phone-home__scroll");
const projectScroller = projectScrollBox && phoneScrollerOf(projectScrollBox);   // what the page scrolls in

if (phoneReach) {
  const START_AFTER = 10;   // how far (screen pixels) the finger moves before it counts as a swipe
  const FLICK = 0.5;        // a flick this fast (pixels per millisecond) opens or closes it anyway
  let progress = 0;         // 0 = down, 1 = all the way up
  let startY = null;
  let startProgress = 0;
  let dragging = false;
  let lastY = 0;
  let lastTime = 0;
  let speed = 0;

  function setReach(value) {
    progress = Math.max(0, Math.min(1, value));
    document.documentElement.style.setProperty("--reach-progress", progress.toFixed(4));
    document.body.classList.toggle("is-phone-reach-open", progress > 0);
  }

  // When it can come up: never behind WORKS or HI; on the home page once the frames are out;
  // and only at the very end of the page
  function canOpen() {
    // never behind WORKS or HI, and never while going to another page
    if (document.body.matches(".is-phone-works-open, .is-phone-hi-open, .is-phone-going-home, .is-phone-opening-project")) return false;
    if (isPhoneHome) return false;   // only at the end of a project page
    if (projectScroller) {
      const end = projectScroller.scrollHeight - scrollerView(projectScroller);
      return projectScroller.scrollTop >= end - 2;
    }
    return false;
  }

  document.addEventListener("touchstart", (event) => {
    startY = event.touches[0].clientY;
    startProgress = progress;
    dragging = false;
    lastY = startY;
    lastTime = performance.now();
    speed = 0;
  }, { passive: true });

  document.addEventListener("touchmove", (event) => {
    if (startY === null) return;
    const y = event.touches[0].clientY;
    // Not at the end of the page yet: the page scrolls as usual, and counting starts
    // from the moment it reaches the end
    if (!dragging && startProgress === 0 && !canOpen()) {
      startY = y;
      return;
    }
    const moved = startY - y;   // up is positive
    if (!dragging) {
      if (Math.abs(moved) < START_AFTER) return;
      // Down while it is closed, or up while it is open: nothing to do
      if ((startProgress === 0 && moved < 0) || (startProgress === 1 && moved > 0)) {
        startY = null;
        return;
      }
      dragging = true;
      document.body.classList.add("is-phone-reach-dragging");
    }
    const now = performance.now();
    speed = (lastY - y) / Math.max(now - lastTime, 1);
    lastY = y;
    lastTime = now;
    setReach(startProgress + moved / window.innerHeight);
  }, { passive: true });

  // A fling that scrolls on to the end of the project keeps going straight into Reach Out
  if (projectScroller) {
    const FLING = 0.6;   // scrolling this fast (pixels per millisecond) when it hits the end
    let lastTop = projectScroller.scrollTop;
    let lastScrollTime = performance.now();
    let scrollSpeed = 0;
    scrollTarget(projectScroller).addEventListener("scroll", () => {
      const now = performance.now();
      scrollSpeed = (projectScroller.scrollTop - lastTop) / Math.max(now - lastScrollTime, 1);
      lastTop = projectScroller.scrollTop;
      lastScrollTime = now;
      if (startY === null && progress === 0 && scrollSpeed > FLING && canOpen()) setReach(1);
    }, { passive: true });
  }

  document.addEventListener("touchend", () => {
    if (dragging) {
      document.body.classList.remove("is-phone-reach-dragging");
      let open = progress > (startProgress === 0 ? 1 / 3 : 2 / 3);
      if (speed > FLICK) open = true;
      if (speed < -FLICK) open = false;
      setReach(open ? 1 : 0);
    }
    startY = null;
    dragging = false;
  });
}


/* =========================================
   Phone: tapping the email address (on the Hi page and on Reach Out) copies it instead of
   opening an email, and a black COPIED label rolls up over it, like on the computer.
   Tapping it again, or the phone number or Instagram, rolls the label back down.
   When the Hi page or Reach Out goes away, the label is gone (without rolling).
   The phone number still calls, and Instagram still opens
   ========================================= */
const phoneEmails = [...document.querySelectorAll('.phone-hi__contact[href^="mailto:"], .phone-reach__contact[href^="mailto:"]')];

phoneEmails.forEach((link) => {
  const address = link.textContent.trim();
  link.classList.add("phone-copy");
  // The address and "Copied" in the same spot: copying rolls the address up and out of its line
  // and "Copied" up into it (like the words in the bar)
  link.innerHTML = `<span class="phone-copy__roll"><span class="phone-copy__address">${address}</span>` +
    `<span class="phone-copy__label" aria-hidden="true">Copied</span></span>`;

  link.addEventListener("click", async (event) => {
    event.preventDefault();
    if (link.classList.contains("is-copied")) {
      link.classList.remove("is-copied");
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
    } catch (error) {
      // Copying isn't allowed here
    }
    link.classList.add("is-copied");
  });

  // The phone number or Instagram next to it rolls the label back down
  const page = link.closest(".phone-hi, .phone-reach");
  page.querySelectorAll(".phone-hi__contact, .phone-reach__contact").forEach((other) => {
    if (other !== link) other.addEventListener("click", () => link.classList.remove("is-copied"));
  });
});

// The Hi page closed or Reach Out went down: the labels go away at once
if (phoneEmails.length) {
  new MutationObserver(() => {
    phoneEmails.forEach((link) => {
      const page = link.closest(".phone-hi") ? "is-phone-hi-open" : "is-phone-reach-open";
      if (!document.body.classList.contains(page) && link.classList.contains("is-copied")) {
        link.classList.add("is-resetting");
        link.classList.remove("is-copied");
        requestAnimationFrame(() => requestAnimationFrame(() => link.classList.remove("is-resetting")));
      }
    });
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
}


/* =========================================
   The reload page: it comes up when the internet is lost, or when the page has been open for
   more than an hour (then things may be out of date). A tap or click anywhere reloads the page
   ========================================= */
const reloadPage = document.querySelector(".reload-page");
const RELOAD_AFTER = 60 * 60 * 1000;   // one hour (milliseconds)
const pageOpenedAt = Date.now();

if (reloadPage && !window.frameElement) {
  // why it shows: "offline" or "waiting" (it goes away by itself once the internet works again),
  // or "time" (open for over an hour: only reloading helps)
  let reloadReason = null;
  function showReloadPage(reason = "time") {
    if (reloadReason !== "time") reloadReason = reason;
    document.body.classList.add("is-reload");
    reloadPage.setAttribute("aria-hidden", "false");
  }
  function hideReloadPage() {
    if (reloadReason === "time") return;
    reloadReason = null;
    document.body.classList.remove("is-reload");
    reloadPage.setAttribute("aria-hidden", "true");
  }
  window.showReloadPage = showReloadPage;
  window.hideReloadPage = hideReloadPage;

  // No internet: it shows. When the internet is back it goes away, and you're back where you were
  window.addEventListener("offline", () => showReloadPage("offline"));
  window.addEventListener("online", () => {
    if (reloadReason === "offline") hideReloadPage();
  });
  const checkTime = () => {
    if (Date.now() - pageOpenedAt > RELOAD_AFTER) showReloadPage("time");
  };
  setInterval(checkTime, 60 * 1000);
  // Coming back to a tab or phone that was asleep (the timer doesn't run then)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkTime();
  });
  window.addEventListener("pageshow", checkTime);

  reloadPage.addEventListener("click", () => window.location.reload());
}


/* =========================================
   A project page on the phone always starts at the top (also when the browser would put it
   back where it was before)
   ========================================= */
if (document.body.classList.contains("project-page") && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
if (document.body.classList.contains("project-page")) {
  window.scrollTo(0, 0);
  window.addEventListener("pageshow", () => window.scrollTo(0, 0));
}


/* =========================================
   Phone Hi page: once the panel is pulled all the way up (it can't scroll further), the blur at
   the bottom of the screen goes away, so Instagram at the bottom is sharp
   ========================================= */
document.querySelectorAll(".phone-hi").forEach((hi) => {
  const box = hi.querySelector(".phone-scroll");
  if (!box) return;
  const check = () => hi.classList.toggle("is-at-end", box.scrollTop >= box.scrollHeight - box.clientHeight - 2);
  box.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check);
});

