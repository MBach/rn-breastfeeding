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
    case CHOICES.BOTH:
      return 'Les deux'
    case CHOICES.BOTTLE:
      return 'Biberon'
  }
}

// Could be made dynamic, but who cares?
const pos = {
  lat: 47.2157398,
  lng: -1.5556321
}

export { CHOICES, mapChoice, pos }
