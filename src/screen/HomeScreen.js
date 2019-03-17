import React, { Component } from 'react'
import { Animated, AppState, Easing, FlatList, PermissionsAndroid, Platform, ScrollView, Text, View } from 'react-native'
import RNAndroidLocationEnabler from 'react-native-android-location-enabler'
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
import { mapChoice, getMin, getMinAndSeconds, isNotRunning } from '../config'
import styles from '../styles'

/**
 * This class is the Home Screen.
 * It contains the last entry on top and a FlatList of events grouped by day. One can create an entry by clicking on the + button at the bottom.
 *
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 1.0
 */
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
    this.autoRefresh = null
  }

  componentDidMount() {
    this.props.navigation.setParams({ handleMore: () => this.setState({ editThemeDialog: true }) })

    AppState.addEventListener('change', this.refreshLastEntry)
    if (!isNotRunning(dataStore.timers)) {
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

    this.autoRefresh = setInterval(() => {
      this.forceUpdate()
    }, 1000 * 60)
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.refreshLastEntry)
    clearInterval(this.autoRefresh)
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

  renderChip = (timerId, time) =>
    time > 0 && (
      <Chip style={styles.chipMargins}>
        <Text style={styles.chipText}>{`${mapChoice(timerId)} ${getMinAndSeconds(time)}`}</Text>
      </Chip>
    )

  renderLastEntry(groupedRecords) {
    if (groupedRecords.length > 0) {
      const lastGroup = groupedRecords[0]
      const lastEntry = lastGroup.group[0]
      return (
        <Card style={styles.cardLastEntry} onPress={() => this.setState({ editLastEntry: true })}>
          <Card.Title title={`Dernière tétée à ${moment.unix(lastEntry.date).format('HH:mm')}`} subtitle={this.humanize(lastEntry.date)} />
          <Card.Content style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {this.renderChip('left', lastEntry.timers['left'])}
            {this.renderChip('right', lastEntry.timers['right'])}
            {this.renderChip('bottle', lastEntry.timers['bottle'])}
            {lastEntry.vitaminD && (
              <Chip style={styles.chipMargins} icon="brightness-5">
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

  askLocation = async () => {
    if (Platform.OS !== 'android') {
      return
    }
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    if (res === 'granted' || res === true) {
      try {
        const res2 = await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 })
        if (res2 === 'already-enabled' || res2 === 'enabled') {
          console.log('Permission granted and location enabled')
          navigator.geolocation.getCurrentPosition(
            position => {
              dataStore.coords = { latitude: position.coords.latitude, longitude: position.coords.longitude }
              this.changeTheme('auto')
            },
            error => console.log('error', error),
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 1000 }
          )
        }
      } catch (error) {
        console.log('error', error)
      }
    } else {
      // res === never_ask_again
    }
  }

  editThemeDialog = () => {
    const { colors } = this.props.theme
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
        icon: 'autorenew',
        callback: this.askLocation
      }
    ]
    return (
      <Portal>
        <Dialog visible={this.state.editThemeDialog} onDismiss={this.hideDialog('editThemeDialog')}>
          <Dialog.Title>Préférences d'affichage</Dialog.Title>
          <RadioButton.Group onValueChange={theme => this.changeTheme(theme)} value={dataStore.theme}>
            <List.Section>
              {items.map(({ title, theme, icon, callback }, index) => (
                <List.Item
                  key={index}
                  title={title}
                  style={{ height: 60, justifyContent: 'center' }}
                  onPress={() => (callback ? callback() : this.changeTheme(theme))}
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
        </Dialog>
      </Portal>
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
      data = currentGroup.group.map((entry, index) => {
        let description = []
        if (entry.timers['left'] > 0) {
          description.push(`${mapChoice('left')} :  ${getMin(entry.timers['left'])}`)
        }
        if (entry.timers['right'] > 0) {
          description.push(`${mapChoice('right')} : ${getMin(entry.timers['right'])}`)
        }
        if (entry.timers['bottle'] > 0) {
          description.push(`${mapChoice('bottle')} : ${getMin(entry.timers['bottle'])}`)
        }
        return (
          <List.Item
            key={index}
            title={moment.unix(entry.date).format('HH:mm')}
            description={description.join(', ')}
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
        )
      })
    }
    return (
      <Portal>
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
      </Portal>
    )
  }

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
        {isNotRunning(dataStore.timers) ? (
          <FAB
            style={[styles.fab, { position: 'absolute', bottom: 20, backgroundColor: colors.primary }]}
            icon={'add'}
            onPress={() => this.props.navigation.navigate('AddEntry')}
          />
        ) : (
          <Animated.View>
            <FAB
              style={[styles.fab, { position: 'absolute', bottom: 20, opacity: this.state.opacity, backgroundColor: colors.primary }]}
              icon={'timer'}
              onPress={() => this.props.navigation.navigate('AddEntry')}
            />
          </Animated.View>
        )}
        {this.editThemeDialog()}
        {this.editGroupDialog()}
      </View>
    )
  }
}

export default withTheme(HomeScreen)
