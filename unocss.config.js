import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'
export default defineConfig({
  shortcuts: [
    {
      'flex-c': 'flex items-center justify-center'
    }
  ],
  presets: [
    presetWind(),
    presetAttributify(),
    presetIcons({
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
        'margin-bottom': '3px'
      }
    })
  ],
  theme: {
    colors: {
      primary: '#165dff'
    }
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
  variants: [
    // 因为.scss文件里面,uno不能写"!xxx"去表示 !importannt ,会报错
    // 这里为important写一种变体，让以"I_"开头的class也是important，兼容scss文件
    matcher => {
      if (!matcher.startsWith('I_')) return matcher
      return {
        matcher: matcher.slice(2),
        body: body => {
          body.forEach(v => {
            if (v[1]) v[1] += ' !important'
          })
          return body
        }
      }
    }
  ]
})
