import React, { Component } from 'react'
import { DeviceEventEmitter, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import { withTheme, ActivityIndicator, Appbar, Button, Dialog, FAB, Paragraph, Portal, Switch, TextInput } from 'react-native-paper'
import Slider from '@react-native-community/slider'
import DateTimePicker from 'react-native-modal-datetime-picker'
import { observer, inject } from 'mobx-react'
import moment from 'moment'

import RNBreastFeeding from '../RNBreastFeeding'
import { isNotRunning } from '../config'
import i18n from '../locales/i18n'
import { lightTheme } from '../styles'

const styles = StyleSheet.create({
  fab: {
    margin: 16,
    alignSelf: 'center'
  },
  mainContainer: {
    flex: 1,
    padding: 16,
    flexWrap: 'wrap',
    width: '100%',
    flexDirection: 'row'
  },
  subContainerLandscape: {
    flex: 1,
    width: '50%',
    flexDirection: 'column'
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  date: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 3
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  timer: {
    fontSize: 36,
    fontWeight: 'bold',
    borderBottomWidth: 3
  },
  smallTimer: {
    fontWeight: 'bold',
    textAlign: 'center'
  },
  fabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  fabTimer: {
    elevation: 0
  }
})

const resetAction = StackActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'Home' })]
})

function ThemedText({ style, palette, children }) {
  return <Text style={{ color: palette.sectionTextColor, ...style }}>{children}</Text>
}

/**
 * This class is for adding a new dataSet to the store.
 *
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 2.0
 */
@inject('dataStore')
@observer
class AddEntryScreen extends Component {
  static navigationOptions = {
    header: null
  }

  constructor(props) {
    super(props)
    this.state = {
      sending: false,
      bottle: 0,
      isDatePickerVisible: false,
      isTimePickerVisible: false,
      day: dataStore.day ? moment.unix(dataStore.day) : moment(),
      showEditDurationDialog: false,
      showErrorDialog: false,
      manualTimer: '',
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    }
    this.timerUpdated = null
  }

  componentDidMount() {
    this.timerUpdated = DeviceEventEmitter.addListener('onTick', payload => {
      const { timerId, isRunning, timer } = payload
      if (isRunning) {
        let timers = { ...dataStore.timers }
        timers[timerId] = timer
        dataStore.timers = timers
      }
      dataStore.isRunning[timerId] = isRunning
    })

    if (!isNotRunning(dataStore.timers)) {
      dataStore.day = this.state.day.unix()
    }
  }

  componentWillUnmount() {
    if (this.timerUpdated) {
      this.timerUpdated.remove()
    }
  }

  onLayout = () =>
    this.setState({
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    })

  /// Date & time pickers

  showDatePicker = () => this.setState({ isDatePickerVisible: true })
  hideDatePicker = () => this.setState({ isDatePickerVisible: false })
  handleDatePicked = date => {
    let { day } = this.state
    const mDate = moment(date)
    day.year(mDate.year())
    day.dayOfYear(mDate.dayOfYear())
    dataStore.day = day.unix()
    this.setState({ day })
    this.hideDatePicker()
  }

  handleTimePicked = time => {
    let { day } = this.state
    const mTime = moment(time)
    day.hour(mTime.hour())
    day.minute(mTime.minute())
    dataStore.day = day.unix()
    this.setState({ day })
    this.hideTimePicker()
  }
  showTimePicker = () => this.setState({ isTimePickerVisible: true })
  hideTimePicker = () => this.setState({ isTimePickerVisible: false })

  pauseResumeTimer = timerId => {
    RNBreastFeeding.pauseResumeTimer(timerId)
    dataStore.currentTimerId = timerId
  }

  /// Buttons

  toggle = v => (dataStore.toggles[v] = !dataStore.toggles[v])

  /// Validation

  validateEntry = async () => {
    const { day } = this.state
    if (dataStore.timers['left'] > 0 || dataStore.timers['right'] > 0 || this.state.bottle > 0) {
      /// Save data
      let data = {
        date: day.unix(),
        day: day.startOf('day').unix(),
        timers: { ...dataStore.timers },
        bottle: this.state.bottle,
        vitaminD: dataStore.vitaminD
      }
      this.setState({ sending: true }, async () => {
        if (dataStore.addEntry(data)) {
          RNBreastFeeding.stopTimers()
          this.props.navigation.dispatch(resetAction)
        } else {
          this.setState({ sending: false })
          console.warn('error when adding new input')
        }
      })
    } else {
      this.setState({ showErrorDialog: true })
    }
  }

  formatTime = timerId => i18n.getMinAndSeconds(dataStore.timers[timerId])

  forceTimer = () => {
    RNBreastFeeding.changeTo(dataStore.currentTimerId, this.state.manualTimer * 60 * 1000)
    this.setState({ showEditDurationDialog: false })
  }

  hideDialog = dialog => () => this.setState({ [dialog]: false })

  changeTimer = manualTimer => () => this.setState({ manualTimer })

  /// Renderers

  renderButton = timerId => {
    const { colors, palette } = this.props.theme
    return (
      <View style={{ flexDirection: 'column' }}>
        <FAB
          accessibilityLabel={i18n.t('a11y.buttonTimer', { timer: i18n.t(timerId) })}
          style={[styles.fab, { backgroundColor: dataStore.isRunning[timerId] ? colors.secondary : colors.primary }]}
          icon={dataStore.isRunning[timerId] ? 'pause' : i18n.getLocalizedButton(timerId)}
          onPress={() => this.pauseResumeTimer(timerId)}
        />
        <ThemedText palette={palette} style={styles.smallTimer}>
          {this.formatTime(timerId)}
        </ThemedText>
      </View>
    )
  }

  renderBottle = () => {
    const { colors, palette } = this.props.theme
    return (
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <Button
          accessibilityLabel={i18n.t('a11y.removeml')}
          disabled={this.state.bottle === 0}
          color={palette.buttonColor}
          style={{ alignContent: 'center', justifyContent: 'center' }}
          mode="text"
          onPress={() => {
            if (this.state.bottle >= 10) {
              this.setState({ bottle: this.state.bottle - 10 }, () => (dataStore.bottle = this.state.bottle))
            }
          }}
        >
          -10mL
        </Button>
        <View style={{ flex: 1, marginTop: 23 }}>
          <Slider
            accessibilityLabel={i18n.t('a11y.sliderml')}
            accessibilityRole="adjustable"
            value={dataStore.bottle}
            minimumValue={0}
            maximumValue={240}
            step={10}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.primary}
            maximumTrackTintColor="#000000"
            onValueChange={bottle => this.setState({ bottle })}
          />
          <ThemedText palette={palette} style={styles.smallTimer}>
            {`${this.state.bottle}mL`}
          </ThemedText>
        </View>
        <Button
          accessibilityLabel={i18n.t('a11y.addml')}
          disabled={this.state.bottle === 240}
          color={palette.buttonColor}
          style={{ alignContent: 'center', justifyContent: 'center' }}
          mode="text"
          onPress={() => {
            if (this.state.bottle < 240) {
              this.setState({ bottle: this.state.bottle + 10 }, () => (dataStore.bottle = this.state.bottle))
            }
          }}
        >
          +10mL
        </Button>
      </View>
    )
  }

  /// Dialogs

  renderEditDurationDialog() {
    const { colors, palette } = this.props.theme
    const { showEditDurationDialog } = this.state
    return (
      <Portal>
        <Dialog visible={showEditDurationDialog} onDismiss={this.hideDialog('showEditDurationDialog')}>
          <Dialog.Title>{i18n.t('add.manualEntry')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              accessibilityLabel={i18n.t('a11y.durationPlaceholder')}
              label={i18n.t('add.durationPlaceholder')}
              value={this.state.manualTimer}
              keyboardType="numeric"
              onChangeText={manualTimer => this.setState({ manualTimer })}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
              {[5, 10, 15, 20, 25].map((e, key) => (
                <FAB
                  key={key}
                  small
                  style={[styles.fabTimer, { borderColor: lightTheme.colors.primary, borderWidth: 1, backgroundColor: colors.surface }]}
                  onPress={this.changeTimer(e.toString())}
                  icon={() => (
                    <ThemedText palette={palette} style={{ paddingTop: 2, textAlign: 'center' }}>
                      {e}
                    </ThemedText>
                  )}
                />
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button color={palette.buttonColor} onPress={() => this.forceTimer()}>
              {i18n.t('ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }

  renderErrorDialog() {
    const { palette } = this.props.theme
    const { showErrorDialog } = this.state
    return (
      <Portal>
        <Dialog visible={showErrorDialog} onDismiss={this.hideDialog('showErrorDialog')}>
          <Dialog.Content>
            <Paragraph>{i18n.t('add.noDuration')}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button color={palette.buttonColor} onPress={this.hideDialog('showErrorDialog')}>
              {i18n.t('ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }

  render() {
    const { colors, palette } = this.props.theme
    const { day, isDatePickerVisible, isTimePickerVisible } = this.state
    return (
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <Appbar.Header>
          <Appbar.BackAction accessibilityLabel={i18n.t('a11y.backIcon')} onPress={() => this.props.navigation.navigate('Home')} />
          <Appbar.Content title={i18n.t('navigation.addEntry')} />
          {this.state.sending ? (
            <Appbar.Action accessibilityLabel={i18n.t('a11y.loadingIcon')} icon={() => <ActivityIndicator size="small" color="white" />} />
          ) : (
            <Appbar.Action accessibilityLabel={i18n.t('a11y.addEntryIcon')} icon="check" onPress={() => this.validateEntry()} />
          )}
        </Appbar.Header>
        <View onLayout={this.onLayout} style={styles.mainContainer}>
          <View style={this.state.isLandscape ? styles.subContainerLandscape : { width: '100%' }}>
            <View>
              <ThemedText palette={palette}>{i18n.t('add.date')}</ThemedText>
              <View style={styles.dateContainer}>
                <TouchableOpacity onPress={this.showDatePicker}>
                  <ThemedText palette={palette} style={{ ...styles.date, borderBottomColor: this.props.theme.palette.separator }}>
                    {i18n.formatDay(day)}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.showTimePicker}>
                  <ThemedText palette={palette} style={{ ...styles.date, borderBottomColor: this.props.theme.palette.separator }}>
                    {i18n.formatTime(day)}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            <View>
              <ThemedText palette={palette}>{i18n.t('vitaminD')}</ThemedText>
              <Switch
                style={{ minHeight: 48 }}
                accessibilityLabel={i18n.t('a11y.vitaminD')}
                accessibilityRole="switch"
                value={dataStore.vitaminD}
                onValueChange={() => {
                  dataStore.vitaminD = !dataStore.vitaminD
                }}
              />
            </View>
            <ThemedText palette={palette}>{i18n.t('add.timeSpent')}</ThemedText>
            <View style={styles.timerContainer}>
              <Button
                accessibilityLabel={i18n.t('add.remove1min')}
                accessibilityRole="button"
                disabled={!dataStore.isRunning['left'] && !dataStore.isRunning['right']}
                color={palette.buttonColor}
                style={{ alignContent: 'center', justifyContent: 'center' }}
                mode="text"
                onPress={() => RNBreastFeeding.addTime(dataStore.currentTimerId, -60000)}
              >
                {i18n.t('add.remove1min')}
              </Button>
              <TouchableOpacity onPress={() => dataStore.currentTimerId && this.setState({ showEditDurationDialog: true })}>
                <ThemedText palette={palette} style={{ ...styles.timer, borderBottomColor: palette.separator }}>
                  {this.formatTime(dataStore.currentTimerId)}
                </ThemedText>
              </TouchableOpacity>
              <Button
                accessibilityLabel={i18n.t('add.add1min')}
                accessibilityRole="button"
                disabled={!dataStore.isRunning['left'] && !dataStore.isRunning['right']}
                color={palette.buttonColor}
                style={{ alignContent: 'center', justifyContent: 'center' }}
                mode="text"
                onPress={() => RNBreastFeeding.addTime(dataStore.currentTimerId, 60000)}
              >
                {i18n.t('add.add1min')}
              </Button>
            </View>
          </View>
          <View style={this.state.isLandscape ? styles.subContainerLandscape : { width: '100%', height: '50%' }}>
            <ThemedText palette={palette}>{i18n.t('add.breast')}</ThemedText>
            <View style={styles.fabContainer}>
              {this.renderButton('left')}
              {this.renderButton('right')}
            </View>
            <ThemedText palette={palette}>{i18n.t('bottle')}</ThemedText>
            {this.renderBottle()}
          </View>
          <DateTimePicker isVisible={isDatePickerVisible} onConfirm={this.handleDatePicked} onCancel={this.hideDatePicker} mode="date" />
          <DateTimePicker
            isVisible={isTimePickerVisible}
            onConfirm={this.handleTimePicked}
            onCancel={this.hideTimePicker}
            mode="time"
            is24Hour={i18n.uses24HourClock}
          />
          {this.renderEditDurationDialog()}
          {this.renderErrorDialog()}
        </View>
      </View>
    )
  }
}

export default withTheme(AddEntryScreen)
