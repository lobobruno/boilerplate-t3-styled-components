/** @type {import("prettier").Config} */
module.exports = {
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  useTabs: true,
  singleQuote: true,
  trailingComma: "none",
  printWidth: 100,
  semi: false,
};
