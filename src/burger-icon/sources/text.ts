const AndroidUtilities = inu.jvm.cls('org.telegram.messenger.AndroidUtilities')
const ApplicationLoader = inu.jvm.cls('org.telegram.messenger.ApplicationLoader')
const Bitmap = inu.jvm.cls('android.graphics.Bitmap')
const BitmapConfig = inu.jvm.cls('android.graphics.Bitmap$Config')
const BitmapDrawable = inu.jvm.cls('android.graphics.drawable.BitmapDrawable')
const Canvas = inu.jvm.cls('android.graphics.Canvas')
const Paint = inu.jvm.cls('android.graphics.Paint')
const TextPaint = inu.jvm.cls('android.text.TextPaint')

const SIZE_DP = 24
const TEXT_SIZE_DP = 20

export function createTextDrawable(text: string): JavaObject {
  const size: number = AndroidUtilities.callStatic('dp', SIZE_DP)
  const bitmap = Bitmap.callStatic('createBitmap', size, size, BitmapConfig.getStaticField('ARGB_8888'))

  const paint = new TextPaint(Paint.getStaticField('ANTI_ALIAS_FLAG'))
  paint.call('setTextSize', AndroidUtilities.callStatic('dp', TEXT_SIZE_DP))
  paint.call('setTextAlign', inu.jvm.cls('android.graphics.Paint$Align').getStaticField('CENTER'))

  // drawText takes the baseline, so shift it down by half of the glyph box to center vertically
  const metrics = paint.call('getFontMetrics')
  const ascent: number = metrics.getField('ascent')
  const descent: number = metrics.getField('descent')
  const baseline = size / 2 - (ascent + descent) / 2

  new Canvas(bitmap).call('drawText', text, size / 2, baseline, paint)

  const resources = ApplicationLoader.getStaticField('applicationContext').call('getResources')
  return new BitmapDrawable(resources, bitmap)
}
