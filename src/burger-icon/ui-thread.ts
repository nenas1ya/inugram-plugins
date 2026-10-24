const AndroidUtilities = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')

export function onUiThread<T>(work: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    AndroidUtilities.callStatic('runOnUIThread', inu.jvm.runnable(() => {
      try {
        resolve(work())
      } catch (error) {
        reject(error)
      }
    }))
  })
}
