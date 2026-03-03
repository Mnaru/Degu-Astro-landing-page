import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

const bodyPaths = [
  // Keyframe 1
  'M146.5 270.8C162 270.8 94.4974 115.798 244.5 43.8017C272 30.6025 227 92.2998 267.5 151.3C313.482 218.286 318.871 200.755 330.075 266.769C330.226 267.66 331.401 267.944 331.882 267.179C365.624 213.515 314.125 146.546 348.5 160.299C373.5 170.301 482.69 268.29 445.5 399.8C431.5 449.305 389 555.8 246.5 558.8C104 561.8 42.0001 445.301 42 364.3C41.9999 294.284 102 213.3 120 205.3C138 197.3 119.925 270.8 146.5 270.8Z',
  // Keyframe 2
  'M158 263.949C173.5 263.949 122.497 115.647 272.5 43.6503C300 30.4511 238.5 98.6502 279 157.65C325.086 224.789 322.067 191.838 341.397 260.306C341.628 261.125 342.74 261.347 343.206 260.634C378.107 207.253 361.061 154.872 395.5 168.65C420.5 178.653 505.19 272.141 468 403.65C454 453.155 400.5 548.949 258 551.949C115.5 554.949 42.0001 438.152 42 357.15C41.9999 287.134 92 216.65 110 208.65C128 200.65 131.425 263.949 158 263.949Z',
  // Keyframe 3
  'M151 266.972C166.5 266.972 216.5 177.471 179.5 47.4595C173.889 27.7417 262.4 84.8106 295.5 148.259C316.737 188.967 322.851 202.638 334.08 269.462C334.23 270.353 335.383 270.671 335.896 269.928C373.106 216.032 455.5 140.429 455.5 177.472C455.5 241.972 510.69 265.249 473.5 396.759C459.5 446.264 417 552.759 274.5 555.759C132 558.759 43.5001 451.973 43.5 370.972C43.4999 300.956 58.3444 279.226 62.5 259.972C92.5 120.972 124.425 266.972 151 266.972Z',
];

const eyes = {
  left:  [{ cx: 170,   cy: 371 },     { cx: 182,   cy: 367.993 }, { cx: 187.5, cy: 370.498 }],
  right: [{ cx: 285,   cy: 371 },     { cx: 297,   cy: 367.993 }, { cx: 302.5, cy: 370.498 }],
};

// Yoyo sequence: 1 → 2 → 3 → 2 → 1 (seamless, no jarring jump)
const sequence = [0, 1, 2, 1];

// Asymmetric durations per transition for organic rhythm
const durations = [0.38, 0.28, 0.33, 0.4];

const eyeLag = 0.06; // eyes trail the body slightly

export function initFlameAnimation(svgEl: SVGSVGElement): () => void {
  const bodyBg = svgEl.querySelector<SVGPathElement>('.body-bg');
  const bodyOutline = svgEl.querySelector<SVGPathElement>('.body-outline');
  const eyeLeft = svgEl.querySelector<SVGCircleElement>('.eye-left');
  const eyeRight = svgEl.querySelector<SVGCircleElement>('.eye-right');

  if (!bodyBg || !bodyOutline || !eyeLeft || !eyeRight) return () => {};

  const morphOpts = { type: 'rotational' as const };

  const tl = gsap.timeline({ repeat: -1 });

  for (let i = 0; i < sequence.length; i++) {
    const next = sequence[(i + 1) % sequence.length];
    const dur = durations[i];
    const ease = 'power1.inOut';
    const label = `s${i}`;

    tl.to(bodyBg, { morphSVG: { shape: bodyPaths[next], ...morphOpts }, duration: dur, ease }, label)
      .to(bodyOutline, { morphSVG: { shape: bodyPaths[next], ...morphOpts }, duration: dur, ease }, label)
      .to(eyeLeft, { attr: eyes.left[next], duration: dur, ease }, label + '+=' + eyeLag)
      .to(eyeRight, { attr: eyes.right[next], duration: dur, ease }, label + '+=' + eyeLag);
  }

  return () => {
    tl.kill();
  };
}
