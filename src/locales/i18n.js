import * as RNLocalize from 'react-native-localize'
import humanizeDuration from 'humanize-duration'
import i18n from 'i18n-js'
import moment from 'moment'

i18n.defaultLocale = 'en'
i18n.locale = 'en'
i18n.fallbacks = true

const shortHumanizer = humanizeDuration.humanizer({
  language: 'short',
  units: ['m', 's'],
  round: true,
  spacer: '',
  conjunction: ' ',
  serialComma: false
})

export const loadLocale = async () => {
  for (const locale of RNLocalize.getLocales()) {
    if (i18n.translations[locale.languageCode] !== null) {
      i18n.locale = locale.languageCode
      i18n.uses24HourClock = RNLocalize.uses24HourClock()
      switch (locale.languageCode) {
        case 'de':
          import('./de.json').then(de => {
            i18n.translations = { de }
            i18n.leftButton = require('../assets/de/left.png')
            i18n.rightButton = require('../assets/de/right.png')
            shortHumanizer.languages.short = {
              m: () => 'min',
              s: () => 's'
            }
            import('moment/locale/de').then(() => moment.locale('de'))
          })
          break
        default:
        case 'en':
          import('./en.json').then(en => {
            i18n.translations = { en }
            i18n.leftButton = require('../assets/en/left.png')
            i18n.rightButton = require('../assets/en/right.png')
            shortHumanizer.languages.short = {
              m: () => 'min',
              s: () => 's'
            }
          })
          break
        case 'es':
          import('./es.json').then(es => {
            i18n.translations = { es }
            i18n.leftButton = require('../assets/es/left.png')
            i18n.rightButton = require('../assets/es/right.png')
            shortHumanizer.languages.short = {
              m: () => 'min',
              s: () => 's'
            }
            import('moment/locale/es').then(() => moment.locale('es'))
          })
          break
        case 'fr':
          import('./fr.json').then(fr => {
            i18n.translations = { fr }
            i18n.leftButton = require('../assets/fr/left.png')
            i18n.rightButton = require('../assets/fr/right.png')
            shortHumanizer.languages.short = {
              m: () => 'min',
              s: () => 's'
            }
            import('moment/locale/fr').then(() => moment.locale('fr'))
          })
          break
        case 'it':
          import('./it.json').then(it => {
            i18n.translations = { it }
            i18n.leftButton = require('../assets/it/left.png')
            i18n.rightButton = require('../assets/it/right.png')
            shortHumanizer.languages.short = {
              m: () => 'min',
              s: () => 's'
            }
            import('moment/locale/it').then(() => moment.locale('it'))
          })
          break
        case 'ja':
          import('./ja.json').then(ja => {
            i18n.translations = { ja }
            i18n.leftButton = require('../assets/ja/left.png')
            i18n.rightButton = require('../assets/ja/right.png')
            shortHumanizer.languages.short = {
              m: () => '分',
              s: () => '秒'
            }
            import('moment/locale/ja').then(() => moment.locale('ja'))
          })
          break
        case 'pt':
          import('./pt.json').then(pt => {
            i18n.translations = { pt }
            i18n.leftButton = require('../assets/pt/left.png')
            i18n.rightButton = require('../assets/pt/right.png')
            shortHumanizer.languages.short = {
              m: () => 'min',
              s: () => 's'
            }
            import('moment/locale/pt').then(() => moment.locale('pt'))
          })
          break
        case 'ru':
          import('./ru.json').then(ru => {
            i18n.translations = { ru }
            i18n.leftButton = require('../assets/ru/left.png')
            i18n.rightButton = require('../assets/ru/right.png')
            shortHumanizer.languages.short = {
              m: () => 'мин',
              s: () => 's'
            }
            import('moment/locale/ru').then(() => moment.locale('ru'))
          })
          break
      }
      break
    }
  }
}

i18n.formatItem = n => {
  let item = ''
  switch (i18n.locale) {
    case 'de':
      if (n == 1) {
        item = '1 Futtermittel'
      } else {
        item = `${n} Fütterungen`
      }
      break
    default:
    case 'en':
      if (n == 1) {
        item = '1 breastfeed'
      } else {
        item = `${n} breastfeeds`
      }
      break
    case 'es':
      if (n == 1) {
        item = '1 amamantamiento'
      } else {
        item = `${n} amamantamientos`
      }
      break
    case 'fr':
      if (n == 1) {
        item = '1 tétée'
      } else {
        item = `${n} tétées`
      }
      break
    case 'it':
      if (n == 1) {
        item = '1 allattamento al seno'
      } else {
        item = `${n} allattamenti al seno`
      }
      break
    case 'ja':
      item = `${n}母乳`
      break
    case 'pt':
      if (n == 1) {
        item = '1 '
      } else {
        item = `${n} `
      }
    case 'ru':
      if (n == 1) {
        item = '1 кормление грудью'
      } else {
        item = `${n} кормления грудью`
      }
      break
  }
  return item
}

i18n.humanize = date => {
  const language = i18n.locale
  const defaultOptions = {
    units: ['d', 'h', 'm'],
    language,
    round: true,
    serialComma: false
  }
  const duration = moment.duration(moment().diff(moment.unix(date)))
  switch (language) {
    case 'de':
      return `Vor ${humanizeDuration(duration, {
        conjunction: ' und ',
        ...defaultOptions
      })}`
    default:
    case 'en':
      return `${humanizeDuration(duration, {
        conjunction: ' and ',
        ...defaultOptions
      })} ago`
    case 'es':
      return `Hace ${humanizeDuration(duration, {
        conjunction: ' y ',
        ...defaultOptions
      })}`
    case 'fr':
      return `Il y a ${humanizeDuration(duration, {
        conjunction: ' et ',
        ...defaultOptions
      })}`
    case 'it':
      return `${humanizeDuration(duration, {
        conjunction: ' e ',
        ...defaultOptions
      })} fa`
    case 'ja':
      return `${humanizeDuration(duration, {
        conjunction: '',
        ...defaultOptions
      })}前`
    case 'pt':
      return `${humanizeDuration(duration, {
        conjunction: ' e ',
        ...defaultOptions
      })}`
    case 'ru':
      return `${humanizeDuration(duration, {
        conjunction: ' и ',
        ...defaultOptions
      })} назад`
  }
}

i18n.formatLongDay = date => {
  switch (i18n.locale) {
    default:
    case 'en':
      return moment.unix(date).format('dddd, MMMM Do YYYY')
    case 'de':
    case 'es':
    case 'fr':
    case 'it':
    case 'pt':
    case 'ru':
      return moment.unix(date).format('dddd Do MMMM YYYY')
    case 'ja':
      return moment.unix(date).format('YYYY MMMM dddd Do')
  }
}

i18n.formatDay = date => {
  switch (i18n.locale) {
    default:
    case 'en':
      return date.format('MM/DD/YY')
    case 'de':
    case 'es':
    case 'fr':
    case 'it':
    case 'pt':
    case 'ru':
      return date.format('DD/MM/YY')
    case 'ja':
      return date.format('YYYY年MM月DD日')
  }
}

i18n.formatTime = date => {
  const f = i18n.uses24HourClock ? 'HH:mm' : 'hh:mm A'
  if (date instanceof moment) {
    return date.format(f)
  } else {
    return moment.unix(date).format(f)
  }
}

i18n.getLocalizedButton = timerId => {
  switch (timerId) {
    case 'left':
      return i18n.leftButton
    case 'right':
      return i18n.rightButton
  }
}

i18n.getMinAndSeconds = time => {
  const d = moment.duration(time)
  return shortHumanizer(d)
}

i18n.getMin = time => {
  const d = moment.duration(time)
  if (d.minutes() < 1) {
    return '< 1' + i18n.t('minutes')
  } else {
    return d.minutes() + i18n.t('minutes')
  }
}

export default i18n
