import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    hello: {
      entry: 'src/hello/index.ts',
      manifest: {
        id: 'com.github.nenas1ya.hello',
        name: 'Hello',
        author: '@nst137',
        version: '1.0.0',
        description: 'a starting point',
        icon: 'inu://bot',
      },
    },
  },
})
