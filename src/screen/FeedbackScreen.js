import React, { Component } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import {
  withTheme,
  ActivityIndicator,
  Appbar,
  Button,
  Caption,
  RadioButton,
  Text,
  TextInput,
  Snackbar,
  Subheading
} from 'react-native-paper'
import { inject, observer } from 'mobx-react'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import moment from 'moment'
import { signIn } from '../hooks/SignIn'
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
  static navigationOptions = {
    header: null
  }

  constructor(props) {
    super(props)
    this.state = {
      radio: '',
      description: '',
      showSnackbar: false,
      snackBarMessage: '',
      sending: false,
      isAnonymous: !auth().currentUser || (auth().currentUser && auth().currentUser.isAnonymous)
    }
  }

  sendFeedback = async () => {
    const { radio, description } = this.state
    if (radio === '') {
      this.setState({ showSnackbar: true, snackBarMessage: i18n.t('feedback.errors.radio') })
    } else if (description.length < 20) {
      this.setState({ showSnackbar: true, snackBarMessage: i18n.t('feedback.errors.desc') })
    } else {
      this.setState({ sending: true })
      const ref = database().ref(`/feedback/${moment().unix()}`)
      await ref.set({ user: auth().currentUser.uid, type: radio, description })
      this.setState({ sending: false, showSnackbar: true, snackBarMessage: i18n.t('feedback.sent') })
    }
  }

  renderSnackBar = () => (
    <Snackbar visible={this.state.showSnackbar} onDismiss={() => this.setState({ showSnackbar: false })}>
      {this.state.snackBarMessage}
    </Snackbar>
  )

  renderRadio = (value, tr) => (
    <View style={styles.radioItem}>
      <RadioButton accessibilityLabel={value} accessibilityRole="radio" value={value} />
      <Text onPress={() => this.setState({ radio: value })}>{i18n.t(tr)}</Text>
    </View>
  )

  render = () => (
    <View style={{ backgroundColor: this.props.theme.colors.background, flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction accessibilityLabel={i18n.t('a11y.backIcon')} onPress={() => this.props.navigation.navigate('Home')} />
        <Appbar.Content title={i18n.t('navigation.feedback')} />
        {this.state.sending ? (
          <Appbar.Action accessibilityLabel={i18n.t('a11y.loadingIcon')} icon={() => <ActivityIndicator size="small" color="white" />} />
        ) : (
          <Appbar.Action accessibilityLabel={i18n.t('a11y.sendFeedbackIcon')} icon="send" onPress={() => this.sendFeedback()} />
        )}
      </Appbar.Header>
      <ScrollView keyboardShouldPersistTaps={'always'} style={{ margin: 8 }}>
        <Subheading>{i18n.t('feedback.title')}</Subheading>
        <Text>{i18n.t('feedback.subtitle')}</Text>
        <RadioButton.Group onValueChange={radio => this.setState({ radio })} value={this.state.radio}>
          <Caption style={styles.mt}>{`${i18n.t('feedback.caption')} *`}</Caption>
          {this.renderRadio('comment', 'feedback.comment')}
          {this.renderRadio('suggestion', 'feedback.suggestion')}
          {this.renderRadio('bug', 'feedback.bug')}
        </RadioButton.Group>
        <TextInput
          accessibilityLabel={i18n.t('feedback.desc')}
          mode={'outlined'}
          label={`${i18n.t('feedback.desc')} *`}
          value={this.state.description}
          multiline
          onChangeText={description => this.setState({ description })}
        />
        {this.state.isAnonymous && (
          <>
            <Subheading>{i18n.t('feedback.notConnected')}</Subheading>
            <Button
              mode="contained"
              icon="account-circle"
              style={styles.mt}
              onPress={() => signIn(() => this.setState({ isAnonymous: false }))}
            >
              {i18n.t('feedback.loginWithGoogle')}
            </Button>
          </>
        )}
      </ScrollView>
      {this.renderSnackBar()}
    </View>
  )
}

export default withTheme(FeedbackScreen)
