import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Standards/ 规范对应的 eslint 规则
  {
    rules: {
      // TypeScript 5 规范：禁止 any
      "@typescript-eslint/no-explicit-any": "error",
      // TypeScript 5 规范：禁止 @ts-ignore
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": true,
          "ts-expect-error": "allow-with-description",
        },
      ],
      // Motion v12 规范：禁止 framer-motion 导入，使用 motion 替代
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            {
              "name": "framer-motion",
              "message": "使用 'motion' 替代 'framer-motion' (Motion v12 规范)",
            },
            {
              "name": "@base-ui/react",
              "message": "使用 '@base-ui/react/*' 子路径导入 (Base UI 规范)",
            },
          ],
        },
      ],
      // Base UI 规范：按钮必须有 type 属性
      "react/button-has-type": "error",
    },
  },
]);

export default eslintConfig;
