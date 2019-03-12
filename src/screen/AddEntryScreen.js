import React, { Component } from 'react'
import { DeviceEventEmitter, Dimensions, Text, TouchableOpacity, View } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import { withTheme, Button, Chip, Dialog, FAB, Paragraph, Portal, Switch, TextInput } from 'react-native-paper'
import DateTimePicker from 'react-native-modal-datetime-picker'
import { observer, inject } from 'mobx-react/native'
import moment from 'moment'
import RNBreastFeeding from '../RNBreastFeeding'

import { CHOICES, humanizeTime } from '../config'
import styles from '../styles'

const resetAction = StackActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'Home' })]
})

function ThemedText({ style, palette, children }) {
  return <Text style={{ ...style, color: palette.sectionTextColor }}>{children}</Text>
}

@inject('dataStore')
@observer
class AddEntryScreen extends Component {
  /// Add action in header
  static navigationOptions = ({ navigation, screenProps }) => {
    const { params } = navigation.state
    return {
      title: 'Ajouter une saisie',
      headerStyle: { backgroundColor: screenProps.primary },
      headerRight: <Button icon="check" color="white" onPress={() => params.handleSave && params.handleSave()} />
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
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    }
    this.timerUpdated = null
    this.isRunningBackground = null
  }

  componentDidMount() {
    this.timerUpdated = DeviceEventEmitter.addListener('onTick', payload => {
      const { timerId, isRunning, timer } = payload
      if (isRunning) {
        let timers = { ...dataStore.timers }
        timers[timerId] = timer
        dataStore.timers = timers
        console.log('payload', timers)
      }
      dataStore.isRunning[timerId] = isRunning
    })
    this.isRunningBackground = DeviceEventEmitter.addListener('isRunningBackground', v => (dataStore.isRunningBackground = v))

    this.props.navigation.setParams({ handleSave: () => this.validateEntry() })
    /*if (!dataStore.isRunningBackground) {
      RNBreastFeeding.startTimer()
      dataStore.isRunningBackground = true
      dataStore.day = this.state.day.unix()
    }*/
  }

  componentWillUnmount() {
    if (this.timerUpdated) {
      this.timerUpdated.remove()
    }
    if (this.isRunningBackground) {
      this.isRunningBackground.remove()
    }
  }

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
    let value = dataStore.isRunning[timerId]
    let isRunning = { left: false, right: false, bottle: false }
    isRunning[timerId] = !value
    console.log('isRunning', isRunning)
    dataStore.isRunning = isRunning
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

  formatTime = timerId => humanizeTime(dataStore.timers[timerId])

  forceTimer = () => {
    RNBreastFeeding.changeTo(this.state.manualTimer * 60 * 1000)
    this.setState({ showEditDurationDialog: false })
  }

  hideDialog = dialog => () => this.setState({ [dialog]: false })

  changeTimer = manualTimer => () => this.setState({ manualTimer })

  /// Renderers

  renderButton = timerId => {
    const { colors, palette } = this.props.theme
    let image
    switch (timerId) {
      case CHOICES.LEFT:
        image = require(`../assets/left.png`)
        break
      case CHOICES.RIGHT:
        image = require(`../assets/right.png`)
        break
      case CHOICES.BOTTLE:
        image = require(`../assets/bottle.png`)
        break
    }
    return (
      <View style={{ flexDirection: 'column' }}>
        <FAB
          style={[styles.fab, { backgroundColor: dataStore.isRunning[timerId] ? colors.secondary : colors.primary }]}
          icon={dataStore.isRunning[timerId] ? 'pause' : image}
          onPress={() => this.pauseResumeTimer(timerId)}
        />
        <ThemedText palette={palette} style={styles.smallTimer}>
          {this.formatTime(timerId)}
        </ThemedText>
      </View>
    )
  }

  onLayout = () =>
    this.setState({
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    })

  render() {
    const { colors, palette } = this.props.theme
    const { day, isDatePickerVisible, isTimePickerVisible, showEditDurationDialog, showErrorDialog } = this.state
    const { left, right, bottle } = dataStore.toggles
    return (
      <View onLayout={this.onLayout} style={{ backgroundColor: colors.background, ...styles.mainContainer }}>
        <View style={this.state.isLandscape ? styles.subContainerLandscape : { width: '100%' }}>
          <View>
            <ThemedText palette={palette}>Date</ThemedText>
            <View style={styles.dateContainer}>
              <TouchableOpacity onPress={this.showDatePicker}>
                <ThemedText palette={palette} style={{ ...styles.date, borderBottomColor: this.props.theme.palette.separator }}>
                  {day.format('DD/MM/YY')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.showTimePicker}>
                <ThemedText palette={palette} style={{ ...styles.date, borderBottomColor: this.props.theme.palette.separator }}>
                  {day.format('HH:mm')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ marginBottom: 16 }}>
            <ThemedText palette={palette}>Vitamine D</ThemedText>
            <Switch
              value={dataStore.vitaminD}
              onValueChange={() => {
                dataStore.vitaminD = !dataStore.vitaminD
              }}
            />
          </View>

          <ThemedText palette={palette}>Temps écoulé depuis le début</ThemedText>
          <View style={styles.timerContainer}>
            <Button
              color={palette.buttonColor}
              style={{ alignContent: 'center', justifyContent: 'center' }}
              mode="text"
              onPress={() => RNBreastFeeding.addTime(-60000)}
            >
              -1min
            </Button>
            <TouchableOpacity onPress={() => this.setState({ showEditDurationDialog: true })}>
              <ThemedText palette={palette} style={{ ...styles.timer, borderBottomColor: palette.separator }}>
                {this.formatTime()}
              </ThemedText>
            </TouchableOpacity>
            <Button
              color={palette.buttonColor}
              style={{ alignContent: 'center', justifyContent: 'center' }}
              mode="text"
              onPress={() => RNBreastFeeding.addTime(60000)}
            >
              +1min
            </Button>
          </View>
        </View>
        <View style={this.state.isLandscape ? styles.subContainerLandscape : { width: '100%', height: '50%' }}>
          <ThemedText palette={palette}>Sein</ThemedText>
          <View style={styles.buttonsContainer}>
            {this.renderButton('left')}
            {this.renderButton('right')}
            {this.renderButton('bottle')}
          </View>
        </View>
        <DateTimePicker isVisible={isDatePickerVisible} onConfirm={this.handleDatePicked} onCancel={this.hideDatePicker} mode="date" />
        <DateTimePicker isVisible={isTimePickerVisible} onConfirm={this.handleTimePicked} onCancel={this.hideTimePicker} mode="time" />

        <Portal>
          <Dialog visible={showEditDurationDialog} onDismiss={this.hideDialog('showEditDurationDialog')}>
            <Dialog.Title>Saisie manuelle</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Durée en minutes"
                mode="flat"
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
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={showErrorDialog} onDismiss={this.hideDialog('showErrorDialog')}>
            <Dialog.Content>
              <Paragraph>
                {dataStore.timers[left] === 0 &&
                  dataStore.timers[right] === 0 &&
                  dataStore.timers[bottle] === 0 &&
                  'Votre saisie n’a pas de durée'}
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={palette.buttonColor} onPress={this.hideDialog('showErrorDialog')}>
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    )
  }
}

export default withTheme(AddEntryScreen)
