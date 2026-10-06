# 时间戳转换

基于 Vue 3、Vite 8、UnoCSS 和 Arco Design Vue 的时间戳/日期转换工具。

## 时间转换

日期文字按所选时区的当地时间解析，支持 `YYYY-MM-DD HH:mm:ss` 和斜杠分隔的日期，月、日允许一位数字。转换层会拒绝非法日期及夏令时切换时不存在的当地时间；时钟回拨产生的重复时间会给出两次出现的单选（标注发生顺序和 UTC 偏移），手动输入默认取第一次，点击“此刻”自动选中当前时间对应的那一次。时区列表展示当前偏移，转换标题展示对应日期的实际偏移。日期输入和输出精度为秒。

历史时区偏移中的秒数会参与转换计算。时间戳转换出的公元前日期带有“公元前”标识；日期输入使用四位年份，支持公元 0001–9999 年。

日期和时间面板使用 UTC 模式保存年月日及时分秒，点选不受系统时区的夏令时影响；转换结果仍按所选时区计算。面板的日期格子由 Day.js 生成，0001–0099 年会被换算到 1900 年代，这些年份需要手动输入。

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

## Arco 依赖补丁

通过 pnpm 原生补丁维护 `@arco-design/web-vue@2.58.0`，安装依赖时自动应用。补丁文件位于 `patches/`，由 `pnpm-workspace.yaml` 的 `patchedDependencies` 注册，并记录在锁文件中。

补丁只修改日期与时间合并、时间面板点选后的解析，覆盖 ESM 和 CommonJS 入口。面板收到 UTC 模式的 Day.js 实例时保留该模式，普通当地时间实例保持原行为。`HomeView.vue` 负责将有效日期文字转换为 UTC 面板值；这些实例仅承载日期字段，实际时间戳由 `解析时区日期` 按所选时区计算。

修改现有补丁：

```bash
pnpm patch @arco-design/web-vue@2.58.0
# 修改命令输出的临时目录
pnpm patch-commit <临时目录>
```

升级 Arco 时，补丁需要针对新版本检查并重新生成，同时更新补丁注册和锁文件。验证系统时区为纽约、豪勋爵岛时的夏令时空缺点选，以及重复时间选择、手输、清空和面板确认。补丁文件、注册配置和锁文件应一起提交。
