export const ICON_PREFIX = 'msg_'

const ApplicationLoader = inu.jvm.cls('org.telegram.messenger.ApplicationLoader')
const ArrayList = inu.jvm.cls('java.util.ArrayList')
const JavaClass = inu.jvm.cls('java.lang.Class')
const JavaString = inu.jvm.cls('java.lang.String')
const Runnable = inu.jvm.cls('java.lang.Runnable')

const context: any = ApplicationLoader.getStaticField('applicationContext')

const DrawableIds = inu.jvm.cls('org.telegram.messenger.R$drawable')

// members of a class handle are its static ones, so Class.getFields is called through reflection,
// passing the class itself as the receiver, which the typings do not expect
const drawableFields = JavaClass.getDeclaredMethod('getFields').invoke(DrawableIds as unknown as JavaObject)

// collected in java: there are thousands of drawables, and a routine avoids a bridge call per field
export const javaIconNames: any = new ArrayList()
export const javaIconIds: any = new ArrayList()
const collectIconNames = inu.jvm.routine(() => {
  for (const field of drawableFields) {
    const name = field.getName()
    if (name.startsWith(ICON_PREFIX)) {
      javaIconNames.add(name)
      javaIconIds.add(field.getInt(null))
    }
  }
})
// the routine's own class belongs to the engine and is off limits, so run it through the interface
Runnable.getDeclaredMethod('run').invoke(collectIconNames)

export const ICON_NAMES: string[] = javaIconNames.call('isEmpty')
  ? []
  : JavaString.callStatic('join', ',', javaIconNames).split(',')

export function createIconDrawable(name: string): JavaObject {
  const id: number = DrawableIds.getStaticField(name)
  return context.call('getDrawable', id).call('mutate')
}
