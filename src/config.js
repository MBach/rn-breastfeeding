import moment from 'moment'

const CHOICES = {
  LEFT: 'left',
  RIGHT: 'right',
  BOTTLE: 'bottle'
}

const mapChoice = c => {
  switch (c) {
    case CHOICES.LEFT:
      return 'Gauche'
    case CHOICES.RIGHT:
      return 'Droit'
    case CHOICES.BOTTLE:
      return 'Biberon'
  }
}

const getMin = time => {
  const d = moment.duration(time)
  if (d.minutes() < 1) {
    return '< 1min'
  } else {
    return d.minutes() + 'min'
  }
}

const getMinAndSeconds = time => {
  const d = moment.duration(time)
  if (d.minutes() < 1) {
    return d.seconds() + 's'
  } else {
    if (d.seconds() < 10) {
      return d.minutes() + 'min 0' + d.seconds() + 's'
    } else {
      return d.minutes() + 'min ' + d.seconds() + 's'
    }
  }
}

const isNotRunning = timers => {
  console.log('timers', timers['left'])
  console.log('timers', timers['right'])
  console.log('timers', timers['bottle'])
  return timers['left'] === 0 && timers['right'] === 0 && timers['bottle'] === 0
}

export { CHOICES, mapChoice, getMin, getMinAndSeconds, isNotRunning }
