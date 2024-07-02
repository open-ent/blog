module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/typescript",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: false,
    },
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["react", "import", "jsx-a11y", "unused-imports"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/ban-types": "off",
    "no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: [
    ".eslintrc.cjs",
    "dist",
    "node_modules",
    "prettier.config.cjs",
    "public",
    "scripts",
    "vite.config.ts",
  ],
};
