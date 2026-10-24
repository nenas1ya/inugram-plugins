import { onUiThread } from './ui-thread.js'

const LaunchActivity = inu.jvm.cls('org.telegram.ui.LaunchActivity')
const SelectAnimatedEmojiDialog = inu.jvm.cls('org.telegram.ui.SelectAnimatedEmojiDialog')
const AlertDialogBuilder = inu.jvm.cls('org.telegram.ui.ActionBar.AlertDialog$Builder')
const OnDismissListener = inu.jvm.cls('android.content.DialogInterface$OnDismissListener')

const TYPE_EMOJI_STATUS: number = SelectAnimatedEmojiDialog.getStaticField('TYPE_EMOJI_STATUS')
const PICKER_HEIGHT_DP = 420

let finishPick: (documentId: string | null) => void = () => {}
let openDialog: JavaObject | null = null

// the status picker Telegram shows for emoji statuses, without its popup background
const EmojiPicker = inu.jvm.defineClass({
  superclass: SelectAnimatedEmojiDialog,
  methods: {
    // false skips the fly-to-status animation and goes straight to onEmojiSelected
    willApplyEmoji: () => false,
    onEmojiSelected: (_self, _view, documentId) => {
      if (documentId === null) return
      finishPick(String(documentId))
      openDialog?.call('dismiss')
    },
  },
  constructors: [{
    params: ['android.content.Context'],
    superParams: [
      'org.telegram.ui.ActionBar.BaseFragment',
      'android.content.Context',
      'boolean',
      'java.lang.Integer',
      'int',
      'boolean',
      'org.telegram.ui.ActionBar.Theme$ResourcesProvider',
      'int',
    ],
    super: (context) => [null, context, false, null, TYPE_EMOJI_STATUS, false, null, 0],
  }],
})

const DismissListener = inu.jvm.defineClass({
  interfaces: [OnDismissListener],
  methods: {
    onDismiss: () => finishPick(null),
  },
})
const dismissListener = new DismissListener()

function showPicker(): void {
  const activity = LaunchActivity.getStaticField('instance')
  const picker = new EmojiPicker(activity)
  const dialog = new AlertDialogBuilder(activity)
    .call('setTitle', 'Эмодзи')
    .call('setView', picker, PICKER_HEIGHT_DP)
    .call('create')
  dialog.call('setOnDismissListener', dismissListener)
  dialog.call('show')
  // the picker is built for a popup, which calls onShow; embedded, it needs the call to start loading
  picker.call('post', inu.jvm.runnable(() => picker.call('onShow', null)))
  openDialog = dialog
}

export function pickEmoji(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    finishPick = resolve
    onUiThread(showPicker).catch(reject)
  })
}
