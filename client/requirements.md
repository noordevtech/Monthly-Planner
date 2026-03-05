## Packages
date-fns | Essential for robust calendar and date manipulation logic
framer-motion | Smooth page transitions and polished micro-interactions
lucide-react | Beautiful, consistent iconography
react-hook-form | Form state management
@hookform/resolvers | Zod validation integration for forms

## Notes
- Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}
- Backend API endpoints expect `date` as `YYYY-MM-DD` strings.
- The `month` query parameter expects `YYYY-MM` string format.
