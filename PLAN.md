# Matemago: calm, kid-focused UI polish

## Context

Matemago is a Spanish, mobile-first multiplication practice app for children around 8–9 years old. Read `CLAUDE.md` before making visual changes: its **Tinta y Estrellas** direction, palette, motion limits, and educational anti-goals are the source of truth. Preserve the existing learning model, progress data, and storage behavior. This plan covers visual design and UX, including concise copy and interaction changes.

The audit was based on the source and brand icon on 2026-09-12. A live browser render was unavailable, so the layout findings below need device verification. `bun run check` and `bun run lint` passed at audit time. The repository had unrelated uncommitted work; inspect the current working tree before editing and preserve those changes.

## Findings

- The brand foundation is strong: vellum, indigo ink, restrained gold, a distinctive hat icon, and large math typography already support a calm, capable feel.
- Home gives the greeting, brand, star map, activity card, and unavailable “Muy pronto” card competing attention. With one playable activity, practice should be the clearest next action.
- The 10×10 star map uses cells far below a comfortable phone touch target. Its mini version renders buttons inside the Home star-map button, creating nested interactive elements.
- `--ink-faint` on `--paper` is about 1.6:1 contrast; settings and exit controls that use it are too faint.
- Long equations and strategy prompts need narrow and short-screen verification. Blinking carets add autonomous motion during practice.
- The small `WizardMark` omits the icon’s defining gold ×. Its 700 ms summary animation also exceeds the brand’s 300 ms celebration limit.

## Implementation plan

1. **Make Home practice-first.** Use the existing hat artwork as a restrained brand anchor. Make “Las tablas” one prominent, full-width action. Present “Tu cielo” as a quieter progress link beneath it, and remove the unavailable “Muy pronto” card. Keep the screen’s child-facing copy brief.
2. **Polish the practice surface.** Keep the equation and answer dominant, and make `10 × 10 = 100` fit at 320 CSS px without clipping or horizontal scrolling. Keep number-pad keys comfortably tappable on short phones. Replace blinking carets with a static input cue; make exit and other utility controls clearly visible. Keep success motion at or below 300 ms and respect reduced-motion preferences.
3. **Make the star map usable on phones.** Render the 10×10 constellation as a visual overview rather than 100 tiny buttons. Add two clearly labeled 1–10 selectors with at least 44 px touch targets and show the selected equation prominently below. Make the Home mini map non-interactive markup. Provide text alternatives for gold, silver, and unlit progress rather than relying on color alone.
4. **Unify details.** Bring the small wizard mark closer to the icon silhouette and gold ×. Standardize card edges, spacing, and control states using `src/app.css` tokens. Polish the session summary and adult settings sheet, including keyboard focus and modal behavior. Do not add new illustration, colors, activities, reward systems, or learning mechanics.

## Acceptance and verification

- Run `bun run check`, `bun run lint`, and `bun run test` after implementation.
- Review Home, retrieval, strategy, summary, star map, and settings at 320, 375, and 480 CSS px, including a short phone viewport. Confirm no clipping, overlap, or unintended scrolling during practice.
- Check touch targets, keyboard navigation and focus, screen-reader labels/status, color contrast, and reduced motion. Exercise the longest equation and strategy prompts, correct/incorrect feedback, and a completed session.
- Verify the Home action starts practice, the quieter progress link opens “Tu cielo,” the fact explorer shows the chosen product, and existing progress persists unchanged.
