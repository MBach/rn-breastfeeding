import * as RNLocalize from 'react-native-localize'
import humanizeDuration from 'humanize-duration'
import i18n from 'i18n-js'
import moment from 'moment'
import 'moment/locale/fr'

import en from './en.json'
import fr from './fr.json'

i18n.defaultLocale = 'en'
i18n.locale = 'en'
i18n.fallbacks = true
i18n.translations = { en, fr }

export const loadLocale = () => {
  for (const locale of RNLocalize.getLocales()) {
    if (i18n.translations[locale.languageCode] !== null) {
      i18n.locale = locale.languageCode
      i18n.uses24HourClock = RNLocalize.uses24HourClock()
      moment.locale(locale.languageCode)
      break
    }
  }
}

i18n.formatLastEntry = date => {
  const f = i18n.uses24HourClock ? 'HH:mm' : 'hh:mm A'
  switch (i18n.locale) {
    default:
    case 'en':
      return `Last breastfeed at ${moment.unix(date).format(f)}`
    case 'fr':
      return `Dernière tétée à ${moment.unix(date).format(f)}`
  }
}

i18n.formatItem = n => {
  let item = ''
  switch (i18n.locale) {
    default:
    case 'en':
      if (n < 2) {
        item = '1 breastfeed'
      } else {
        item = `${n} breastfeeds`
      }
      break
    case 'fr':
      if (n < 2) {
        item = '1 tétée'
      } else {
        item = `${n} tétées`
      }
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
  switch (language) {
    default:
    case 'en':
      return `${humanizeDuration(moment.duration(moment().diff(moment.unix(date))), {
        conjunction: ' and ',
        ...defaultOptions
      })} ago`
    case 'fr':
      return `Il y a ${humanizeDuration(moment.duration(moment().diff(moment.unix(date))), {
        conjunction: ' et ',
        ...defaultOptions
      })}`
  }
}

i18n.formatLongDay = date => {
  switch (i18n.locale) {
    default:
    case 'en':
      return moment.unix(date).format('dddd, MMMM Do YYYY')
    case 'fr':
      return moment.unix(date).format('dddd Do MMMM YYYY')
  }
}

i18n.formatDay = date => {
  switch (i18n.locale) {
    default:
    case 'en':
      return date.format('MM/DD/YY')
    case 'fr':
      return date.format('DD/MM/YY')
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

export default i18n
