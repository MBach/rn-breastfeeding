import { observable, action, computed } from 'mobx'
import { persist } from 'mobx-persist'
import _ from 'lodash'

class DataStore {
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
    let groups = _.groupBy(this.records, record => {
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
  hydrateComplete = async () => {}

  @action
  addEntry = data => {
    data.id = this.records.length
    let r = [...this.records]
    r.push(data)
    this.records = r
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
