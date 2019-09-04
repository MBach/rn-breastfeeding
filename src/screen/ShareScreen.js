import React, { Component } from 'react'
import { FlatList, Image, PermissionsAndroid, ScrollView, StyleSheet, View } from 'react-native'
import {
  withTheme,
  Avatar,
  Button,
  IconButton,
  Dialog,
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
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import auth, { firebase } from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import dynamicLinks from '@react-native-firebase/dynamic-links'
import { inject, observer } from 'mobx-react'

import { validateEmail } from '../config'
import i18n from '../locales/i18n'

const styles = StyleSheet.create({
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    margin: 12
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
      headerRight: <IconButton icon="check" color="white" onPress={() => params.handleSend && params.handleSend()} />
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      email: '',
      contacts: [],
      suggestions: [],
      showSnackbar: false,
      snackBarMessage: '',
      hasInvalidEmail: false
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({ handleSend: () => this.aboutToSendInvites() })
  }

  addContactFromTextInput = () => {
    if (this.state.email === '') {
      return
    }
    const isValid = validateEmail(this.state.email)
    const contacts = [...this.state.contacts, { email: this.state.email, isValid }]
    this.setState({ contacts, email: '', suggestions: [] })
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
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS).then(() => {
      if (email.length > 1) {
        Contacts.getContactsMatchingString(email, (err, contacts) => {
          if (err === 'denied') {
            console.log('permission denied')
          } else {
            // Filter contacts without email addresses
            const suggestions = contacts
              .filter(c => c.emailAddresses.length > 0)
              .map(c => {
                return { ...c, photo: c.thumbnailPath }
              })
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

    const { displayName: name, email } = auth().currentUser
    let body = `${i18n.t('share.mail.body', { name, email })}<br><br>
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
        console.warn('error mail', error, event)
      }
    )
  }

  /// render functions

  renderSuggestions = () =>
    this.state.suggestions.map((s, index) => (
      <List.Item
        key={`suggestion-${index}`}
        title={s.displayName}
        description={s.emailAddresses[0].email}
        left={() => this.renderAvatar(s)}
      />
    ))

  renderInputForm = () => {
    const { colors } = this.props.theme
    return (
      <View style={styles.inputContainer}>
        <Avatar.Icon style={{ marginRight: 12 }} size={48} icon="person-add" />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ flexGrow: 1, backgroundColor: colors.background }}
          value={this.state.email}
          placeholder={i18n.t('share.placeholder')}
          onChangeText={this.onChangeText}
          underlineColor={colors.background}
          onSubmitEditing={this.addContactFromTextInput}
        />
      </View>
    )
  }

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

  renderSuggestion = ({ item }) => (
    <List.Item
      style={{ elevation: 1 }}
      title={item.displayName}
      description={item.emailAddresses[0].email}
      left={() => this.renderAvatar(item)}
      onPress={this.addContactFromSuggestions(item)}
    />
  )

  renderSnackBar = () => (
    <Snackbar visible={this.state.showSnackbar} onDismiss={() => this.setState({ showSnackbar: false })}>
      {this.state.snackBarMessage}
    </Snackbar>
  )

  renderInvalidEmailDialog = () => (
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
          <Button onPress={() => this.setState({ hasInvalidEmail: false })}>{i18n.t('cancel')}</Button>
          <Button
            mode="contained"
            style={{ paddingHorizontal: 8 }}
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

  render = () => (
    <>
      <ScrollView keyboardShouldPersistTaps={'always'} style={{ backgroundColor: this.props.theme.colors.background }}>
        <List.Item title={auth().currentUser.email} left={() => this.renderAvatar(auth().currentUser)} />
        {this.state.contacts.map((c, index) => (
          <List.Item
            key={index}
            title={c.displayName ? c.displayName : c.email}
            description={c.displayName ? c.email : c.isValid ? false : i18n.t('share.invalidEmail')}
            left={() => this.renderAvatar(c)}
            right={() => <IconButton color={this.props.theme.colors.text} icon="close" onPress={() => this.removeContact(c.email)} />}
          />
        ))}
        {this.renderInputForm()}
        <Surface style={styles.suggestions}>
          <FlatList
            keyboardShouldPersistTaps={'always'}
            data={this.state.suggestions}
            extraData={this.state.suggestions}
            extractData={this.state.suggestions.length}
            keyExtractor={(item, index) => `s-${index}`}
            renderItem={this.renderSuggestion}
          />
        </Surface>
      </ScrollView>
      {this.renderInvalidEmailDialog()}
      {this.renderSnackBar()}
    </>
  )
}

export default withTheme(ShareScreen)
