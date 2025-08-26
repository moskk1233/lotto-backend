import { type Configuration } from 'lint-staged';

const config: Configuration = {
  '*.{ts,mts,js,mjs}': 'prettier --write',
  '{src/**}.{mjs,js,cjs,ts,tsx}': 'eslint --fix',
  'prisma/schema.prisma': 'prisma format',
};

export default config;
