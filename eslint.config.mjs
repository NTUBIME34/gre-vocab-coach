import { FlatCompat } from "@eslint/eslintrc";

// ESLint 9 needs flat config; eslint-config-next still ships the legacy shape,
// so FlatCompat bridges it. Without any config file at all, `npm run lint`
// dropped into an interactive setup prompt and hung in CI.
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "dist/**", "next-env.d.ts"]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default config;
