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
    'burger-icon': {
      entry: 'src/burger-icon/index.ts',
      manifest: {
        id: 'com.github.nenas1ya.burger-icon',
        name: 'Burger Icon',
        author: '@nst137',
        version: '0.1.0',
        description: {
          en: 'Replaces the burger menu icon in the chat list',
          ru: 'Меняет иконку бургер-меню в списке чатов',
        },
        icon: 'inu://more',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      },
    },
  },
})
