import React, { Component } from 'react'
import { FlatList, ScrollView, Text, View } from 'react-native'
import { ActivityIndicator, Button, Card, Chip, Dialog, FAB, List, Portal, TouchableRipple } from 'react-native-paper'
import { inject, observer } from 'mobx-react/native'
import moment from 'moment'
import 'moment/locale/fr'
import humanizeDuration from 'humanize-duration'
import { mapChoice } from '../config'
import styles, { palette } from '../styles'

@inject('dataStore')
@observer
export default class HomeScreen extends Component {
  static navigationOptions = () => ({ title: 'Accueil' })
  state = {
    currentGroup: null,
    editGroupDialog: false,
    editLastEntry: false
  }

  hideDialog = dialog => () => this.setState({ [dialog]: false })

  editGroup = item => {
    this.setState({ currentGroup: { ...item }, editGroupDialog: true })
  }

  update = data => {
    dataStore.updateGroup(data)
    this.setState({ editGroupDialog: false })
  }

  humanize = date =>
    `Il y a ${humanizeDuration(moment.duration(moment().diff(moment.unix(date))), {
      conjunction: ' et ',
      units: ['d', 'h', 'm'],
      language: 'fr',
      round: true,
      serialComma: false
    })}`

  ///

  renderLastEntry() {
    if (dataStore.groupedRecords.length > 0) {
      const lastGroup = dataStore.groupedRecords[0]
      const lastEntry = lastGroup.group[0]
      return (
        <Card style={{ backgroundColor: '#dddddd', margin: 8 }} onPress={() => this.setState({ editLastEntry: true })}>
          <Card.Title title={`Dernière tétée à ${moment.unix(lastEntry.date).format('HH:mm')}`} subtitle={this.humanize(lastEntry.date)} />
          <Card.Content style={{ flexDirection: 'row' }}>
            <Chip style={styles.chipMarginRight}>
              <Text style={styles.chipText}>{mapChoice(lastEntry.choice)}</Text>
            </Chip>
            <Chip style={styles.chipMarginRight} icon="hourglass-empty">
              <Text style={styles.chipText}>{lastEntry.duration}</Text>
            </Chip>
            {lastEntry.vitaminD && (
              <Chip icon="brightness-5">
                <Text style={styles.chipText}>Vitamine D</Text>
              </Chip>
            )}
          </Card.Content>
        </Card>
      )
    } else {
      return (
        <Card style={{ backgroundColor: '#dddddd', margin: 16 }}>
          <Card.Title title="Pas encore de dernière tétée" subtitle="Cliquez sur le bouton pour commencer" />
        </Card>
      )
    }
  }

  renderItem = ({ item }) => {
    let title = ''
    if (item.group.length < 2) {
      title = '1 tétée'
    } else {
      title = `${item.group.length} tétées`
    }
    return (
      <TouchableRipple style={styles.list} onPress={() => this.editGroup(item)} rippleColor={palette.rippleColor}>
        <List.Section title={moment.unix(item.day).format('dddd Do MMMM YYYY')}>
          <List.Item
            title={title}
            left={() => <List.Icon icon="edit" />}
            right={() => item.hasVitaminD && <List.Icon style={{ opacity: 0.5 }} icon="brightness-5" />}
          />
        </List.Section>
      </TouchableRipple>
    )
  }

  editGroupDialog = () => {
    let { currentGroup } = this.state
    if (!currentGroup) {
      return false
    }
    let data
    if (currentGroup.group.length === 0) {
      data = <List.Item title="Aucune saisie" />
    } else {
      data = currentGroup.group.map((entry, index) => (
        <List.Item
          key={index}
          title={moment.unix(entry.date).format('HH:mm')}
          description={`${mapChoice(entry.choice)}, ${entry.duration}`}
          right={() => (
            <TouchableRipple
              onPress={() => {
                currentGroup.group = [...currentGroup.group.filter(item => item.date !== entry.date)]
                this.setState({ currentGroup })
              }}
            >
              <List.Icon icon="delete" />
            </TouchableRipple>
          )}
        />
      ))
    }
    return (
      <>
        <Dialog.Title>{moment.unix(currentGroup.day).format('dddd')}</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: '75%' }}>
          <ScrollView>{data}</ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={this.hideDialog('editGroupDialog')}>Annuler</Button>
          <Button onPress={() => this.update(currentGroup)}>OK</Button>
        </Dialog.Actions>
      </>
    )
  }

  /// Edit last entry

  renderButton = value => {
    return <Button color={palette.primaryColor}>{mapChoice(value)}</Button>
  }

  editLastEntryDialog = () => {
    return (
      <>
        <Dialog.Title>Modifier votre saisie</Dialog.Title>
        <Dialog.Content>
          <View>
            {this.renderButton('left')}
            {this.renderButton('right')}
            {this.renderButton('both')}
            {this.renderButton('bottle')}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={this.hideDialog('editLastEntry')}>Annuler</Button>
        </Dialog.Actions>
      </>
    )
  }

  render = () => (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      {dataStore.hydrated && !dataStore.updating && this.renderLastEntry()}
      {dataStore.hydrated ? (
        <FlatList
          data={dataStore.groupedRecords}
          extractData={dataStore.groupedRecords.length}
          keyExtractor={item => `${item.key}`}
          renderItem={this.renderItem}
        />
      ) : (
        <ActivityIndicator size="large" color={palette.primaryColor} />
      )}
      <FAB style={styles.fab} icon="add" onPress={() => this.props.navigation.navigate('AddEntry')} />
      <Portal>
        <Dialog visible={this.state.editGroupDialog} onDismiss={this.hideDialog('editGroupDialog')}>
          {this.editGroupDialog()}
        </Dialog>
        <Dialog visible={this.state.editLastEntry} onDismiss={this.hideDialog('editLastEntry')}>
          {this.editLastEntryDialog()}
        </Dialog>
      </Portal>
    </View>
  )
}
