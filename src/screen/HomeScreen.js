import React, { Component } from 'react'
import { Animated, AppState, Dimensions, Easing, FlatList, PermissionsAndroid, Platform, ScrollView, Text, View } from 'react-native'
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
import { inject, observer } from 'mobx-react'
import moment from 'moment'
import i18n from '../locales/i18n'
import { getMin, getMinAndSeconds, isNotRunning } from '../config'
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
      title: i18n.t('navigation.home'),
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
      opacity: new Animated.Value(1),
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    }
    this.autoRefresh = null
  }

  componentDidMount() {
    this.props.navigation.setParams({ handleReload: () => this.forceUpdate(), handleMore: () => this.setState({ editThemeDialog: true }) })

    AppState.addEventListener('change', this.refreshLastEntry)
    if (!isNotRunning(dataStore.timers)) {
      this.createAnimation()
    }

    this.autoRefresh = setInterval(() => {
      this.forceUpdate()
    }, 1000 * 60)
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.refreshLastEntry)
    clearInterval(this.autoRefresh)
  }

  createAnimation = () =>
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

  onLayout = () =>
    this.setState({
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    })

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

  ///

  renderChip = (timerId, time) =>
    time > 0 && (
      <Chip style={styles.chipMargins}>
        <Text style={styles.chipText}>{i18n.t(timerId) + ' ' + getMinAndSeconds(time)}</Text>
      </Chip>
    )

  renderLastEntry(groupedRecords) {
    if (groupedRecords.length > 0) {
      const lastGroup = groupedRecords[0]
      const lastEntry = lastGroup.group[0]
      return (
        <Card
          style={[styles.cardLastEntry, this.state.isLandscape ? { flex: 1, minWidth: '50%', maxWidth: '50%' } : false]}
          onPress={() => this.setState({ editLastEntry: true })}
        >
          <Card.Title title={i18n.formatLastEntry(lastEntry.date)} subtitle={i18n.humanize(lastEntry.date)} />
          <Card.Content style={styles.rowWrap}>
            {this.renderChip('left', lastEntry.timers['left'])}
            {this.renderChip('right', lastEntry.timers['right'])}
            {this.renderChip('bottle', lastEntry.timers['bottle'])}
            {lastEntry.vitaminD && (
              <Chip style={styles.chipMargins} icon="brightness-5">
                <Text style={styles.chipText}>{i18n.t('vitaminD')}</Text>
              </Chip>
            )}
          </Card.Content>
        </Card>
      )
    } else {
      return (
        <Card style={[styles.cardLastEntry, this.state.isLandscape ? { flex: 1, minWidth: '50%', maxWidth: '50%' } : false]}>
          <Card.Title title={i18n.t('home.noEntry')} subtitle={i18n.t('home.add')} />
        </Card>
      )
    }
  }

  renderItem = ({ item }) => {
    const { colors, palette } = this.props.theme
    return (
      <TouchableRipple
        style={{ borderBottomColor: palette.separator, ...styles.list }}
        onPress={() => this.editGroup(item)}
        rippleColor={palette.rippleColor}
      >
        <List.Section title={i18n.formatLongDay(item.day)}>
          <List.Item
            title={i18n.formatItem(item.group.length)}
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
        title: i18n.t('home.mode.day'),
        theme: 'day',
        icon: 'wb-sunny'
      },
      {
        title: i18n.t('home.mode.night'),
        theme: 'night',
        icon: 'brightness-3'
      },
      {
        title: i18n.t('home.mode.auto'),
        theme: 'auto',
        icon: 'autorenew',
        callback: this.askLocation
      }
    ]
    return (
      <Portal>
        <Dialog visible={this.state.editThemeDialog} onDismiss={this.hideDialog('editThemeDialog')}>
          <Dialog.Title>{i18n.t('home.mode.title')}</Dialog.Title>
          <RadioButton.Group onValueChange={theme => this.changeTheme(theme)} value={dataStore.theme}>
            <List.Section>
              {items.map(({ title, theme, icon, callback }, index) => (
                <List.Item
                  key={index}
                  title={title}
                  style={styles.settingsItem}
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
      data = <List.Item title={i18n.t('home.groupedEntries.noData')} />
    } else {
      data = currentGroup.group.map((entry, index) => {
        let description = []
        if (entry.timers['left'] > 0) {
          description.push(i18n.t('left') + `:  ${getMin(entry.timers['left'])}`)
        }
        if (entry.timers['right'] > 0) {
          description.push(i18n.t('right') + `: ${getMin(entry.timers['right'])}`)
        }
        if (entry.timers['bottle'] > 0) {
          description.push(i18n.t('bottle') + `: ${getMin(entry.timers['bottle'])}`)
        }
        return (
          <List.Item
            key={index}
            title={i18n.formatTime(entry.date)}
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
          <Dialog.ScrollArea style={styles.containerDialog}>
            <ScrollView>{data}</ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={styles.popupButtonsContainer}>
            <Button color={palette.buttonColor} onPress={this.hideDialog('editGroupDialog')}>
              {i18n.t('cancel')}
            </Button>
            <Button color={palette.buttonColor} onPress={() => this.update(currentGroup)}>
              {i18n.t('ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }

  renderFab = isStopped => {
    const { colors } = this.props.theme
    if (isStopped) {
      const extraFab = this.state.isLandscape ? { left: '20%' } : { left: 0, right: 0 }
      return (
        <View style={[styles.absFab, extraFab]}>
          <FAB
            style={[styles.fab, { backgroundColor: colors.primary }]}
            icon={'add'}
            onPress={() =>
              this.props.navigation.navigate('AddEntry', {
                autoRefresh: () => {
                  this.createAnimation()
                  this.forceUpdate()
                }
              })
            }
          />
        </View>
      )
    } else {
      const extraFab = this.state.isLandscape ? { left: '20%' } : { left: 0, right: 0 }
      return (
        <Animated.View style={[styles.absFab, extraFab]}>
          <FAB
            style={[styles.fab, { opacity: this.state.opacity, backgroundColor: colors.primary }]}
            icon={'timer'}
            onPress={() => this.props.navigation.navigate('AddEntry')}
          />
        </Animated.View>
      )
    }
  }

  render = () => {
    const { colors } = this.props.theme
    const groupedRecords = dataStore.groupedRecords
    return (
      <View
        onLayout={this.onLayout}
        style={[
          { backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
          this.state.isLandscape ? { flexDirection: 'row' } : false
        ]}
      >
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
        {this.renderFab(isNotRunning(dataStore.timers))}
        {this.editThemeDialog()}
        {this.editGroupDialog()}
      </View>
    )
  }
}

export default withTheme(HomeScreen)