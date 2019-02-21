import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import { withTheme, Button, Chip, Dialog, FAB, List, Paragraph, Portal, Switch, TextInput } from 'react-native-paper'
import DateTimePicker from 'react-native-modal-datetime-picker'
import { observer, inject } from 'mobx-react/native'
import moment from 'moment'

import { CHOICES, mapChoice } from '../config'
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
        this.props.navigation.dispatch(resetAction)
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
    const { palette } = this.props.theme
    return (
      <Button
        style={styles.buttons}
        color={this.state.toggles[value] ? palette.primaryColor : palette.buttonColor}
        mode={this.state.toggles[value] ? 'contained' : 'outlined'}
        onPress={() => this.toggle(value)}
      >
        {mapChoice(value)}
      </Button>
    )
  }

  render() {
    const { colors, palette } = this.props.theme
    const { day, isDatePickerVisible, isTimePickerVisible, isRunning, timer, showEditDurationDialog, showErrorDialog } = this.state
    const { left, right, both, bottle } = this.state.toggles
    return (
      <View style={{ backgroundColor: colors.background, ...styles.mainContainer }}>
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
        <ThemedText palette={palette}>Sein</ThemedText>
        <View style={styles.buttonsContainer}>
          {this.renderButton('left')}
          {this.renderButton('right')}
          {this.renderButton('both')}
          {this.renderButton('bottle')}
        </View>
        <View style={{ marginBottom: 16 }}>
          <ThemedText palette={palette}>Vitamine D</ThemedText>
          <Switch
            value={this.state.vitaminD}
            onValueChange={() => {
              this.setState({ vitaminD: !this.state.vitaminD })
            }}
          />
        </View>
        <ThemedText palette={palette}>Durée de la tétée</ThemedText>
        <View style={styles.timerContainer}>
          <Button
            color={palette.buttonColor}
            style={{ alignContent: 'center', justifyContent: 'center' }}
            mode="text"
            onPress={this.addTime(-60000)}
          >
            -1min
          </Button>
          <TouchableOpacity onPress={() => this.setState({ showEditDurationDialog: true })}>
            <ThemedText palette={palette} style={{ ...styles.timer, borderBottomColor: this.props.theme.palette.separator }}>
              {this.formatDate()}
            </ThemedText>
          </TouchableOpacity>
          <Button
            color={palette.buttonColor}
            style={{ alignContent: 'center', justifyContent: 'center' }}
            mode="text"
            onPress={this.addTime(60000)}
          >
            +1min
          </Button>
        </View>
        <DateTimePicker isVisible={isDatePickerVisible} onConfirm={this.handleDatePicked} onCancel={this.hideDatePicker} mode="date" />
        <DateTimePicker isVisible={isTimePickerVisible} onConfirm={this.handleTimePicked} onCancel={this.hideTimePicker} mode="time" />
        <FAB
          style={[styles.fab, { backgroundColor: isRunning ? colors.secondary : colors.primary }]}
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
              <Button color={palette.buttonColor} onPress={() => this.forceTimer()}>
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={showErrorDialog} onDismiss={this.hideDialog('showErrorDialog')}>
            <Dialog.Content>
              <Paragraph>
                {(left || right || both || bottle) && !timer ? 'Votre tétée n’a pas de durée' : 'Hmm... Vous n’avez rien saisi'}
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
