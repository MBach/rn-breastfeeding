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
    return this._records
  }
  set records(records) {
    this._records = records
  }

  @computed
  get groupedRecords() {
    let groups = _.groupBy(this._records, record => {
      return record.day
    })

    let result = _.map(groups, function(group, day) {
      group = _.orderBy(group, ['date'], ['desc'])
      return {
        group,
        day,
        key: group[0].id
      }
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
    // FIXME
    data.id = this._records.length
    let r = toJS(this._records)
    r.push(data)
    this._records = r
    console.log('r', r)
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
