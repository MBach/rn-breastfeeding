import React, { Component } from 'react'
import { DeviceEventEmitter, Dimensions, Text, TouchableOpacity, View } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import { withTheme, Button, Chip, Dialog, FAB, Paragraph, Portal, Switch, TextInput } from 'react-native-paper'
import DateTimePicker from 'react-native-modal-datetime-picker'
import { observer, inject } from 'mobx-react/native'
import moment from 'moment'
import RNBreastFeeding from '../RNBreastFeeding'

import { CHOICES, getMinAndSeconds, isNotRunning } from '../config'
import styles from '../styles'

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
 * @version 1.0
 */
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
    let value = dataStore.isRunning[timerId]
    let isRunning = { left: false, right: false, bottle: false }
    isRunning[timerId] = !value
    dataStore.isRunning = isRunning
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

  /// Dialogs

  renderEditDurationDialog() {
    const { palette } = this.props.theme
    const { showEditDurationDialog } = this.state
    return (
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
            <Paragraph>Votre saisie n’a pas de durée</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button color={palette.buttonColor} onPress={this.hideDialog('showErrorDialog')}>
              OK
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
          <ThemedText palette={palette}>Temps passé</ThemedText>
          <View style={styles.timerContainer}>
            <Button
              disabled={isNotRunning(dataStore.timers)}
              color={palette.buttonColor}
              style={{ alignContent: 'center', justifyContent: 'center' }}
              mode="text"
              onPress={() => RNBreastFeeding.addTime(dataStore.currentTimerId, -60000)}
            >
              -1min
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
        {this.renderEditDurationDialog()}
        {this.renderErrorDialog()}
      </View>
    )
  }
}

export default withTheme(AddEntryScreen)
