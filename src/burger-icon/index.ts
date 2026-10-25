import { pickEmoji } from './emoji-picker.js'
import { pickIcon } from './icon-picker.js'
import { createEmojiDrawable } from './sources/emoji.js'
import { createIconDrawable, ICON_NAMES, ICON_PREFIX } from './sources/icon.js'
import { onUiThread } from './ui-thread.js'

type Source = 'icon' | 'emoji'

const SOURCES: { id: Source, title: string }[] = [
  { id: 'icon', title: 'Иконка Telegram' },
  { id: 'emoji', title: 'Эмодзи' },
]

const SOURCE_KEY = 'source'
const ICON_KEY = 'icon'
const EMOJI_KEY = 'emoji'
const DEFAULT_ICON = 'msg_settings'

const MenuDrawable = inu.jvm.cls('org.telegram.ui.ActionBar.MenuDrawable')
const ActionBar = inu.jvm.cls('org.telegram.ui.ActionBar.ActionBar')
const ImageView = inu.jvm.cls('android.widget.ImageView')
const Theme: any = inu.jvm.cls('org.telegram.ui.ActionBar.Theme')
const AtomicBoolean = inu.jvm.cls('java.util.concurrent.atomic.AtomicBoolean')
const AtomicReference = inu.jvm.cls('java.util.concurrent.atomic.AtomicReference')
const InvalidateHolder = inu.jvm.cls('org.telegram.ui.Components.AnimatedEmojiSpan$InvalidateHolder')

const ICON_COLOR_KEY: number = Theme.getStaticField('key_actionBarDefaultIcon')

// the hook runs on the ui thread, so it reads these instead of plugin variables
const replacement: any = new AtomicReference()
const tintReplacement: any = new AtomicBoolean(true)
const lastMenu: any = new AtomicReference()

inu.xposed.hookMethod(MenuDrawable.getDeclaredMethod('draw'), {
  before: inu.xposed.routine((ctx) => {
    const menu = ctx.thisObject
    lastMenu.set(menu)

    const icon = replacement.get()
    if (icon === null) return
    // the same drawable is the bots' menu button next to the message field; only the action bar one is replaced
    const host = menu.getCallback()
    if (!(host instanceof ImageView) || !(host.getParent() instanceof ActionBar)) return
    // rotation and type animations advance inside the original draw, so only a resting burger is replaced
    if (menu.currentRotation !== 0 || menu.finalRotation !== 0) return
    if (menu.type !== 0 || menu.typeAnimationProgress < 1) return

    icon.setBounds(menu.getBounds())
    if (tintReplacement.get()) {
      icon.setTint(menu.iconColor === 0 ? Theme.getColor(ICON_COLOR_KEY) : menu.iconColor)
    }
    icon.setAlpha(menu.alpha)
    icon.draw(ctx.args[0])
    ctx.setReturnValue(null)
  }),
})

// an animated emoji asks its holders to redraw on every frame and once it has loaded
const MenuInvalidator = inu.jvm.defineClass({
  interfaces: [InvalidateHolder],
  methods: {
    invalidate: {
      body: inu.jvm.routine(() => {
        const menu = lastMenu.get()
        if (menu !== null) menu.invalidateSelf()
      }),
    },
  },
})
const menuInvalidator = new MenuInvalidator()

function getSource(): Source {
  return localStorage.getItem(SOURCE_KEY) === 'emoji' ? 'emoji' : 'icon'
}

function getIconName(): string | null {
  const stored = localStorage.getItem(ICON_KEY)
  if (stored !== null && ICON_NAMES.includes(stored)) return stored
  if (ICON_NAMES.includes(DEFAULT_ICON)) return DEFAULT_ICON
  return ICON_NAMES[0] ?? null
}

function getEmojiId(): string | null {
  return localStorage.getItem(EMOJI_KEY)
}

let shownEmoji: JavaObject | null = null

function applyReplacement(): Promise<void> {
  // storage is read here, on the plugin thread; the drawables are made on the ui thread
  const source = getSource()
  const iconName = getIconName()
  const emojiId = getEmojiId()

  return onUiThread(() => {
    shownEmoji?.call('removeView', menuInvalidator)
    shownEmoji = null

    let drawable: JavaObject | null = null
    if (source === 'emoji') {
      if (emojiId !== null) {
        drawable = createEmojiDrawable(emojiId)
        drawable.call('addView', menuInvalidator)
        shownEmoji = drawable
      }
    } else if (iconName !== null) {
      drawable = createIconDrawable(iconName)
    }

    tintReplacement.call('set', source === 'icon')
    replacement.call('set', drawable)
    lastMenu.call('get')?.call('invalidateSelf')
  })
}

function showError(title: string, error: unknown): void {
  console.error(title, error)
  void inu.ui.dialog({
    title,
    message: error instanceof Error ? `${error}\n\n${error.stack}` : String(error),
    positive: 'OK',
  })
}

applyReplacement().catch(error => console.error('could not apply the replacement', error))

inu.onUnload(() => onUiThread(() => {
  shownEmoji?.call('removeView', menuInvalidator)
  lastMenu.call('get')?.call('invalidateSelf')
}))

function iconSettings(): inu.UIElement[] {
  const iconName = getIconName()
  if (iconName === null) {
    return [inu.ui.separator('Не удалось найти иконки Telegram')]
  }

  return [
    inu.ui.button({
      id: 'icon',
      text: 'Иконка',
      icon: inu.android.resourceIcon(iconName),
      value: iconName.slice(ICON_PREFIX.length),
      onClick: async () => {
        try {
          const name = await pickIcon(iconName)
          if (name === null) return
          localStorage.setItem(ICON_KEY, name)
          await applyReplacement()
          page.invalidate()
        } catch (error) {
          showError('Ошибка выбора иконки', error)
        }
      },
    }),
  ]
}

function emojiSettings(): inu.UIElement[] {
  const emojiId = getEmojiId()
  return [
    inu.ui.button({
      id: 'emoji',
      text: 'Эмодзи',
      icon: emojiId === null ? undefined : inu.icons.customEmoji(emojiId),
      value: emojiId === null ? 'не выбран' : undefined,
      onClick: async () => {
        try {
          const id = await pickEmoji()
          if (id === null) return
          localStorage.setItem(EMOJI_KEY, id)
          await applyReplacement()
          page.invalidate()
        } catch (error) {
          showError('Ошибка выбора эмодзи', error)
        }
      },
    }),
  ]
}

const page = inu.ui.settingsPage({
  title: 'Иконка меню',
  items: () => [
    inu.ui.select({
      id: 'source',
      text: 'Что показывать',
      items: SOURCES.map(source => source.title),
      selected: SOURCES.findIndex(source => source.id === getSource()),
      onChange: (index) => {
        localStorage.setItem(SOURCE_KEY, SOURCES[index].id)
        applyReplacement().catch(error => showError('Ошибка', error))
      },
    }),
    ...(getSource() === 'emoji' ? emojiSettings() : iconSettings()),
  ],
})

inu.registerSettings(page)
