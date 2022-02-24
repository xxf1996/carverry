module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-typescript/base' // 使用Airbnb eslint规范的ts版本，与其他项目保持一致性
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: ['./tsconfig.json'], // 指定tsconfig文件地址
    extraFileExtensions: ['.vue'],
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-console': 0,
    'no-debugger': 'off',
    'no-shadow': 0,
    "no-plusplus": "error",
    "no-else-return": "error",
    'max-len': [
      'error',
      {
        ignoreStrings: true,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
        ignoreTemplateLiterals: true,
        code: 120,
      },
    ],
    'no-param-reassign': [
      2,
      {
        props: false,
      },
    ],
    'no-unused-expressions': [
      2,
      {
       'allowShortCircuit': true,
      },
    ],
    'import/no-unresolved': 'off',
    'import/no-dynamic-require': 'off',
    'import/extensions': 0,
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': 'off',
    'max-len': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};
