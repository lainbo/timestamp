# 时间戳转换

基于 Vue 3、Vite 8、UnoCSS 和 Arco Design Vue 的时间戳/日期转换工具。

## 时间转换

日期文字按所选时区的当地时间解析，支持 `YYYY-MM-DD HH:mm:ss` 和斜杠分隔的日期，月、日允许一位数字。转换层会拒绝非法日期及夏令时切换时不存在的当地时间。

时区列表展示当前偏移，转换标题展示对应日期的实际偏移。日期输入和输出精度为秒。

已知限制：夏令时回拨时的重复时间暂不提供消歧，Day.js 的默认选择可能随运行时的季节改变。Arco 日期选择器在系统时区的夏令时空缺时段仍可能存在输入、回显限制。

## 开发

要求 Node.js `^20.19.0 || >=22.12.0`，并使用 pnpm。

```bash
pnpm install
pnpm dev
```

## 工具链

```bash
pnpm lint          # Oxlint
pnpm lint:fix
pnpm format        # Oxfmt
pnpm format:check
pnpm build         # Vite 8 + Rolldown/Oxc
pnpm check         # lint + format check + build
pnpm deps:check    # 检查依赖更新
```
