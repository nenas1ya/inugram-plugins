import { pickIcon } from './icon-picker.js'
import { createIconDrawable, ICON_NAMES, ICON_PREFIX } from './sources/icon.js'
import { createTextDrawable } from './sources/text.js'

type Source = 'icon' | 'text'

const SOURCES: { id: Source, title: string }[] = [
  { id: 'icon', title: 'Иконка Telegram' },
  { id: 'text', title: 'Символ' },
]

const SOURCE_KEY = 'source'
const ICON_KEY = 'icon'
const TEXT_KEY = 'text'
const DEFAULT_TEXT = '✦'
const DEFAULT_ICON = 'msg_settings'

const MenuDrawable = inu.jvm.cls('org.telegram.ui.ActionBar.MenuDrawable')
const Theme: any = inu.jvm.cls('org.telegram.ui.ActionBar.Theme')
const AndroidUtilities = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
const AtomicReference = inu.jvm.cls('java.util.concurrent.atomic.AtomicReference')

const ICON_COLOR_KEY: number = Theme.getStaticField('key_actionBarDefaultIcon')

// the hook runs on the ui thread, so it reads these instead of plugin variables
const replacement: any = new AtomicReference()
const lastMenu: any = new AtomicReference()

inu.xposed.hookMethod(MenuDrawable.getDeclaredMethod('draw'), {
  before: inu.xposed.routine((ctx) => {
    const menu = ctx.thisObject
    lastMenu.set(menu)

    const icon = replacement.get()
    if (icon === null) return
    // rotation and type animations advance inside the original draw, so only a resting burger is replaced
    if (menu.currentRotation !== 0 || menu.finalRotation !== 0) return
    if (menu.type !== 0 || menu.typeAnimationProgress < 1) return

    icon.setBounds(menu.getBounds())
    icon.setTint(menu.iconColor === 0 ? Theme.getColor(ICON_COLOR_KEY) : menu.iconColor)
    icon.setAlpha(menu.alpha)
    icon.draw(ctx.args[0])
    ctx.setReturnValue(null)
  }),
})

const redraw = inu.jvm.routine(() => {
  const menu = lastMenu.get()
  if (menu !== null) menu.invalidateSelf()
})

function getSource(): Source {
  return localStorage.getItem(SOURCE_KEY) === 'text' ? 'text' : 'icon'
}

function getIconName(): string {
  const stored = localStorage.getItem(ICON_KEY)
  if (stored !== null && ICON_NAMES.includes(stored)) return stored
  return ICON_NAMES.includes(DEFAULT_ICON) ? DEFAULT_ICON : ICON_NAMES[0]
}

function getText(): string {
  return localStorage.getItem(TEXT_KEY) ?? DEFAULT_TEXT
}

function applyReplacement(): void {
  const drawable = getSource() === 'text'
    ? createTextDrawable(getText())
    : createIconDrawable(getIconName())
  replacement.call('set', drawable)
  AndroidUtilities.callStatic('runOnUIThread', redraw)
}

applyReplacement()

function sourceSettings(): inu.UIElement[] {
  if (getSource() === 'text') {
    return [
      inu.ui.button({
        id: 'text',
        text: 'Символ',
        value: getText(),
        onClick: async () => {
          const text = await inu.ui.prompt({ title: 'Символ вместо бургера', value: getText(), selectAll: true })
          if (text === null || text.trim() === '') return
          localStorage.setItem(TEXT_KEY, text.trim())
          applyReplacement()
          page.invalidate()
        },
      }),
    ]
  }

  return [
    inu.ui.button({
      id: 'icon',
      text: 'Иконка',
      icon: inu.android.resourceIcon(getIconName()),
      value: getIconName().slice(ICON_PREFIX.length),
      onClick: async () => {
        const name = await pickIcon(getIconName())
        if (name === null) return
        localStorage.setItem(ICON_KEY, name)
        applyReplacement()
        page.invalidate()
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
        applyReplacement()
      },
    }),
    ...sourceSettings(),
  ],
})

inu.registerSettings(page)
