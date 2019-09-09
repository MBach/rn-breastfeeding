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
  _migrated = false

  @computed
  get migrated() {
    return this._migrated
  }
  set migrated(m) {
    this._migrated = m
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
    let groups = _.groupBy(this.records, record => record.day)
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

  ///

  _refUserInputs = null

  fetchCloudData = async () => {
    if (/*dataStore.migrated &&*/ auth().currentUser) {
      const ref = database().ref(`/users/${auth().currentUser.uid}`)
      const snapshot = await ref.once('value')
      if (snapshot.val()) {
        const data = snapshot.val()
        // Check if current user is the owner or has been invited by someone else
        if (data.linked) {
          this.userIsGuest = true
          this._refUserInputs = database().ref(`/users/${data.host}/inputs`)
        } else {
          this._refUserInputs = ref.child('inputs')
        }
        // Get the dataSet
        const snapshot2 = await this._refUserInputs.once('value')
        if (snapshot2.val()) {
          const values = Object.values(snapshot2)
          // Convert back Object to Array
          let r = []
          for (const entry of Object.values(values[0].value)) {
            r.push(entry)
          }
          this._records = r
        }
      } else {
        this._records = []
      }
    }
  }

  @action
  hydrateComplete = () => {
    database().setPersistenceEnabled(true)
  }

  @action
  addEntry = async data => {
    if (auth().currentUser) {
      let ref
      if (this._refUserInputs === null) {
        ref = database().ref(`/users/${auth().currentUser.uid}/inputs/${data.date.toString()}`)
      } else {
        ref = this._refUserInputs.child(data.date.toString())
      }
      await ref.set({ ...data })
    } else {
      let r = [...this.records]
      r.push(data)
      this.records = r
    }
    this.isRunning = { left: false, right: false }
    this.toggles = { left: false, right: false }
    this.timers = { left: 0, right: 0 }
    this.bottle = 0
    this.vitaminD = false
    this.day = null
    this.currentTimerId = null
    return true
  }

  @action
  updateGroup = async newGroup => {
    let groups = this.groupedRecords
    if (auth().currentUser) {
      let toDelete = groups.find(g => g.day === newGroup.day)
      if (toDelete) {
        let ref
        if (this._refUserInputs === null) {
          ref = database().ref(`/users/${auth().currentUser.uid}/inputs`)
        } else {
          ref = this._refUserInputs
        }

        for (const entry of toDelete.group) {
          await ref.child(`${entry.date}`).remove()
        }
        for (const entry of newGroup.group) {
          await ref.child(entry.date).set({ ...entry })
        }
      }
      await this.fetchCloudData()
    } else {
      groups = groups.filter(g => g.day !== newGroup.day)
      groups.push(newGroup)
      this.records = _.flatten(groups.map(g => g.group))
    }
  }
}

export default dataStore = new DataStore()
