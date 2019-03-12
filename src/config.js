import moment from 'moment'

const CHOICES = {
  LEFT: 'left',
  RIGHT: 'right',
  BOTH: 'both',
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

const humanizeTime = time => {
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

export { CHOICES, mapChoice, humanizeTime }
