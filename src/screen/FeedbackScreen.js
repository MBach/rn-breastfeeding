import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'
import { withTheme, Caption, IconButton, RadioButton, Text, TextInput, Snackbar, Subheading } from 'react-native-paper'
import { inject, observer } from 'mobx-react'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import moment from 'moment'
import i18n from '../locales/i18n'

const styles = StyleSheet.create({
  mt: {
    marginTop: 16
  },
  radioItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }
})

/**
 *
 * @author Matthieu BACHELIER
 * @since 2019-08
 * @version 1.0
 */
@inject('dataStore')
@observer
class FeedbackScreen extends Component {
  static navigationOptions = ({ navigation, screenProps }) => {
    const { params } = navigation.state
    return {
      title: i18n.t('navigation.feedback'),
      headerStyle: { backgroundColor: screenProps.primary },
      headerRight: <IconButton icon="send" color="white" onPress={() => params.handleSend && params.handleSend()} />
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      radio: '',
      description: '',
      showSnackbar: false,
      snackBarMessage: ''
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({ handleSend: () => this.sendFeedback() })
    console.log('auth().currentUser', auth().currentUser.isAnonymous)
  }

  sendFeedback = async () => {
    const { radio, description } = this.state
    if (radio === '') {
      this.setState({ showSnackbar: true, snackBarMessage: i18n.t('feedback.errors.radio') })
    } else if (description.length < 20) {
      this.setState({ showSnackbar: true, snackBarMessage: i18n.t('feedback.errors.desc') })
    } else {
      const ref = database().ref(`/feedback/${moment().unix()}`)
      ref.set({ user: auth().currentUser.uid, type: radio, description })
    }
  }

  renderSnackBar = () => (
    <Snackbar visible={this.state.showSnackbar} onDismiss={() => this.setState({ showSnackbar: false })}>
      {this.state.snackBarMessage}
    </Snackbar>
  )

  renderRadio = (value, tr) => (
    <View style={styles.radioItem}>
      <RadioButton value={value} />
      <Text onPress={() => this.setState({ radio: value })}>{i18n.t(tr)}</Text>
    </View>
  )

  render = () => (
    <View style={{ backgroundColor: this.props.theme.colors.background, flex: 1, padding: 8 }}>
      <Subheading>Thank you for using BreastFeeding App</Subheading>
      <Text>Please share your comments, suggestions or bug report below</Text>
      <RadioButton.Group onValueChange={radio => this.setState({ radio })} value={this.state.radio}>
        <Caption style={styles.mt}>{`${i18n.t('feedback.caption')} *`}</Caption>
        {this.renderRadio('comment', 'feedback.comment')}
        {this.renderRadio('suggestion', 'feedback.suggestion')}
        {this.renderRadio('bug', 'feedback.bug')}
      </RadioButton.Group>
      <TextInput
        style={styles.mt}
        mode={'outlined'}
        label={`${i18n.t('feedback.desc')} *`}
        value={this.state.description}
        multiline
        onChangeText={description => this.setState({ description })}
      />
      {this.renderSnackBar()}
    </View>
  )
}

export default withTheme(FeedbackScreen)
