const AnimatedEmojiDrawable = inu.jvm.cls('org.telegram.ui.Components.AnimatedEmojiDrawable')
const UserConfig = inu.jvm.cls('org.telegram.messenger.UserConfig')

const CACHE_TYPE: number = AnimatedEmojiDrawable.getStaticField('CACHE_TYPE_EMOJI_STATUS')

// custom emoji ids do not fit in a js number, so they are kept as strings and passed as bigint
export function createEmojiDrawable(documentId: string): JavaObject {
  const account: number = UserConfig.getStaticField('selectedAccount')
  return AnimatedEmojiDrawable.callStatic('make', account, CACHE_TYPE, BigInt(documentId))
}
