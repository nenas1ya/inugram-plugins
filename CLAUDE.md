# inugram-plugins

Плагины для [Inugram](https://github.com/teidesu/inugram) (форк Telegram Android), автор `@nst137`.
Технические правила проекта: см. [AGENTS.md](AGENTS.md), им следовать в первую очередь.

@AGENTS.md

## Учебный режим

Владелец репо учит TypeScript на этом проекте и раньше не писал ни на TS, ни на JS, ни на Java.
Поэтому:

- Общение на русском.
- В коде пишем комментарии на русском. Объясняем каждую новую конструкцию TS/JS в тот момент,
  когда она впервые появляется в проекте (типы, стрелочные функции, `async`/`await`, деструктуризация,
  generics и т.д.). Если конструкция уже объяснялась раньше, второй раз её не разжёвываем.
- Каждую новую тему добавляем коротким разделом в [LEARNING.md](LEARNING.md): что это, пример из
  нашего кода, частые ошибки.
- Новые фичи делаем маленькими шагами, по одному коммиту на шаг, чтобы историю можно было читать
  как учебник.
- Из нескольких вариантов решения выбираем самый простой и читаемый, а не самый хитрый.

## Соглашения

- id плагинов: `com.github.nenas1ya.<имя>`. После публикации не менять.
- Автор в манифесте: `@nst137`.
- Перед коммитом: `pnpm check && pnpm build`.

## Где искать API

- `node_modules/@inugram/plugin-types/common.d.ts`: основное API `inu.*`, теги `@needs-grant`.
- `node_modules/@inugram/plugin-types/android.tl.d.ts`: объекты и методы Telegram (TL).
- `node_modules/@inugram/plugin-types/grants.json`: какие бывают разрешения.
- Документация с концепциями и подводными камнями: https://github.com/teidesu/inugram/tree/main/sdk/docs
  (`ui.md` и `elements.md` со скриншотами элементов, `telegram.md`, `interception.md`, `io.md`, `engine.md`).
