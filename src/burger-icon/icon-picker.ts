import { ICON_NAMES, javaIconNames, PACKAGE_NAME, resources } from './sources/icon.js'

const AndroidUtilities = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
const LaunchActivity = inu.jvm.cls('org.telegram.ui.LaunchActivity')
const Theme: any = inu.jvm.cls('org.telegram.ui.ActionBar.Theme')
const AtomicInteger = inu.jvm.cls('java.util.concurrent.atomic.AtomicInteger')
const BaseAdapter = inu.jvm.cls('android.widget.BaseAdapter')
const GridView = inu.jvm.cls('android.widget.GridView')
const ImageView = inu.jvm.cls('android.widget.ImageView')
const FrameLayout = inu.jvm.cls('android.widget.FrameLayout')
const FrameLayoutParams = inu.jvm.cls('android.widget.FrameLayout$LayoutParams')
const CellLayoutParams = inu.jvm.cls('android.widget.AbsListView$LayoutParams')
const GradientDrawable = inu.jvm.cls('android.graphics.drawable.GradientDrawable')
const OnItemClickListener = inu.jvm.cls('android.widget.AdapterView$OnItemClickListener')

const dp = (value: number): number => AndroidUtilities.callStatic('dp', value)

const CELL_SIZE = dp(48)
const GRID_HEIGHT = dp(360)
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
        const id = resources.getIdentifier(javaIconNames.get(position), 'drawable', PACKAGE_NAME)
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

const ClickListener = inu.jvm.defineClass({
  interfaces: [OnItemClickListener],
  methods: {
    onItemClick: (_self, _parent, _view, position: number) => {
      selected.call('set', position)
      adapter.call('notifyDataSetChanged')
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

function createGrid(): JavaObject {
  const activity = LaunchActivity.getStaticField('instance')
  const grid = new GridView(activity)
  grid.call('setNumColumns', GridView.getStaticField('AUTO_FIT'))
  grid.call('setColumnWidth', CELL_SIZE)
  grid.call('setStretchMode', GridView.getStaticField('STRETCH_COLUMN_WIDTH'))
  grid.call('setAdapter', adapter)
  grid.call('setOnItemClickListener', clickListener)
  grid.call('setSelection', Math.max(selected.call('get'), 0))

  // the dialog puts its body in a ScrollView, which would squash a grid without a fixed height
  const container = new FrameLayout(activity)
  container.call('addView', grid, new FrameLayoutParams(-1, GRID_HEIGHT))
  return container
}

export async function pickIcon(current: string): Promise<string | null> {
  if (typeof inu.jvm.runnable !== 'function') throw new Error('this Inugram has no inu.jvm.runnable')
  if (typeof inu.android.nativeView !== 'function') throw new Error('this Inugram has no inu.android.nativeView')

  selected.call('set', ICON_NAMES.indexOf(current))
  selectionBackground.call('setStroke', dp(2), Theme.getColor(ACCENT_COLOR_KEY))

  const grid = await onUiThread(createGrid)
  const answer = await inu.ui.dialog({
    title: 'Иконка',
    body: inu.android.nativeView(grid),
    positive: 'Выбрать',
    negative: 'Отмена',
  })

  const index: number = selected.call('get')
  return answer === 'positive' && index !== -1 ? ICON_NAMES[index] : null
}
