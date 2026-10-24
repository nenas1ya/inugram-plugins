export const ICON_PREFIX = 'msg_'

const ApplicationLoader = inu.jvm.cls('org.telegram.messenger.ApplicationLoader')
const ArrayList = inu.jvm.cls('java.util.ArrayList')
const JavaString = inu.jvm.cls('java.lang.String')
const Runnable = inu.jvm.cls('java.lang.Runnable')

const context: any = ApplicationLoader.getStaticField('applicationContext')

export const drawableClass: any = context.call('getClassLoader').call('loadClass', 'org.telegram.messenger.R$drawable')

// collected in java: there are thousands of drawables, and a routine avoids a bridge call per field
export const javaIconNames: any = new ArrayList()
const collectIconNames = inu.jvm.routine(() => {
  for (const field of drawableClass.getFields()) {
    const name = field.getName()
    if (name.startsWith(ICON_PREFIX)) javaIconNames.add(name)
  }
})
// the routine's own class belongs to the engine and is off limits, so run it through the interface
Runnable.getDeclaredMethod('run').invoke(collectIconNames)

export const ICON_NAMES: string[] = javaIconNames.call('isEmpty')
  ? []
  : JavaString.callStatic('join', ',', javaIconNames).split(',')

export function createIconDrawable(name: string): JavaObject {
  const id: number = drawableClass.call('getField', name).call('getInt', null)
  return context.call('getDrawable', id).call('mutate')
}
