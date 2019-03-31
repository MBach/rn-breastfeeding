import moment from 'moment'

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

const isNotRunning = timers => timers['left'] === 0 && timers['right'] === 0 && timers['bottle'] === 0

export { getMin, getMinAndSeconds, isNotRunning }
