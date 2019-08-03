import React, { Component } from 'react'
import { FlatList, Image, PermissionsAndroid, ScrollView, View } from 'react-native'
import Contacts from 'react-native-contacts'
import { withTheme, Avatar, IconButton, List, TextInput } from 'react-native-paper'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import auth, { firebase } from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import { inject, observer } from 'mobx-react'
import i18n from '../locales/i18n'
import styles from '../styles'

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
  static navigationOptions = ({ screenProps }) => {
    return {
      title: i18n.t('navigation.contact'),
      headerStyle: { backgroundColor: screenProps.primary },
      headerRight: <IconButton icon="check" color="white" onPress={() => params.handleSave && params.handleSave()} />
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      newContact: '',
      contacts: [{ ...dataStore.user }],
      suggestions: []
    }
  }

  addContactFromTextInput = () => {
    let contacts = [...this.state.contacts, { email: this.state.email }]
    this.setState({ contacts, email: '' })
  }

  addContactFromSuggestions = item => () => {
    let contacts = [
      ...this.state.contacts,
      { displayName: item.displayName, email: item.emailAddresses[0].email, photo: item.thumbnailPath, removable: true }
    ]
    this.setState({ contacts, email: '', suggestions: [] })
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

  render = () => {
    const { colors } = this.props.theme
    return (
      <ScrollView style={{ backgroundColor: colors.background }}>
        {this.state.contacts.map((c, index) => (
          <List.Item
            key={index}
            title={c.displayName ? c.displayName : c.email}
            description={c.displayName ? c.email : false}
            left={() => this.renderAvatar(c)}
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
    )
  }
}

export default withTheme(ShareScreen)
