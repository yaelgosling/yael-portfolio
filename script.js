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

  // When the mouse leaves the window, everything drifts back to its place
  document.documentElement.addEventListener("mouseleave", () => {
    mouseX = 0;
    mouseY = 0;
    startAnimating();
  });
}

if (canMove) {
  // The home frames ("Home New" is 1440 x 768)
  if (home) {
    const frames = [...home.querySelectorAll(".home__frames .home-frame")];
    followMouse(
      frames.map((frame) => ({ element: frame, placed: frame })),
      1440, 768,
      () => !document.body.matches(".is-index-open, .is-hi-open")
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
   Index: the name of the project you are on is italic
   ========================================= */
const pageName = (path) => path.replace(/\.html$/, "");   // "/i-dont-touch-meat.html" and "/i-dont-touch-meat" are the same page
document.querySelectorAll("a.site-index__name").forEach((name) => {
  if (pageName(name.pathname) === pageName(window.location.pathname)) name.classList.add("is-current");
});


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
  }
  window.addEventListener("scroll", updateBlur, { passive: true });
  window.addEventListener("resize", updateBlur);
  updateBlur();
});


/* =========================================
   Project page: click the animation to play or pause it
   ========================================= */
document.querySelectorAll(".project-video").forEach((video) => {
  video.addEventListener("click", () => {
    if (video.paused) video.play();
    else video.pause();
  });

  // Hide the play symbol while the video plays, show it again when it stops
  video.addEventListener("play", () => video.classList.add("is-playing"));
  video.addEventListener("pause", () => video.classList.remove("is-playing"));
  video.addEventListener("ended", () => video.classList.remove("is-playing"));
});


/* =========================================
   The index: clicking INDEX opens the list and blurs everything else.
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

  // The two buttons in the band switch between the list and the photos
  const panel = document.querySelector(".site-index");
  panel.querySelectorAll(".site-index__view").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.classList.contains("site-index__view--photos") ? "photos" : "list";
      panel.dataset.view = view;
      panel.querySelectorAll(".site-index__view").forEach((other) => {
        const chosen = other === button;
        other.classList.toggle("is-active", chosen);
        other.setAttribute("aria-pressed", chosen);
      });
    });
  });
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
