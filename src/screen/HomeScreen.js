import React, { Component } from 'react'
import { Animated, AppState, Easing, FlatList, ScrollView, Text, View } from 'react-native'
import {
  withTheme,
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Dialog,
  FAB,
  List,
  Portal,
  RadioButton,
  TouchableRipple
} from 'react-native-paper'
import { inject, observer } from 'mobx-react/native'
import moment from 'moment'
import 'moment/locale/fr'
import humanizeDuration from 'humanize-duration'
import { mapChoice } from '../config'
import styles from '../styles'

@inject('dataStore')
@observer
class HomeScreen extends Component {
  static navigationOptions = ({ navigation, screenProps }) => {
    const { params } = navigation.state
    return {
      title: 'Accueil',
      headerStyle: { backgroundColor: screenProps.primary },
      headerRight: <Button icon="more-vert" color="white" onPress={() => params.handleMore && params.handleMore()} />
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      appState: AppState.currentState,
      currentGroup: null,
      editThemeDialog: false,
      editGroupDialog: false,
      editLastEntry: false,
      opacity: new Animated.Value(1)
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({ handleMore: () => this.setState({ editThemeDialog: true }) })

    AppState.addEventListener('change', this.refreshLastEntry)
    if (dataStore.isRunningBackground) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(this.state.opacity, {
            toValue: 0.05,
            duration: 2000,
            ease: Easing.ease,
            useNativeDriver: true
          }),
          Animated.timing(this.state.opacity, {
            toValue: 1,
            duration: 2000,
            ease: Easing.ease,
            useNativeDriver: true
          })
        ])
      ).start()
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.refreshLastEntry)
  }

  refreshLastEntry = nextAppState => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      dataStore.groupedRecords
    }
    this.setState({ appState: nextAppState })
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

  renderLastEntry(groupedRecords) {
    if (groupedRecords.length > 0) {
      const lastGroup = groupedRecords[0]
      const lastEntry = lastGroup.group[0]
      return (
        <Card style={styles.cardLastEntry} onPress={() => this.setState({ editLastEntry: true })}>
          <Card.Title title={`Dernière tétée à ${moment.unix(lastEntry.date).format('HH:mm')}`} subtitle={this.humanize(lastEntry.date)} />
          <Card.Content style={{ flexDirection: 'row' }}>
            <Chip style={styles.chipMarginRight}>
              <Text style={styles.chipText}>{mapChoice(lastEntry.choice)}</Text>
            </Chip>
            {lastEntry.timers.map(timer => {
              return (
                <Chip style={styles.chipMarginRight} icon="hourglass-empty">
                  <Text style={styles.chipText}>{timer}</Text>
                </Chip>
              )
            })}
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
        <Card style={styles.cardLastEntry}>
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
    const { colors, palette } = this.props.theme
    return (
      <TouchableRipple
        style={{ borderBottomColor: palette.separator, ...styles.list }}
        onPress={() => this.editGroup(item)}
        rippleColor={palette.rippleColor}
      >
        <List.Section title={moment.unix(item.day).format('dddd Do MMMM YYYY')}>
          <List.Item
            title={title}
            left={() => <List.Icon icon="edit" color={colors.text} style={{ opacity: 0.75 }} />}
            right={() => item.hasVitaminD && <List.Icon color={colors.text} style={{ opacity: 0.5 }} icon="brightness-5" />}
          />
        </List.Section>
      </TouchableRipple>
    )
  }

  /// Dialogs

  changeTheme = theme => {
    dataStore.theme = theme
    this.props.screenProps.updateTheme(theme)
  }

  editThemeDialog = () => {
    const { colors, palette } = this.props.theme
    const items = [
      {
        title: 'Mode jour',
        theme: 'day',
        icon: 'wb-sunny'
      },
      {
        title: 'Mode nuit',
        theme: 'night',
        icon: 'brightness-3'
      },
      {
        title: 'Mode auto',
        theme: 'auto',
        icon: 'autorenew'
      }
    ]
    return (
      <Dialog visible={this.state.editThemeDialog} onDismiss={this.hideDialog('editThemeDialog')}>
        <Dialog.Title>Préférences d'affichage</Dialog.Title>
        <RadioButton.Group onValueChange={theme => this.changeTheme(theme)} value={dataStore.theme}>
          <List.Section>
            {items.map(({ title, theme, icon }, index) => (
              <List.Item
                key={index}
                title={title}
                style={{ height: 60, justifyContent: 'center' }}
                onPress={() => this.changeTheme(theme)}
                left={() => (
                  <View style={{ justifyContent: 'center' }}>
                    <RadioButton value={theme} />
                  </View>
                )}
                right={() => <List.Icon color={colors.text} icon={icon} />}
              />
            ))}
          </List.Section>
        </RadioButton.Group>
        <Dialog.Actions style={styles.popupButtonsContainer}>
          <Button color={palette.buttonColor} onPress={this.hideDialog('editThemeDialog')}>
            Annuler
          </Button>
          <Button color={palette.buttonColor} onPress={this.hideDialog('editThemeDialog')}>
            OK
          </Button>
        </Dialog.Actions>
      </Dialog>
    )
  }

  editGroupDialog = () => {
    const { colors, palette } = this.props.theme
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
              <List.Icon color={colors.text} icon="delete" />
            </TouchableRipple>
          )}
        />
      ))
    }
    return (
      <Dialog visible={this.state.editGroupDialog} onDismiss={this.hideDialog('editGroupDialog')}>
        <Dialog.Title>{moment.unix(currentGroup.day).format('dddd')}</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: '75%' }}>
          <ScrollView>{data}</ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.popupButtonsContainer}>
          <Button color={palette.buttonColor} onPress={this.hideDialog('editGroupDialog')}>
            Annuler
          </Button>
          <Button color={palette.buttonColor} onPress={() => this.update(currentGroup)}>
            OK
          </Button>
        </Dialog.Actions>
      </Dialog>
    )
  }

  /// Edit last entry

  renderButton = value => {
    return <Button color={this.props.theme.primary}>{mapChoice(value)}</Button>
  }

  editLastEntryDialog = () => (
    <Dialog visible={this.state.editLastEntry} onDismiss={this.hideDialog('editLastEntry')}>
      <Dialog.Title>Modifier votre saisie</Dialog.Title>
      <Dialog.Content>
        <View>
          {this.renderButton('left')}
          {this.renderButton('right')}
          {this.renderButton('bottle')}
        </View>
      </Dialog.Content>
      <Dialog.Actions style={styles.popupButtonsContainer}>
        <Button color={this.props.theme.palette.buttonColor} onPress={this.hideDialog('editLastEntry')}>
          Annuler
        </Button>
        <Button color={this.props.theme.palette.buttonColor} onPress={this.hideDialog('editLastEntry')}>
          OK
        </Button>
      </Dialog.Actions>
    </Dialog>
  )

  render = () => {
    const { colors } = this.props.theme
    const groupedRecords = dataStore.groupedRecords
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'center' }}>
        {dataStore.hydrated && !dataStore.updating && this.renderLastEntry(groupedRecords)}
        {dataStore.hydrated && !dataStore.updating ? (
          <FlatList
            data={groupedRecords}
            extractData={groupedRecords.length}
            keyExtractor={item => `${item.key}`}
            renderItem={this.renderItem}
          />
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
        {dataStore.isRunningBackground ? (
          <Animated.View>
            <FAB
              style={[styles.fab, { bottom: 20, opacity: this.state.opacity, backgroundColor: colors.primary }]}
              icon={'timer'}
              onPress={() => this.props.navigation.navigate('AddEntry')}
            />
          </Animated.View>
        ) : (
          <FAB
            style={[styles.fab, { bottom: 20, backgroundColor: colors.primary }]}
            icon={'add'}
            onPress={() => this.props.navigation.navigate('AddEntry')}
          />
        )}
        <Portal>{this.editThemeDialog()}</Portal>
        <Portal>{this.editGroupDialog()}</Portal>
        <Portal>{this.editLastEntryDialog()}</Portal>
      </View>
    )
  }
}

export default withTheme(HomeScreen)
