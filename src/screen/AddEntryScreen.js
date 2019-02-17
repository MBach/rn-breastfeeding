import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Button, Chip, Dialog, FAB, Paragraph, Portal, Switch, TextInput } from 'react-native-paper'
import DateTimePicker from 'react-native-modal-datetime-picker'
import { observer, inject } from 'mobx-react/native'
import moment from 'moment'

import { CHOICES, mapChoice } from '../config'
import styles, { palette } from '../styles'

@inject('dataStore')
@observer
export default class AddEntryScreen extends Component {
  /// Add action in header
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state
    return {
      title: 'Ajouter une saisie',
      headerRight: <Button icon="check" color={palette.primaryTextColor} onPress={() => params.handleSave && params.handleSave()} />
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      isDatePickerVisible: false,
      isTimePickerVisible: false,
      day: moment(),
      timer: null,
      timerStart: null,
      elapsed: null,
      in: false,
      toggles: { left: false, right: false, both: false, bottle: false },
      vitaminD: false,
      isRunning: false,
      showEditDurationDialog: false,
      showErrorDialog: false,
      manualTimer: ''
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({ handleSave: () => this.validateEntry() })
    this.startStopTimer()
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  /// Date & time pickers

  showDatePicker = () => this.setState({ isDatePickerVisible: true })
  hideDatePicker = () => this.setState({ isDatePickerVisible: false })
  handleDatePicked = date => {
    let { day } = this.state
    const mDate = moment(date)
    day.year(mDate.year())
    day.dayOfYear(mDate.dayOfYear())
    this.setState({ day })
    this.hideDatePicker()
  }

  handleTimePicked = time => {
    let { day } = this.state
    const mTime = moment(time)
    day.hour(mTime.hour())
    day.minute(mTime.minute())
    this.setState({ day })
    this.hideTimePicker()
  }
  showTimePicker = () => this.setState({ isTimePickerVisible: true })
  hideTimePicker = () => this.setState({ isTimePickerVisible: false })

  startStopTimer = () => {
    if (this.state.isRunning) {
      this.setState({ elapsed: this.state.timer })
      clearInterval(this.timer)
    } else {
      this.timer = setInterval(() => {
        console.log('diff', new Date() - this.state.timerStart + this.state.elapsed)
        this.setState({ timer: new Date() - this.state.timerStart + this.state.elapsed })
      }, 1000)
    }
    this.setState({ isRunning: !this.state.isRunning, timerStart: new Date() })
  }

  /// Buttons

  toggle = v => {
    let toggles = { left: false, right: false, both: false, bottle: false }
    toggles[v] = !this.state.toggles[v]
    this.setState({ toggles })
  }

  /// Validation

  validateEntry = () => {
    const { day, timer, vitaminD } = this.state
    const { left, right, both, bottle } = this.state.toggles
    if (left || right || both || bottle) {
      if (timer) {
        let choice
        if (left) choice = CHOICES.LEFT
        if (right) choice = CHOICES.RIGHT
        if (both) choice = CHOICES.BOTH
        if (bottle) choice = CHOICES.BOTTLE

        /// Save data
        const data = {
          date: day.unix(),
          day: day.startOf('day').unix(),
          duration: this.formatDate(),
          choice,
          vitaminD
        }
        dataStore.addEntry(data)
        this.props.navigation.replace('Home')
      } else {
        this.setState({ showErrorDialog: true })
      }
    } else {
      this.setState({ showErrorDialog: true })
    }
  }

  formatDate = () => {
    const d = moment.duration(this.state.timer)
    if (d.minutes() < 1) {
      return d.seconds() + 's'
    } else {
      if (d.seconds() < 10) {
        return d.minutes() + 'min 0' + d.seconds() + 's'
      } else {
        return d.minutes() + 'min ' + d.seconds() + 's'
      }
    }
  }

  forceTimer = () => {
    let timer = moment.duration(this.state.manualTimer * 60 * 1000).asMilliseconds()
    this.setState({ timer, elapsed: timer, showEditDurationDialog: false })
  }

  hideDialog = dialog => () => this.setState({ [dialog]: false })

  ///

  changeTimer = manualTimer => () => this.setState({ manualTimer })

  addTime = value => () => {
    let { timer } = this.state
    timer += value
    timer = timer - (timer % 60000)
    this.setState({ timer, elapsed: timer })
  }

  /// Renderers

  renderButton = value => {
    return (
      <Button
        style={styles.buttons}
        color={palette.primaryColor}
        mode={this.state.toggles[value] ? 'contained' : 'outlined'}
        onPress={() => this.toggle(value)}
      >
        {mapChoice(value)}
      </Button>
    )
  }

  render() {
    const { day, isDatePickerVisible, isTimePickerVisible, isRunning, timer, showEditDurationDialog, showErrorDialog } = this.state
    const { left, right, both, bottle } = this.state.toggles
    return (
      <View style={styles.mainContainer}>
        <Text>Date</Text>
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={this.showDatePicker}>
            <Text style={styles.date}>{day.format('DD/MM/YY')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.showTimePicker}>
            <Text style={styles.date}>{day.format('HH:mm')}</Text>
          </TouchableOpacity>
        </View>
        <Text>Sein</Text>
        <View style={styles.buttonsContainer}>
          {this.renderButton('left')}
          {this.renderButton('right')}
          {this.renderButton('both')}
          {this.renderButton('bottle')}
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text>Vitamine D</Text>
          <Switch
            value={this.state.vitaminD}
            onValueChange={() => {
              this.setState({ vitaminD: !this.state.vitaminD })
            }}
          />
        </View>
        <Text>Durée de la tétée</Text>
        <View style={styles.timerContainer}>
          <Button style={{ alignContent: 'center', justifyContent: 'center' }} mode="text" onPress={this.addTime(-60000)}>
            -1min
          </Button>
          <TouchableOpacity onPress={() => this.setState({ showEditDurationDialog: true })}>
            <Text style={styles.timer}>{this.formatDate()}</Text>
          </TouchableOpacity>
          <Button style={{ alignContent: 'center', justifyContent: 'center' }} mode="text" onPress={this.addTime(60000)}>
            +1min
          </Button>
        </View>
        <DateTimePicker isVisible={isDatePickerVisible} onConfirm={this.handleDatePicked} onCancel={this.hideDatePicker} mode="date" />
        <DateTimePicker isVisible={isTimePickerVisible} onConfirm={this.handleTimePicked} onCancel={this.hideTimePicker} mode="time" />
        <FAB
          style={[styles.fab, isRunning ? styles.timerRunning : styles.timerStopped]}
          icon={isRunning ? 'pause' : 'timer'}
          onPress={() => this.startStopTimer()}
        />
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
                <Chip style={styles.chipTimer} onPress={this.changeTimer('5')}>
                  5
                </Chip>
                <Chip style={styles.chipTimer} onPress={this.changeTimer('10')}>
                  10
                </Chip>
                <Chip style={styles.chipTimer} onPress={this.changeTimer('15')}>
                  15
                </Chip>
                <Chip style={styles.chipTimer} onPress={this.changeTimer('20')}>
                  20
                </Chip>
                <Chip style={styles.chipTimer} onPress={this.changeTimer('25')}>
                  25
                </Chip>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => this.forceTimer()}>OK</Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={showErrorDialog} onDismiss={this.hideDialog('showErrorDialog')}>
            <Dialog.Content>
              <Paragraph>
                {(left || right || both || bottle) && !timer ? 'Votre tétée n’a pas de durée' : 'Hmm... Vous n’avez rien saisi'}
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={this.hideDialog('showErrorDialog')}>OK</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    )
  }
}
