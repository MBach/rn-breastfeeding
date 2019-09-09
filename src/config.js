const isNotRunning = timers => timers['left'] === 0 && timers['right'] === 0

const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

const validateEmail = text => reg.test(text)

const SHARE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active'
}

export { isNotRunning, validateEmail, SHARE_STATUS }
