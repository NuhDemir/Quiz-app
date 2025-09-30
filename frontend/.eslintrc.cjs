module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
  },
  overrides: [
    {
      files: ["**/*.test.{js,jsx}", "**/__tests__/**/*.{js,jsx}"],
      env: {
        jest: true,
      },
    },
    {
      files: ["vite.config.{js,jsx}"],
      env: {
        node: true,
      },
    },
    {
      files: ["../netlify/**/*.js", "../start/**/*.js"],
      env: {
        node: true,
      },
    },
  ],
};
