// Стартовый плагин из шаблона `inu init`, с учебными комментариями.
// Код выполняется сверху вниз один раз, когда плагин загружается.

// `import` берёт функции из другого файла. Расширение `.js`, хотя сам файл `storage.ts`:
// так принято в TypeScript, потому что после сборки там будет JS. Импорт работает только
// при сборке: `inu build` склеивает всё в один файл.
import { readFlag, writeFlag } from '../shared/storage.js'

// `const` объявляет переменную, которую нельзя переприсвоить. Если значение будет меняться,
// используют `let`. Старый `var` не используем.
const GREET_KEY = 'greet'

// `inu` — глобальный объект с API Inugram, импортировать его не нужно.
// `inu.ui.settingsPage({...})` создаёт страницу настроек. В фигурных скобках объект:
// набор пар `ключ: значение`, через который функции передают много параметров сразу.
inu.registerSettings(inu.ui.settingsPage({
  title: 'Hello',
  // `() => [...]` — стрелочная функция: без аргументов, возвращает массив `[...]`.
  // Inugram вызывает её заново при каждой перерисовке страницы, поэтому значения
  // (например, `checked`) всегда берутся свежие.
  items: () => [
    inu.ui.header('Hello'),
    inu.ui.check({
      text: 'Say hello on load',
      checked: readFlag(GREET_KEY, true),
      // Колбэк: функция, которую мы отдаём приложению, а оно вызовет её, когда юзер тапнет переключатель.
      // Тип `checked` (boolean) мы не пишем: TypeScript сам выводит его из типов `inu.ui.check`.
      onChange: (checked) => {
        writeFlag(GREET_KEY, checked)
      },
    }),
  ],
}))

if (readFlag(GREET_KEY, true)) {
  // Вывод виден в терминале при `pnpm dev`.
  console.log('hello from inugram', inu.info().appVersion)
}
