import { AsyncStorage } from 'react-native'
import { observable, action, computed, toJS } from 'mobx'
import { create, persist } from 'mobx-persist'
import _ from 'lodash'

class DataStore {
  @observable hydrated = false
  @observable updating = false

  @persist('list')
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

const hydrate = create({ storage: AsyncStorage, jsonify: true })
hydrate('dataStore', dataStore).then(() => {
  dataStore.hydrateComplete()
})
