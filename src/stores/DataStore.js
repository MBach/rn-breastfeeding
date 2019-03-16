import { observable, action, computed, toJS } from 'mobx'
import { persist } from 'mobx-persist'
import _ from 'lodash'

class DataStore {
  @observable hydrated = false
  @observable updating = false

  ///

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

  @persist('object')
  @observable
  _coords = { latitude: 46.227638, longitude: 2.213749 }

  @computed
  get coords() {
    return this._coords
  }
  set coords(c) {
    this._coords = c
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
  _isRunning = { left: false, right: false, bottle: false }

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
  _timers = { left: 0, right: 0, bottle: 0 }

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
  _toggles = { left: false, right: false, bottle: false }

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

  @action
  hydrateComplete = async () => {
    this.hydrated = true
  }

  @action
  addEntry = data => {
    this.updating = true
    let r = [...this.records]
    r.push(data)
    this.records = r
    this.updating = false
    this.isRunning = { left: false, right: false, bottle: false }
    this.toggles = { left: false, right: false, bottle: false }
    this.timers = { left: 0, right: 0, bottle: 0 }
    this.vitaminD = false
    this.day = null
    this.currentTimerId = null
  }

  @action
  updateGroup = newGroup => {
    let groups = this.groupedRecords
    groups = groups.filter(g => g.day !== newGroup.day)
    groups.push(newGroup)
    this.records = _.flatten(groups.map(g => g.group))
  }
}

export default (dataStore = new DataStore())
