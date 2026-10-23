const STORAGE_KEY = 'icon'

interface IconOption {
  title: string
  resource: string | null
}

const ICONS: IconOption[] = [
  { title: 'Стандартный бургер', resource: null },
  { title: 'Шестерёнка', resource: 'msg_settings' },
  { title: 'Закладка', resource: 'msg_saved' },
  { title: 'Звезда', resource: 'msg_fave' },
  { title: 'Бот', resource: 'msg_bot' },
  { title: 'Контакт', resource: 'msg_contacts' },
  { title: 'Группа', resource: 'msg_groups' },
  { title: 'Канал', resource: 'msg_channel' },
  { title: 'Замок', resource: 'msg_secret' },
  { title: 'Архив', resource: 'msg_archive' },
  { title: 'Поиск', resource: 'msg_search' },
  { title: 'Инфо', resource: 'msg_info' },
  { title: 'Карандаш', resource: 'msg_edit' },
  { title: 'Глаз', resource: 'msg_views' },
  { title: 'Скрепка', resource: 'msg_pin' },
]

const MenuDrawable = inu.jvm.cls('org.telegram.ui.ActionBar.MenuDrawable')
const Theme: any = inu.jvm.cls('org.telegram.ui.ActionBar.Theme')
const AndroidUtilities = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
const ApplicationLoader = inu.jvm.cls('org.telegram.messenger.ApplicationLoader')
const DrawableIds = inu.jvm.cls('org.telegram.messenger.R$drawable')
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

function getSelectedIndex(): number {
  const stored = localStorage.getItem(STORAGE_KEY)
  const index = ICONS.findIndex(option => option.resource === stored)
  return index === -1 ? 0 : index
}

function applyIcon(option: IconOption): void {
  if (option.resource === null) {
    replacement.call('set', null)
  } else {
    const context = ApplicationLoader.getStaticField('applicationContext')
    const id: number = DrawableIds.getStaticField(option.resource)
    replacement.call('set', context.call('getDrawable', id).call('mutate'))
  }
  AndroidUtilities.callStatic('runOnUIThread', redraw)
}

applyIcon(ICONS[getSelectedIndex()])

inu.registerSettings(inu.ui.settingsPage({
  title: 'Иконка меню',
  items: () => {
    const selected = ICONS[getSelectedIndex()]
    return [
      inu.ui.select({
        id: 'icon',
        text: 'Иконка',
        icon: selected.resource === null ? undefined : inu.android.resourceIcon(selected.resource),
        items: ICONS.map(option => option.title),
        selected: getSelectedIndex(),
        onChange: (index) => {
          const option = ICONS[index]
          if (option.resource === null) {
            localStorage.removeItem(STORAGE_KEY)
          } else {
            localStorage.setItem(STORAGE_KEY, option.resource)
          }
          applyIcon(option)
        },
      }),
    ]
  },
}))
