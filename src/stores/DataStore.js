import { observable, action, computed, toJS } from 'mobx'
import { persist } from 'mobx-persist'
import _ from 'lodash'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'

/**
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 2.0
 */
class DataStore {
  @persist
  @observable
  _theme = 'day'

  @computed
  get theme() {
    return this._theme
  }
  set theme(t) {
    this._theme = t
  }

  ///

  @persist
  @observable
  _day = null

  @computed
  get day() {
    return this._day
  }
  set day(d) {
    this._day = d
  }

  ///

  @persist('object')
  @observable
  _isRunning = {
    left: false,
    right: false
  }

  @computed
  get isRunning() {
    return this._isRunning
  }
  set isRunning(r) {
    this._isRunning = r
  }

  ///

  @persist
  @observable
  _bottle = 0

  @computed
  get bottle() {
    return this._bottle
  }
  set bottle(b) {
    this._bottle = b
  }

  ///
  @persist
  @observable
  _currentTimerId = null

  @computed
  get currentTimerId() {
    return this._currentTimerId
  }
  set currentTimerId(timerId) {
    this._currentTimerId = timerId
  }

  ///

  @persist
  @observable
  _vitaminD = false

  @computed
  get vitaminD() {
    return this._vitaminD
  }
  set vitaminD(vit) {
    this._vitaminD = vit
  }

  ///

  @persist('object')
  @observable
  _timers = { left: 0, right: 0 }

  @computed
  get timers() {
    return this._timers
  }
  set timers(t) {
    this._timers = t
  }

  ///

  @persist('object')
  @observable
  _toggles = { left: false, right: false }

  @computed
  get toggles() {
    return this._toggles
  }
  set toggles(data) {
    this._toggles = data
  }

  ///

  @persist('object')
  @observable
  _records = []

  @computed
  get records() {
    return toJS(this._records)
  }
  set records(records) {
    this._records = records
  }

  @computed
  get groupedRecords() {
    let groups = _.groupBy(this.records, record => record.day.toString())
    let result = _.map(groups, (g, day) => {
      const group = _.orderBy(g, ['date'], ['desc'])
      const index = group.findIndex(g => g.vitaminD)
      const obj = {
        group,
        day,
        key: group[0].date,
        hasVitaminD: index >= 0
      }
      return obj
    })
    result = _.orderBy(result, ['day'], ['desc'])
    return result
  }

  ///

  @observable
  userIsGuest = false

  @observable
  targetUid = null

  ///

  @action
  hydrateComplete = () => {
    //database().setPersistenceEnabled(true)
  }

  promisify = (isGuest, uid) => {
    this.userIsGuest = isGuest
    this.targetUid = uid
    return new Promise((resolve, reject) => {
      resolve({ sucess: true, isGuest })
    })
  }

  @action
  isAccountLinked = () => {
    // Check if current user exists and is connected
    if (auth().currentUser && !auth().currentUser.isAnonymous) {
      // To check if an account is linked, we need to check both cases: user is the host, and user is the guest
      const refLinked = database().ref(`/users/${auth().currentUser.uid}/linked`)
      return refLinked
        .once('value')
        .then(linked => {
          if (linked && linked.val() !== null) {
            // value = 'host' or uid (current user is guest)
            if (linked.val() === 'host') {
              return this.promisify(false, auth().currentUser.uid)
            } else {
              return this.promisify(true, linked.val())
            }
          } else {
            return this.promisify(false, null)
          }
        })
        .catch(err => {
          return this.promisify(false, null)
        })
    } else {
      return this.promisify(false, null)
    }
  }

  @action
  addEntry = data => {
    // Save data to localStorage
    let r = [...this.records]
    r.push(data)
    this.records = r

    this.isRunning = { left: false, right: false }
    this.toggles = { left: false, right: false }
    this.timers = { left: 0, right: 0 }
    this.bottle = 0
    this.vitaminD = false
    this.day = null
    this.currentTimerId = null

    // Check if user has shared data with someone
    // If so, then enable cloud replication, in order to sync data on all connected devices
    if (this.targetUid) {
      const ref = database().ref(`/users/${this.targetUid}/inputs/${data.date}`)
      ref.set({ ...data })
    }

    return true
  }

  @action
  updateGroup = (currentGroup, newGroup) => {
    let groups = this.groupedRecords
    groups = groups.filter(g => g.day !== newGroup.day)
    groups.push(newGroup)
    this.records = _.flatten(groups.map(g => g.group))
    if (this.targetUid) {
      for (const current of currentGroup.group) {
        if (newGroup.group.findIndex(c => c.date === current.date) === -1) {
          const ref = database().ref(`/users/${this.targetUid}/inputs/${current.date}`)
          ref.remove()
        }
      }
    }
  }

  fetchCloudData = async () => {
    if (!this.targetUid) {
      return
    }
    const ref = database().ref(`/users/${this.targetUid}/inputs`)
    const snapshot = await ref.once('value')
    // Get the dataSet
    if (snapshot.val()) {
      const values = Object.values(snapshot)
      // Convert back Object to Array
      let r = []
      for (const entry of Object.values(values[0].value)) {
        r.push(entry)
      }
      this.records = r
    }
  }

  migrate = async () => {
    let refUser = database().ref(`/users/${auth().currentUser.uid}/inputs`)

    // Make a backup
    let r = []
    for (let record of this.records) {
      if (record.s === undefined) {
        const ref = refUser.child(record.date.toString())
        ref.set({ ...record }).then(res => {
          record.s = true
        })
      }
      r.push(record)
    }
    this.records = r
  }
}

export default dataStore = new DataStore()
