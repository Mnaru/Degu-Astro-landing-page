# Animations Reference

Quick reference for tweaking animation values. All times in seconds.

---

## Hero Intro (`src/lib/animations/heroIntro.ts`)

Triggered on page load. Not scroll-driven.

### Initial State (before timeline starts)

| Element    | Property    | Value                | Notes                                      |
|------------|-------------|----------------------|--------------------------------------------|
| STUDIO     | `x`         | `studioOffsetX`      | Shifts STUDIO to page center (calculated)  |
| BodyText   | `autoAlpha` | `0`                  | Hidden                                     |
| BodyText   | `x`, `y`    | `-10`, `-8`          | Offset left and up from final position     |
| ScrollHint | `autoAlpha` | `0`                  | Hidden                                     |
| hero-inner | `autoAlpha` | `1`                  | Reveals (was hidden by `data-gsap`)        |

### Timeline

#### 1. Hold — centered state
| Param      | Value  | Tweak to...                  |
|------------|--------|------------------------------|
| `duration` | `0.4`  | Longer = more dramatic pause |

#### 2. Slide apart — elastic stretch feel
Words slide outward, decelerating as if pulled by elastic bands (resistance increases).

**DEGU (slides right):**
| Param      | Value              | Tweak to...                        |
|------------|--------------------|------------------------------------|
| `x`        | `width * 0.18`     | Increase = slides further right    |
| `rotation` | `0.3` deg          | Subtle weight feel, keep < 1       |
| `duration` | `0.5`              | Slide speed                        |
| `ease`     | `power3.out`       | Decelerates into outer position    |
| start time | `0.4`              | Right after hold ends              |

**STUDIO (slides left):**
| Param      | Value              | Tweak to...                        |
|------------|--------------------|------------------------------------|
| `x`        | `offset - width * 0.22` | Increase 0.22 = slides further left |
| `rotation` | `-0.3` deg         | Opposite direction to DEGU         |
| `duration` | `0.55`             | 50ms slower than DEGU (asymmetry)  |
| `ease`     | `power3.out`       | Same deceleration                  |
| start time | `0.42`             | 20ms after DEGU (asymmetry)        |

**Asymmetry note:** The 20ms timing offset and 50ms duration difference between DEGU and STUDIO make the motion feel organic. Both elements move similarly but not identically. Reduce the differences for more synchronized feel, increase for more organic.

#### 3. Snap back — elastic release
Words snap back to CSS positions. No hold at outer positions — immediate reversal.

`snapStart = 0.42 + 0.55 = 0.97`

**STUDIO (returns first):**
| Param      | Value          | Tweak to...                           |
|------------|----------------|---------------------------------------|
| `x`        | `0`            | Final CSS position                    |
| `rotation` | `0.15` deg     | Overshoots past neutral (settles later) |
| `duration` | `0.21`         | Snap speed                            |
| `ease`     | `power3.in`    | Accelerates into final position       |
| start time | `snapStart`    | Immediately after slide ends          |

**DEGU (returns second):**
| Param      | Value          | Tweak to...                           |
|------------|----------------|---------------------------------------|
| `x`        | `0`            | Final CSS position                    |
| `rotation` | `-0.15` deg    | Overshoots opposite direction         |
| `duration` | `0.24`         | Slightly slower than STUDIO           |
| `ease`     | `power3.in`    | Accelerates into final position       |
| start time | `snapStart + 0.02` | 20ms after STUDIO                |

**Rotation settle (both):**
| Param      | Value          | Tweak to...                           |
|------------|----------------|---------------------------------------|
| `rotation` | `0`            | Back to neutral                       |
| `duration` | `0.3`          | How long the settle takes             |
| `ease`     | `power2.out`   | Decelerates to stop                   |
| start time | `snapStart + 0.2` | Overlaps with snap-back end        |

#### 4. Scale down — slow zoom out
After snap completes, both words slowly shrink. Creates a subtle "camera pulling back" feel.

`scaleStart = snapStart + 0.24 + 0.02 = ~1.23`

**DEGU:**
| Param             | Value            | Tweak to...                        |
|-------------------|------------------|------------------------------------|
| `scale`           | `0.98`           | Lower = more visible shrink        |
| `duration`        | `3`              | Very slow, almost imperceptible    |
| `ease`            | `power2.out`     | Fast at start, decelerates         |
| `transformOrigin` | `center bottom`  | Scales from bottom edge (preserves gap to STUDIO) |

**STUDIO:**
| Param             | Value            | Tweak to...                        |
|-------------------|------------------|------------------------------------|
| `scale`           | `0.98`           | Same as DEGU                       |
| `duration`        | `3`              | Same as DEGU                       |
| `ease`            | `power2.out`     | Same as DEGU                       |
| `transformOrigin` | `left top`       | Scales from top-left (preserves gap to DEGU) |

**Why different transformOrigins:** DEGU is above STUDIO. Scaling DEGU from bottom and STUDIO from top keeps their facing edges fixed, preserving the vertical gap between them.

#### 5. BodyText — appear and drift
Appears the instant snap completes, then slowly drifts to final position.

| Param      | Value          | Tweak to...                           |
|------------|----------------|---------------------------------------|
| fade-in    | `0.05` / `none`| Essentially instant                   |
| `x`        | `-10` → `0`   | Increase -10 for more horizontal drift |
| `y`        | `-8` → `0`    | Increase -8 for more vertical drift    |
| `scale`    | `1` → `1.03`  | Subtle grow, increase for more         |
| `duration` | `2`            | How long the drift lasts               |
| `ease`     | `power2.out`   | Decelerates to stop                    |
| start time | `scaleStart`   | Same moment as scale-down begins       |

#### 6. ScrollHint — fade in + start cylinder
Appears after a short delay, then starts the rolling text cylinder animation.

`scrollHintStart = scaleStart + 0.3`

| Param      | Value          | Tweak to...                           |
|------------|----------------|---------------------------------------|
| `autoAlpha`| `0` → `1`     | Fade in                               |
| `duration` | `0.5`          | Fade speed                            |
| `ease`     | `power2.out`   | Smooth fade                           |
| delay      | `0.3`          | Wait after snap before showing (change in `scaleStart + 0.3`) |
| `onComplete` | plays `_scrollHintTl` | Starts cylinder rotation after fade finishes |

### Scroll Hijack
Page scroll is completely locked (`overflow: hidden` on body) from intro start until outro end. Wheel/touch events accelerate the current animation to its end state.

| Param      | Value          | Tweak to...                           |
|------------|----------------|---------------------------------------|
| `duration` | `0.4`          | How fast it rushes to end state        |
| `ease`     | `power2.inOut` | Smooth acceleration/deceleration       |

- `history.scrollRestoration = 'manual'` prevents browser restoring previous scroll position
- `window.scrollTo(0, 0)` resets scroll before measurements
- `document.body.style.overflow = 'hidden'` locks all scroll methods (wheel, keyboard, scrollbar)
- Unlocked by heroOutro `onComplete` → `document.body.style.overflow = ''`

---

## Hero Outro (`src/lib/animations/heroOutro.ts`)

Triggered when heroIntro completes. Starts paused, plays on first scroll down.

> **TODO:** Outro animation timings (durations, eases, scroll sensitivity) need tweaking in the next step.

### Step A — Transform origin swap (no visual jump)
Synchronous snapshot → clear → compensate cycle. No repaint between steps.

1. Snapshot DEGU/STUDIO visual rects via `getBoundingClientRect()`
2. Measure visual gap: `gap = studioSnapRect.top - deguSnapRect.bottom`
3. `clearProps: 'scale,transformOrigin,x,y,rotation'` on both elements
4. Read natural CSS rects (no transforms)
5. Set `transformOrigin: 'top left'`, `scale: 0.98`, compensate with `x/y` to restore visual positions

### Step B — Target calculation

| Param          | Value                                        | Tweak to...                           |
|----------------|----------------------------------------------|---------------------------------------|
| `outroGap`     | `-40`                                        | Visual gap between DEGU and STUDIO (negative to compensate for Anton SC whitespace) |
| `outroPadX`    | `5`                                          | Horizontal padding from viewport left edge |
| `outroPadY`    | `-8`                                         | Vertical padding from viewport top/bottom (negative to push past edge) |
| `targetScale`  | `(vh - outroPadY * 2 - outroGap) / (deguH + studioH)` | Fills viewport minus padding and gap |
| DEGU target    | `x: outroPadX - naturalLeft`, `y: outroPadY - naturalTop` | Top-left at (5, -8) viewport coords |
| STUDIO target  | `x: outroPadX - naturalLeft`, `y: (outroPadY + deguH * scale + outroGap) - naturalTop` | Below DEGU |

### Step C — Timeline (zoom in)

| Element    | Properties                          | Duration | Ease          | Start |
|------------|-------------------------------------|----------|---------------|-------|
| DEGU       | scale, x, y → target                | `1.2`    | `power2.inOut`| `0`   |
| STUDIO     | scale, x, y → target                | `1.2`    | `power2.inOut`| `0`   |
| BodyText   | x: windowWidth, y: 50, autoAlpha: 0 | `0.8`    | `power2.in`   | `0.1` |
| ScrollHint | autoAlpha: 0, pause cylinder        | `0.3`    | `power2.in`   | `0`   |

### Step E — Exit (DEGU left, STUDIO right)

| Element    | Properties                          | Duration | Ease          | Start |
|------------|-------------------------------------|----------|---------------|-------|
| DEGU       | x: off-screen left                  | `0.5`    | `power3.in`   | `1.2` |
| STUDIO     | x: off-screen right                 | `0.55`   | `power3.in`   | `1.22`|

Asymmetric timing (20ms offset, 50ms duration difference) for organic feel.

### Scroll Hijack — Hybrid (timed + scroll-driven)

Three modes:
1. **`waiting`** — timeline paused, first scroll down triggers timed playback
2. **`timed`** — `tl.play()` at designed speed; if user does nothing, plays through to completion
3. **`scroll`** — user scrolled during timed playback, scroll delta drives progress forward

| Param              | Value  | Tweak to...                           |
|--------------------|--------|---------------------------------------|
| `scrollSensitivity`| `800`  | Total scroll-delta pixels for full animation (lower = faster) |
| gesture debounce   | `150ms`| Time after last scroll event before allowing mode switch |
| progress tween     | `0.3s` | Interpolation smoothness for scroll-driven progress |

**Reverse:** Scroll up from any active mode snaps back to intro end state. Duration is proportional to current progress (`max(0.3, progress * 1.0)`). ScrollHint cylinder resumes via `onReverseComplete`.

---

## ScrollHint Cylinder (`src/components/ScrollHint.astro`)

Intrinsic animation — lives in the component's `<script>`. Created paused, triggered by heroIntro.

### Setup
- Text split into individual character `<span>`s
- 4 stacked lines (3 absolute-positioned on top of first)
- 3D perspective container

| Param              | Value       | Tweak to...                        |
|--------------------|-------------|------------------------------------|
| `perspective`      | `200`       | Lower = more dramatic 3D           |
| `transformOrigin`  | `50% 50% -7px` | `-7px` is cylinder radius (tuned for 11px font) |
| `backfaceVisibility` | `hidden` | Hides text on back of cylinder     |

### Rotation
Each line rotates from top (90deg) through front (0deg) to bottom (-90deg).

| Param      | Value          | Tweak to...                           |
|------------|----------------|---------------------------------------|
| `rotationX`| `90` → `-90`  | Full top-to-bottom rotation           |
| `stagger`  | `0.1`          | Delay between each character          |
| `duration` | `0.9` (`animTime`) | Speed of one line's rotation      |
| `ease`     | `none`         | Linear rotation                       |
| line stagger | `index * animTime * 0.5` | Overlap between lines    |
| `repeat`   | `-1`           | Loops forever                         |
| `paused`   | `true`         | Waits for heroIntro to call `.play()` |

---

## Ease Reference

| Ease           | Feel                                    | Used for                    |
|----------------|------------------------------------------|-----------------------------|
| `power3.out`   | Fast start, decelerates                  | Slide out (elastic stretch) |
| `power3.in`    | Slow start, accelerates                  | Snap back (elastic release) |
| `power2.out`   | Moderate deceleration                    | Scale down, rotation settle, body text drift |
| `power2.inOut` | Smooth both directions                   | Scroll override, outro scale/reposition |
| `power2.in`    | Slow start, accelerates                  | BodyText slide off, ScrollHint fade out |
| `none`         | Linear / instant                         | Body text fade, cylinder rotation |
