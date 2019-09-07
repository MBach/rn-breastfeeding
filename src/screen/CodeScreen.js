import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import { withTheme, Subheading, Button, Snackbar, TextInput, ActivityIndicator } from 'react-native-paper'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import { inject, observer } from 'mobx-react'

import { signIn } from '../hooks/SignIn'
import i18n from '../locales/i18n'

const styles = StyleSheet.create({
  signInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16
  },
  marginV: {
    marginVertical: 16
  }
})

const resetAction = StackActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'Home', params: { accountLinked: true } })]
})

/**
 *
 * @author Matthieu BACHELIER
 * @since 2019-09
 * @version 1.0
 */
@inject('dataStore')
@observer
class CodeScreen extends Component {
  /// Add action in header
  static navigationOptions = ({ screenProps }) => {
    return {
      title: i18n.t('navigation.code'),
      headerStyle: { backgroundColor: screenProps.primary }
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      code: '',
      loading: false,
      showSnackbar: false,
      snackBarMessage: '',
      isAnonymous: auth().currentUser && auth().currentUser.isAnonymous
    }
  }

  verifyCode = () => {
    this.setState({ loading: true }, async () => {
      const refInvites = database().ref(`/invites/${this.state.code}`)
      const snapshot = await refInvites.once('value')
      if (!snapshot.val()) {
        this.setState({ loading: false, showSnackbar: true, snackBarMessage: i18n.t('code.invalidCode') })
        return
      }

      const values = Object.values(snapshot)
      const arr = Object.values(values[0].value)
      const index = arr.findIndex(s => s.dest === auth().currentUser.email)
      if (index === -1) {
        this.setState({ loading: false, showSnackbar: true, snackBarMessage: i18n.t('code.invalidCode') })
        return
      }

      const ref2 = database().ref(`/users/${auth().currentUser.uid}`)
      const sender = arr[index].sender
      ref2.set({ linked: true, host: sender })
      const refUserInvites = database().ref(`/users/${sender}/invites`)
      const userInvitesValues = await refUserInvites.once('value')
      if (userInvitesValues.val()) {
        const uiv = Object.values(userInvitesValues)
        const arr2 = Object.values(uiv[0].value)
        const index2 = arr2.findIndex(s => s.email === auth().currentUser.email)
        if (index2 !== -1) {
          const child = refUserInvites.child(`/${index2}`)
          // Remove 'code' key
          child.set({ email: auth().currentUser.email, status: 'active', uid: auth().currentUser.uid })
          // Remove invitation
          const filteredInvites = arr.filter(s => s.dest !== auth().currentUser.email)
          refInvites.set(filteredInvites)
          this.props.navigation.dispatch(resetAction)
        }
      }
      this.setState({ loading: false })
    })
  }

  render = () => {
    const { colors } = this.props.theme
    return (
      <>
        <View style={{ padding: 8, backgroundColor: colors.background, flex: 1 }}>
          <Subheading style={{ marginBottom: 16 }}>You have received a code from someone?</Subheading>
          {this.state.isAnonymous ? (
            <>
              <Subheading>To access shared inputs, please sign in and enter the validation code</Subheading>
              <View style={styles.signInButton}>
                <Button
                  mode="contained"
                  onPress={() =>
                    signIn(() => {
                      this.setState({ isAnonymous: auth().currentUser && auth().currentUser.isAnonymous })
                    })
                  }
                >
                  Sign in
                </Button>
              </View>
            </>
          ) : (
            <Subheading>To access shared inputs, enter the validation code</Subheading>
          )}
          <TextInput
            ref={input => (this.codeInput = input)}
            label="Code"
            placeholder="4 digits code"
            keyboardType="numeric"
            maxLength={4}
            value={this.state.code}
            onChangeText={code => this.setState({ code })}
          />
          <View style={styles.marginV}>
            {this.state.loading ? (
              <ActivityIndicator />
            ) : (
              <Button disabled={dataStore.isAnonymous} mode="contained" onPress={() => !this.state.loading && this.verifyCode()}>
                Verify
              </Button>
            )}
          </View>
        </View>
        <Snackbar visible={this.state.showSnackbar} onDismiss={() => this.setState({ showSnackbar: false })}>
          {this.state.snackBarMessage}
        </Snackbar>
      </>
    )
  }
}

export default withTheme(CodeScreen)
