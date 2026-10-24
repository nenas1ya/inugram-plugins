export const ICON_PREFIX = 'msg_'
const KNOWN_ICON = 'msg_settings'

const ApplicationLoader = inu.jvm.cls('org.telegram.messenger.ApplicationLoader')
const ArrayList = inu.jvm.cls('java.util.ArrayList')
const JavaString = inu.jvm.cls('java.lang.String')
const Runnable = inu.jvm.cls('java.lang.Runnable')

const context = ApplicationLoader.getStaticField('applicationContext')
export const resources = context.call('getResources')
export const PACKAGE_NAME: string = context.call('getPackageName')

export function getIconId(name: string): number {
  return resources.call('getIdentifier', name, 'drawable', PACKAGE_NAME)
}

// drawable ids are numbered from 0 within their package and type, so walking them from the type's
// first id until a lookup fails visits every drawable; a routine keeps the thousands of calls in java
const firstDrawableId = getIconId(KNOWN_ICON) & ~0xFFFF
export const javaIconNames: any = new ArrayList()
const collectIconNames = inu.jvm.routine(() => {
  for (let entry = 0; entry <= 0xFFFF; entry++) {
    let name = null
    try {
      name = resources.getResourceEntryName(firstDrawableId + entry)
    } catch (e) {
      break
    }
    if (name.startsWith(ICON_PREFIX)) javaIconNames.add(name)
  }
})
// the routine's own class belongs to the engine and is off limits, so run it through the interface
Runnable.getDeclaredMethod('run').invoke(collectIconNames)

export const ICON_NAMES: string[] = javaIconNames.call('isEmpty')
  ? []
  : JavaString.callStatic('join', ',', javaIconNames).split(',')

export function createIconDrawable(name: string): JavaObject {
  return context.call('getDrawable', getIconId(name)).call('mutate')
}
