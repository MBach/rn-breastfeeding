import React, { Component } from 'react'
import { DeviceEventEmitter, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import { withTheme, Button, Chip, Dialog, FAB, IconButton, Paragraph, Portal, Switch, TextInput } from 'react-native-paper'
import Slider from '@react-native-community/slider'
import DateTimePicker from 'react-native-modal-datetime-picker'
import { observer, inject } from 'mobx-react'
import moment from 'moment'
import RNBreastFeeding from '../RNBreastFeeding'
import i18n from '../locales/i18n'

import { getMinAndSeconds, isNotRunning } from '../config'

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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  chipTimer: {
    flexGrow: 1,
    marginHorizontal: 4,
    marginTop: 16,
    textAlign: 'center'
  }
})

const resetAction = StackActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'Home' })]
})

function ThemedText({ style, palette, children }) {
  return <Text style={{ ...style, color: palette.sectionTextColor }}>{children}</Text>
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
  /// Add action in header
  static navigationOptions = ({ navigation, screenProps }) => {
    const { params } = navigation.state
    return {
      title: i18n.t('navigation.addEntry'),
      headerStyle: { backgroundColor: screenProps.primary },
      headerRight: <IconButton icon="check" color="white" onPress={() => params.handleSave && params.handleSave()} />
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      isDatePickerVisible: false,
      isTimePickerVisible: false,
      day: dataStore.day ? moment.unix(dataStore.day) : moment(),
      showEditDurationDialog: false,
      showErrorDialog: false,
      manualTimer: '',
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    }
    this.timerUpdated = null
    this.inBackground = null
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

    this.props.navigation.setParams({ handleSave: () => this.validateEntry() })
    if (!isNotRunning(dataStore.timers)) {
      dataStore.day = this.state.day.unix()
    }
  }

  componentWillUnmount() {
    if (this.timerUpdated) {
      this.timerUpdated.remove()
    }
    if (this.props.navigation.state.params.autoRefresh) {
      this.props.navigation.state.params.autoRefresh()
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

  validateEntry = () => {
    const { day } = this.state
    if (dataStore.timers['left'] > 0 || dataStore.timers['right'] > 0 || dataStore.timers['bottle'] > 0) {
      /// Save data
      const data = {
        date: day.unix(),
        day: day.startOf('day').unix(),
        timers: { ...dataStore.timers },
        vitaminD: dataStore.vitaminD
      }
      dataStore.addEntry(data)
      RNBreastFeeding.stopTimers()
      this.props.navigation.dispatch(resetAction)
    } else {
      this.setState({ showErrorDialog: true })
    }
  }

  formatTime = timerId => getMinAndSeconds(dataStore.timers[timerId])

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

  /// Dialogs

  renderEditDurationDialog() {
    const { palette } = this.props.theme
    const { showEditDurationDialog } = this.state
    return (
      <Portal>
        <Dialog visible={showEditDurationDialog} onDismiss={this.hideDialog('showEditDurationDialog')}>
          <Dialog.Title>{i18n.t('add.manualEntry')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={i18n.t('add.durationPlaceholder')}
              mode={'outlined'}
              value={this.state.manualTimer}
              keyboardType="numeric"
              onChangeText={manualTimer => this.setState({ manualTimer })}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {[5, 10, 15, 20, 25].map((e, key) => (
                <Chip key={key} style={styles.chipTimer} onPress={this.changeTimer(e.toString())}>
                  {e}
                </Chip>
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
      <View onLayout={this.onLayout} style={{ backgroundColor: colors.background, ...styles.mainContainer }}>
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
          <View style={{ marginBottom: 16 }}>
            <ThemedText palette={palette}>{i18n.t('vitaminD')}</ThemedText>
            <Switch
              value={dataStore.vitaminD}
              onValueChange={() => {
                dataStore.vitaminD = !dataStore.vitaminD
              }}
            />
          </View>
          <ThemedText palette={palette}>{i18n.t('add.timeSpent')}</ThemedText>
          <View style={styles.timerContainer}>
            <Button
              disabled={isNotRunning(dataStore.timers)}
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
              disabled={isNotRunning(dataStore.timers)}
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
          <View style={styles.buttonsContainer}>
            {this.renderButton('left')}
            {this.renderButton('right')}
          </View>
          <ThemedText palette={palette}>{i18n.t('bottle')}</ThemedText>
          <Slider minimumValue={0}
            maximumValue={240}
            step={10}
            minimumTrackTintColor={colors.primary}
            thumbTintColor={colors.primary}
            maximumTrackTintColor="#000000" />
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
    )
  }
}

export default withTheme(AddEntryScreen)
