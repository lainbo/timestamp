import {
  defineConfig,
  presetIcons,
  presetWebFonts,
  presetWind3,
  transformerDirectives
} from 'unocss'
export default defineConfig({
  shortcuts: [
    {
      'flex-c': 'flex items-center justify-center'
    }
  ],
  presets: [
    presetWind3(),
    presetWebFonts({
      fonts: {
        provider: 'bunny',
        Inter: [{ name: 'Inter', weights: ['500'] }]
      }
    }),
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
  transformers: [transformerDirectives()]
})
