// Общий код для всех плагинов в этом репо. Каждый плагин вшивает свою копию при сборке:
// плагины работают в отдельных движках и во время работы ничего друг с другом не делят.

// `export` делает функцию доступной для `import` из других файлов.
// `key: string` — аннотация типа: аргумент обязан быть строкой.
// `): boolean` после скобок — тип того, что функция возвращает.
export function readFlag(key: string, fallback: boolean): boolean {
  // `localStorage` — простое хранилище «ключ → строка», переживает перезапуск плагина.
  // `getItem` возвращает `string | null` («строка или null»): null, если ключа ещё нет.
  const stored = localStorage.getItem(key)
  // `условие ? а : б` — тернарный оператор, короткий if/else, который возвращает значение.
  // `===` — строгое сравнение. Нестрогое `==` не используем, у него странные правила.
  return stored === null ? fallback : stored === '1'
}

// `void` — функция ничего не возвращает.
export function writeFlag(key: string, value: boolean): void {
  localStorage.setItem(key, value ? '1' : '0')
}
