import React, { Component } from 'react'
import { FlatList, Image, PermissionsAndroid, ScrollView, StyleSheet, View } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import {
  withTheme,
  Avatar,
  Banner,
  Button,
  Caption,
  Dialog,
  IconButton,
  List,
  Paragraph,
  Portal,
  Snackbar,
  Surface,
  TextInput,
  Subheading
} from 'react-native-paper'
import Contacts from 'react-native-contacts'
import Mailer from 'react-native-mail'
import moment from 'moment'
import auth from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import { inject, observer } from 'mobx-react'

import { validateEmail, SHARE_STATUS } from '../config'
import i18n from '../locales/i18n'
import { lightTheme } from '../styles'

const styles = StyleSheet.create({
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 12,
    marginHorizontal: 12
  },
  suggestions: {
    elevation: 2,
    marginTop: -24,
    marginBottom: 8
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24
  },
  popupButtonsContainer: {
    flexDirection: 'row',
    minHeight: 30,
    justifyContent: 'space-between',
    marginHorizontal: 20
  }
})

const resetAction = StackActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'Home' })]
})

/**
 *
 * @author Matthieu BACHELIER
 * @since 2019-08
 * @version 1.0
 */
@inject('dataStore')
@observer
class ShareScreen extends Component {
  /// Add action in header
  static navigationOptions = ({ navigation, screenProps }) => {
    const { params } = navigation.state
    return {
      title: i18n.t('navigation.contact'),
      headerStyle: { backgroundColor: screenProps.primary },
      headerRight: (
        <IconButton
          accessibilityLabel={i18n.t('a11y.sendInviteIcon')}
          icon="check"
          color="white"
          onPress={() => params.handleSend && params.handleSend()}
        />
      )
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      showBanner: true,
      email: '',
      invites: [],
      contacts: [],
      suggestions: [],
      showSnackbar: false,
      snackBarMessage: '',
      hasInvalidEmail: false,
      userToRemove: null,
      unlinkDialog: false
    }
  }

  componentDidMount() {
    setTimeout(() => {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
        .then(res => {
          // console.warn(res)
        })
        .catch(err => {
          // console.warn(err)
        })
    }, 1000)
    this.props.navigation.setParams({ handleSend: () => this.aboutToSendInvites() })
    // Fetch all invites (whether one has accepted or not the invitation)
    const ref = database().ref(`/users/${auth().currentUser.uid}/invites`)
    ref.once('value').then(snapshot => {
      if (snapshot.val()) {
        let invites = []
        const data = snapshot.val()
        for (const invite of data) {
          invites.push(invite)
        }
        this.setState({ invites })
      }
    })
  }

  addContactFromTextInput = () => {
    const { email } = this.state
    if (email === '') {
      return
    }
    if (this.state.contacts.findIndex(c => c.email === email) >= 0 || this.state.invites.findIndex(c => c.email === email) >= 0) {
      this.setState({
        showSnackbar: true,
        snackBarMessage: i18n.t('share.contactAlreadyAdded'),
        email
      })
    } else {
      const isValid = validateEmail(email)
      const contacts = [...this.state.contacts, { email, isValid }]
      this.setState({ contacts, email: '', suggestions: [] })
    }
  }

  addContactFromSuggestions = item => () => {
    const { contacts } = this.state
    if (contacts.some(c => c.email === item.emailAddresses[0].email)) {
      this.setState({
        showSnackbar: true,
        snackBarMessage: i18n.t('share.contactAlreadyAdded'),
        email: item.emailAddresses[0].email
      })
    } else {
      let c = [
        ...contacts,
        { displayName: item.displayName, email: item.emailAddresses[0].email, photo: item.thumbnailPath, removable: true, isValid: true }
      ]
      this.setState({ contacts: c, email: '', suggestions: [] })
    }
  }

  removeContact = email => this.setState({ contacts: this.state.contacts.filter(c => c.email !== email) })

  onChangeText = email => {
    this.setState({ email })
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS).then(res => {
      if (!res) {
        return
      }
      if (email.length > 1) {
        Contacts.getContactsMatchingString(email, (err, contacts) => {
          if (err === 'denied') {
            // console.warn('permission denied')
          } else {
            // Filter contacts without email addresses
            contacts = contacts.filter(c => c.emailAddresses.length > 0).map(c => ({ ...c, photo: c.thumbnailPath }))
            // Filter contacts already invited
            const emails = this.state.invites.map(i => i.email)
            let suggestions = []
            for (const contact of contacts) {
              if (!emails.includes(contact.emailAddresses[0].email)) {
                suggestions.push(contact)
              }
            }
            this.setState({ suggestions })
          }
        })
      } else {
        this.setState({ suggestions: [] })
      }
    })
  }

  aboutToSendInvites = () => {
    const index = this.state.contacts.findIndex(c => !c.isValid)
    if (index === -1) {
      this.sendInvites(this.state.contacts)
    } else {
      this.setState({ hasInvalidEmail: true })
    }
  }

  sendInvites = async contacts => {
    if (contacts.length < 1) {
      this.props.navigation.pop()
      return
    }

    // Migrate data to firebase only here
    dataStore.migrate()

    // Generate a 4 digits code
    const code = Math.floor(1000 + Math.random() * 9000)
    const date = moment().unix()

    // Create shares on firebase
    const ref = database().ref(`/users/${auth().currentUser.uid}/invites`)
    const snapshot = await ref.once('value')
    let invites = []
    if (snapshot && snapshot.val() !== null) {
      for (const invite of snapshot.val()) {
        invites.push(invite)
      }
    }
    for (const contact of contacts) {
      invites.push({ email: contact.email, status: SHARE_STATUS.PENDING, code, date })
    }
    ref.set(invites)

    const ref2 = database().ref(`/invites/${code}`)
    const c2 = contacts.map(contact => {
      return { dest: contact.email, sender: auth().currentUser.uid }
    })
    ref2.set(c2).then(() => {
      // Send email
      const { displayName: name, email } = auth().currentUser
      let body = `${i18n.t('share.mail.body', { name, email })}<br><br>
        ${i18n.t('share.mail.code')}<br><br>
        <b>${code}</b><br><br>
        ${i18n.t('share.mail.download', {
          url: 'https://play.google.com/store/apps/details?id=io.matierenoire.breastfeeding&referrer=' + email
        })}`
      Mailer.mail(
        {
          subject: i18n.t('share.mail.subject', { name }),
          recipients: contacts.map(c => c.email),
          body,
          isHTML: true
        },
        (error, event) => {
          // console.warn('Error sending the mail', error, event)
        }
      )
      // After one has sent invites, modify lists to display to user, and remove the possibility to invite same contact twice
      this.setState({ contacts: [], invites })
    })
  }

  removeInvite = async () => {
    const { userToRemove, invites } = this.state
    const ref = database().ref(`/users/${auth().currentUser.uid}/invites`)
    const snapshot = await ref.once('value')
    if (snapshot.val()) {
      ref.set(snapshot.val().filter(invite => invite.email !== userToRemove.email))

      // Clean invite 'table'
      const ref2 = database().ref(`/invites/${userToRemove.code}`)
      const snapshot2 = await ref2.once('value')
      if (snapshot2.val()) {
        /// remove 'linked' if empty
        const inviteList = snapshot2
          .val()
          .filter(invite => !(invite.sender === auth().currentUser.uid && invite.dest === userToRemove.email))
        ref2.set(inviteList)
        if (inviteList.length === 0) {
          database()
            .ref(`/users/${auth().currentUser.uid}/linked`)
            .remove()
        }
      }

      const ref3 = database().ref(`/users/${userToRemove.uid}`)
      ref3.child('linked').remove()

      // Also remove data in list without doing a remote call
      let i = invites.filter(invite => invite.email !== userToRemove.email)

      this.setState({ userToRemove: null, invites: i })
    }
  }

  unlinkGuestToHost = async () => {
    const ref = database().ref(`/users/${auth().currentUser.uid}/linked`)
    const snapshot = await ref.once('value')
    if (snapshot && snapshot.val() !== null) {
      const host = snapshot.val()
      const refHostInvites = database().ref(`/users/${host}/invites`)
      const snapshotInvites = await refHostInvites.once('value')
      if (snapshotInvites && snapshotInvites.val() !== null) {
        const inviteList = snapshotInvites.val().filter(invite => invite.uid !== auth().currentUser.uid)
        refHostInvites.set(inviteList)
        if (inviteList.length === 0) {
          database()
            .ref(`/users/${host}/linked`)
            .remove()
        }
      }
      ref.remove()
      dataStore.userIsGuest = false
      dataStore.targetUid = null
      this.props.navigation.dispatch(resetAction)
    }
  }

  /// render functions

  /**
   * Display a list of matching contacts that current user can invite.
   */
  renderSuggestions = () =>
    this.state.suggestions.map((s, index) => (
      <List.Item
        key={`suggestion-${index}`}
        title={s.displayName}
        description={s.emailAddresses[0].email}
        left={() => this.renderAvatar(s)}
      />
    ))

  /**
   * Display an input where current user can type to search from his contacts list.
   */
  renderInputForm = () => {
    const { invites, contacts, email } = this.state
    if (dataStore.userIsGuest) {
      return (
        <Button mode="contained" icon="exit-to-app" style={{ marginBottom: 16 }} onPress={() => this.setState({ unlinkDialog: true })}>
          {i18n.t('share.leaveButton')}
        </Button>
      )
    } else if (invites.length + contacts.length < 3) {
      const { colors } = this.props.theme
      return (
        <View style={styles.inputContainer}>
          <Avatar.Icon size={48} icon="person-add" />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ flexGrow: 1, backgroundColor: colors.background }}
            value={email}
            placeholder={i18n.t('share.placeholder')}
            onChangeText={this.onChangeText}
            underlineColor={colors.background}
            onSubmitEditing={this.addContactFromTextInput}
          />
        </View>
      )
    }
    return false
  }

  /**
   * If current user or contact has an attached picture, try to display it.
   */
  renderAvatar = contact => {
    if (contact.photoURL) {
      return (
        <List.Icon
          icon={() => (
            <Image
              style={[styles.avatar, { backgroundColor: this.props.theme.colors.primaryDarkColor }]}
              source={{ uri: contact.photoURL }}
            />
          )}
        />
      )
    } else {
      return <List.Icon icon={() => <Avatar.Icon size={48} icon="person" />} />
    }
  }

  /**
   * Render a contact not yet added to the list of invites.
   */
  renderSuggestion = ({ item }) => (
    <List.Item
      style={{ elevation: 1 }}
      title={item.displayName}
      description={item.emailAddresses[0].email}
      left={() => this.renderAvatar(item)}
      onPress={this.addContactFromSuggestions(item)}
    />
  )

  /**
   * Display a warning if one wants to send invites when a malformed email was typed.
   */
  renderInvalidEmailDialog = () => {
    const { palette } = this.props.theme
    return (
      <Portal>
        <Dialog visible={this.state.hasInvalidEmail} onDismiss={() => this.setState({ hasInvalidEmail: false })}>
          <Dialog.Content>
            <Subheading style={{ marginBottom: 8 }}>{i18n.t('share.invalidDialog.title')}</Subheading>
            <Paragraph>{i18n.t('share.invalidDialog.description')}</Paragraph>
            {this.state.contacts
              .filter(c => !c.isValid)
              .map((c, index) => (
                <Paragraph key={index}>{c.email}</Paragraph>
              ))}
          </Dialog.Content>
          <Dialog.Actions style={styles.popupButtonsContainer}>
            <Button color={palette.buttonColor} onPress={() => this.setState({ hasInvalidEmail: false })}>
              {i18n.t('cancel')}
            </Button>
            <Button
              color={palette.buttonColor}
              onPress={() => {
                this.setState({ hasInvalidEmail: false })
                this.sendInvites(this.state.contacts.filter(c => c.isValid))
              }}
            >
              {i18n.t('ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }

  /**
   * Display a confirmation dialog when one wants to remove a contact already linked.
   */
  renderRemoveInviteDialog = () => {
    const { userToRemove } = this.state
    const { palette } = this.props.theme
    return (
      <Portal>
        <Dialog visible={true} onDismiss={() => this.setState({ userToRemove: null })}>
          <Dialog.Content>
            <Subheading style={{ marginBottom: 8 }}>{i18n.t('share.removeDialog.title')}</Subheading>
            {userToRemove.status === SHARE_STATUS.ACTIVE && (
              <Paragraph>{i18n.t('share.removeDialog.description', { email: userToRemove.email })}</Paragraph>
            )}
          </Dialog.Content>
          <Dialog.Actions style={styles.popupButtonsContainer}>
            <Button color={palette.buttonColor} onPress={() => this.setState({ userToRemove: null })}>
              {i18n.t('cancel')}
            </Button>
            <Button color={palette.buttonColor} onPress={() => this.removeInvite()}>
              {i18n.t('ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }

  /**
   * Display a confirmation dialog when a guest wants to leave shared dataSet.
   */
  renderUnlinkDialog = () => {
    const { palette } = this.props.theme
    return (
      <Portal>
        <Dialog visible={this.state.unlinkDialog} onDismiss={() => this.setState({ unlinkDialog: false })}>
          <Dialog.Content>
            <Subheading>{i18n.t('share.leaveDialog.description')}</Subheading>
          </Dialog.Content>
          <Dialog.Actions style={styles.popupButtonsContainer}>
            <Button color={palette.buttonColor} onPress={() => this.setState({ unlinkDialog: false })}>
              {i18n.t('cancel')}
            </Button>
            <Button color={palette.buttonColor} onPress={() => this.unlinkGuestToHost()}>
              {i18n.t('ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }

  renderBanner = () => (
    <Banner
      theme={{ colors: { primary: lightTheme.colors.primary } }}
      accessibilityLabel={i18n.t('a11y.cloud')}
      visible={this.state.showBanner}
      image={() => <IconButton icon="cloud-upload" color={lightTheme.colors.primary} size={24} />}
      actions={[
        {
          label: i18n.t('ok'),
          onPress: () => this.setState({ showBanner: false })
        }
      ]}
    >
      {i18n.t('share.banner')}
    </Banner>
  )

  render = () => {
    const { colors } = this.props.theme
    const { invites, contacts, suggestions, showSnackbar, snackBarMessage, userToRemove } = this.state
    return (
      <View style={{ flex: 1 }}>
        {!dataStore.userIsGuest && this.renderBanner()}
        <ScrollView keyboardShouldPersistTaps={'always'} style={{ padding: 8, backgroundColor: colors.background }}>
          <Caption style={{ marginHorizontal: 12, marginTop: 12 }}>
            {dataStore.userIsGuest ? i18n.t('share.sectionGuest') : i18n.t('share.sectionHost')}
          </Caption>
          <List.Section>
            <List.Item title={auth().currentUser.email} left={() => this.renderAvatar(auth().currentUser)} />
            {invites.map((i, index) => (
              <List.Item
                key={index}
                title={i.email}
                description={i18n.t('share.inviteStatus.' + i.status)}
                left={() => this.renderAvatar(i)}
                right={() => <IconButton color={colors.text} icon="delete" onPress={() => this.setState({ userToRemove: i })} />}
              />
            ))}
            {contacts.map((c, index) => (
              <List.Item
                key={index}
                title={c.displayName ? c.displayName : c.email}
                description={c.displayName ? c.email : c.isValid ? false : i18n.t('share.invalidEmail')}
                left={() => this.renderAvatar(c)}
                right={() => <IconButton color={colors.text} icon="close" onPress={() => this.removeContact(c.email)} />}
              />
            ))}
          </List.Section>
          {this.renderInputForm()}
          <Surface style={styles.suggestions}>
            <FlatList
              keyboardShouldPersistTaps={'always'}
              data={suggestions}
              extraData={suggestions}
              extractData={suggestions.length}
              keyExtractor={(item, index) => `s-${index}`}
              renderItem={this.renderSuggestion}
            />
          </Surface>
        </ScrollView>
        {this.renderInvalidEmailDialog()}
        {userToRemove && this.renderRemoveInviteDialog()}
        {this.renderUnlinkDialog()}
        <Snackbar visible={showSnackbar} onDismiss={() => this.setState({ showSnackbar: false })}>
          {snackBarMessage}
        </Snackbar>
      </View>
    )
  }
}

export default withTheme(ShareScreen)
