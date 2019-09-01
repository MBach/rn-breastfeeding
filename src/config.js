import moment from 'moment'

const getMin = time => {
  const d = moment.duration(time)
  if (d.minutes() < 1) {
    return '< 1min'
  } else {
    return d.minutes() + 'min'
  }
}

const isNotRunning = timers => timers['left'] === 0 && timers['right'] === 0

export { getMin, isNotRunning }
