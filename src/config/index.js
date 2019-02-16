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

export { CHOICES, mapChoice }
