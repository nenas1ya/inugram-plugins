import { drawableClass, ICON_NAMES, javaIconNames } from './sources/icon.js'

const AndroidUtilities = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
const LaunchActivity = inu.jvm.cls('org.telegram.ui.LaunchActivity')
const Theme: any = inu.jvm.cls('org.telegram.ui.ActionBar.Theme')
const AtomicInteger = inu.jvm.cls('java.util.concurrent.atomic.AtomicInteger')
const BaseAdapter = inu.jvm.cls('android.widget.BaseAdapter')
const BottomSheet = inu.jvm.cls('org.telegram.ui.ActionBar.BottomSheet')
const GridView = inu.jvm.cls('android.widget.GridView')
const ImageView = inu.jvm.cls('android.widget.ImageView')
const FrameLayout = inu.jvm.cls('android.widget.FrameLayout')
const FrameLayoutParams = inu.jvm.cls('android.widget.FrameLayout$LayoutParams')
const CellLayoutParams = inu.jvm.cls('android.widget.AbsListView$LayoutParams')
const GradientDrawable = inu.jvm.cls('android.graphics.drawable.GradientDrawable')
const OnItemClickListener = inu.jvm.cls('android.widget.AdapterView$OnItemClickListener')

const dp = (value: number): number => AndroidUtilities.callStatic('dp', value)

const CELL_SIZE = dp(48)
const GRID_HEIGHT = dp(420)
const SCALE_CENTER = inu.jvm.cls('android.widget.ImageView$ScaleType').getStaticField('CENTER')
const ICON_COLOR_KEY: number = Theme.getStaticField('key_dialogIcon')
const ACCENT_COLOR_KEY: number = Theme.getStaticField('key_featuredStickers_addButton')

const selected: any = new AtomicInteger(-1)
const selectionBackground = new GradientDrawable()
selectionBackground.call('setCornerRadius', dp(8))

// getView runs for every cell scrolled into view, so the adapter is all routines
const IconAdapter = inu.jvm.defineClass({
  superclass: BaseAdapter,
  methods: {
    getCount: {
      body: inu.jvm.routine(() => {
        return javaIconNames.size()
      }),
    },
    getItem: {
      body: inu.jvm.routine((position) => {
        return javaIconNames.get(position)
      }),
    },
    getItemId: {
      body: inu.jvm.routine((position) => {
        return position
      }),
    },
    getView: {
      body: inu.jvm.routine((position, convertView, parent) => {
        let cell = convertView
        if (cell === null) {
          cell = new ImageView(parent.getContext())
          cell.setScaleType(SCALE_CENTER)
          cell.setLayoutParams(new CellLayoutParams(-1, CELL_SIZE))
        }
        const id = drawableClass.getField(javaIconNames.get(position)).getInt(null)
        const icon = parent.getContext().getDrawable(id).mutate()
        icon.setTint(Theme.getColor(ICON_COLOR_KEY))
        cell.setImageDrawable(icon)
        cell.setBackground(position === selected.get() ? selectionBackground : null)
        return cell
      }),
    },
  },
})
const adapter = new IconAdapter()

let currentSheet: JavaObject | null = null
let finishPick: (name: string | null) => void = () => {}

const ClickListener = inu.jvm.defineClass({
  interfaces: [OnItemClickListener],
  methods: {
    onItemClick: (_self, _parent, _view, position: number) => {
      finishPick(ICON_NAMES[position])
      currentSheet?.call('dismiss')
    },
  },
})
const clickListener = new ClickListener()

function onUiThread<T>(work: () => T): Promise<T> {
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

function showSheet(): void {
  const activity = LaunchActivity.getStaticField('instance')
  const grid = new GridView(activity)
  grid.call('setNumColumns', GridView.getStaticField('AUTO_FIT'))
  grid.call('setColumnWidth', CELL_SIZE)
  grid.call('setStretchMode', GridView.getStaticField('STRETCH_COLUMN_WIDTH'))
  grid.call('setAdapter', adapter)
  grid.call('setOnItemClickListener', clickListener)
  grid.call('setSelection', Math.max(selected.call('get'), 0))

  // the sheet wraps its content height, which would squash a grid without a fixed one
  const container = new FrameLayout(activity)
  container.call('addView', grid, new FrameLayoutParams(-1, GRID_HEIGHT))

  const sheet = new BottomSheet(activity, false)
  sheet.call('setTitle', 'Иконка')
  sheet.call('setCustomView', container)
  // a swipe down would otherwise close the sheet instead of scrolling the grid
  sheet.call('setCanDismissWithSwipe', false)
  sheet.call('setOnDismissListener', inu.jvm.runnable(() => finishPick(null)))
  sheet.call('show')
  currentSheet = sheet
}

export function pickIcon(current: string): Promise<string | null> {
  selected.call('set', ICON_NAMES.indexOf(current))
  selectionBackground.call('setStroke', dp(2), Theme.getColor(ACCENT_COLOR_KEY))

  return new Promise((resolve, reject) => {
    finishPick = resolve
    onUiThread(showSheet).catch(reject)
  })
}
