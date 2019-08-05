import React, { Component } from 'react'
import { FlatList, Image, PermissionsAndroid, ScrollView, View } from 'react-native'
import { withTheme, Avatar, IconButton, List, Snackbar, TextInput } from 'react-native-paper'
import Contacts from 'react-native-contacts'
import Mailer from 'react-native-mail'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import auth, { firebase } from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import { inject, observer } from 'mobx-react'
import i18n from '../locales/i18n'

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
      newContact: '',
      contacts: [],
      suggestions: [],
      showSnackbar: false,
      snackBarMessage: ''
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({ handleSend: () => this.sendTo() })
  }

  addContactFromTextInput = () => {
    let contacts = [...this.state.contacts, { email: this.state.email }]
    this.setState({ contacts, email: '' })
  }

  addContactFromSuggestions = item => () => {
    const { contacts } = this.state
    if (contacts.some(c => c.email === item.emailAddresses[0].email)) {
      this.setState({ showSnackbar: true, snackBarMessage: i18n.t('share.contactAlreadyAdded') })
    } else {
      let c = [
        ...contacts,
        { displayName: item.displayName, email: item.emailAddresses[0].email, photo: item.thumbnailPath, removable: true }
      ]
      this.setState({ contacts: c, email: '', suggestions: [] })
    }
  }

  removeContact = email => {
    const contacts = this.state.contacts.filter(c => c.email !== email)
    this.setState({ contacts })
  }

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

  sendTo = async () => {
    if (this.state.contacts.length < 1) {
      this.props.navigation.pop()
      return
    }
    const { name, email } = dataStore.user
    let shareLink = 'rnbreastfeeding://rnbreastfeeding/home?shareLink=1234'
    let body = `${i18n.t('share.mail.body', { name, email })}<br><br>
      ${i18n.t('share.mail.button', { shareLink })}<br><br>
      ${i18n.t('share.mail.download', { url: 'https://play.google.com/store/apps/details?id=io.matierenoire.breastfeeding' })}`
    Mailer.mail(
      {
        subject: i18n.t('share.mail.subject', { name }),
        recipients: this.state.contacts.map(c => c.email),
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

  renderNewContactForm = () => {
    const { colors } = this.props.theme
    return (
      <View style={{ display: 'flex', flexDirection: 'row', margin: 12 }}>
        <Avatar.Icon style={{ marginRight: 12 }} size={48} icon="person-add" />
        <TextInput
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
    if (contact.photo) {
      return (
        <List.Icon
          icon={() => (
            <Image
              style={{ width: 48, height: 48, backgroundColor: this.props.theme.colors.primaryDarkColor, borderRadius: 24 }}
              source={{ uri: contact.photo }}
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

  render = () => (
    <>
      <ScrollView style={{ backgroundColor: this.props.theme.colors.background }}>
        <List.Item title={dataStore.user.email} left={() => this.renderAvatar(dataStore.user)} />
        {this.state.contacts.map((c, index) => (
          <List.Item
            key={index}
            title={c.displayName ? c.displayName : c.email}
            description={c.displayName ? c.email : false}
            left={() => this.renderAvatar(c)}
            right={() => <IconButton color={this.props.theme.colors.text} icon="close" onPress={() => this.removeContact(c.email)} />}
          />
        ))}
        {this.renderNewContactForm()}
        <FlatList
          data={this.state.suggestions}
          extractData={this.state.suggestions.length}
          keyExtractor={(item, index) => `s-${index}`}
          renderItem={this.renderSuggestion}
        />
      </ScrollView>
      {this.renderSnackBar()}
    </>
  )
}

export default withTheme(ShareScreen)
