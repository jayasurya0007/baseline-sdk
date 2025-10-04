export default [{
  files: ["test-eslint-ultimate.js"],
  plugins: {
    "baseline": await import("./packages/eslint-plugin-baseline/dist/index.js")
  },
  rules: {
    "baseline/no-non-baseline": ["error", { target: "widely" }]
  }
}];
