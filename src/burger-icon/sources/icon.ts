export interface IconOption {
  title: string
  resource: string
}

export const ICONS: IconOption[] = [
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

const ApplicationLoader = inu.jvm.cls('org.telegram.messenger.ApplicationLoader')
const DrawableIds = inu.jvm.cls('org.telegram.messenger.R$drawable')

export function createIconDrawable(resource: string): JavaObject {
  const context = ApplicationLoader.getStaticField('applicationContext')
  const id: number = DrawableIds.getStaticField(resource)
  return context.call('getDrawable', id).call('mutate')
}
