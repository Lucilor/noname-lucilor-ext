import {FlatCompat} from "@eslint/eslintrc";
import js from "@eslint/js";
import deprecation from "eslint-plugin-deprecation";
import prettier from "eslint-plugin-prettier";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  {
    ignores: [
      "**/logs",
      "**/*.log",
      "**/npm-debug.log*",
      "**/yarn-debug.log*",
      "**/yarn-error.log*",
      "**/pnpm-debug.log*",
      "**/lerna-debug.log*",
      "**/node_modules",
      "**/dist",
      "**/dist-ssr",
      "**/*.local",
      "**/.idea",
      "**/.DS_Store",
      "**/*.suo",
      "**/*.ntvs*",
      "**/*.njsproj",
      "**/*.sln",
      "**/*.sw?",
      "**/.yarn"
    ]
  },
  {
    languageOptions: {
      globals: {}
    }
  },
  ...compat
    .extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended"
    )
    .map((config) => ({
      ...config,
      files: ["**/*.ts"]
    })),
  {
    files: ["**/*.ts"],

    plugins: {
      deprecation,
      prettier
    },

    languageOptions: {
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        project: ["tsconfig.json", "tsconfig.node.json"],
        createDefaultProgram: true
      }
    },

    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: null,
          leadingUnderscore: "allowSingleOrDouble"
        }
      ],

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-shadow": "off",
      "comma-dangle": ["error", "never"],
      // "deprecation/deprecation": "warn",
      eqeqeq: ["error", "always"],

      "no-empty": [
        "error",
        {
          allowEmptyCatch: true
        }
      ],

      "no-underscore-dangle": "off"
    }
  }
];
