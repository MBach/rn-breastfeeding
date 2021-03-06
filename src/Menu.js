import React, { Component } from 'react'
import { StyleSheet, ScrollView } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import { withTheme, Drawer, Title } from 'react-native-paper'
import auth from '@react-native-firebase/auth'
import { inject, observer } from 'mobx-react'
import i18n from './locales/i18n'
import { signIn } from './hooks/SignIn'
import { lightTheme } from './styles'

const styles = StyleSheet.create({
  drawerItems: {
    marginLeft: -4,
    paddingLeft: 16,
    paddingVertical: 2,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24
  }
})

const resetAction = StackActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'Home' })]
})

/**
 * @author Matthieu BACHELIER
 * @since 2019-07
 * @version 1.0
 */
@inject('dataStore')
@observer
class Menu extends Component {
  changeTheme = theme => () => {
    dataStore.theme = theme
    this.props.screenProps.updateTheme(theme)
    this.props.navigation.closeDrawer()
    this.props.navigation.dispatch(resetAction)
  }

  navigate = route => {
    this.props.navigation.closeDrawer()
    this.props.navigation.navigate(route)
  }

  checkIfUserIsConnected = () => {
    if (auth().currentUser && !auth().currentUser.isAnonymous) {
      this.navigate('Share')
    } else {
      this.props.navigation.closeDrawer()
      setTimeout(() => {
        signIn(() => this.navigate('Share'))
      }, 700)
    }
  }

  render() {
    const { navigation } = this.props
    const { routes } = navigation.state
    let route = routes[routes.length - 1].routes
    let currentRoute
    if (route.length > 0) {
      currentRoute = route[route.length - 1].routeName
    }
    const { colors } = this.props.theme
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <Drawer.Section>
          <Title style={{ paddingHorizontal: 12, paddingVertical: 16, color: lightTheme.colors.primary }}>
            {i18n.t('navigation.title')}
          </Title>
        </Drawer.Section>
        <Drawer.Section>
          <Drawer.Item
            theme={{ colors: { primary: lightTheme.colors.primary } }}
            icon="home"
            label={i18n.t('navigation.home')}
            active={currentRoute === 'Home'}
            style={styles.drawerItems}
            onPress={() => this.navigate('Home')}
          />
          <Drawer.Item
            theme={{ colors: { primary: lightTheme.colors.primary } }}
            icon="plus"
            label={i18n.t('navigation.addEntry')}
            active={currentRoute === 'AddEntry'}
            style={styles.drawerItems}
            onPress={() => this.navigate('AddEntry')}
          />
        </Drawer.Section>
        <Drawer.Section title={i18n.t('menu.share')}>
          <Drawer.Item
            theme={{ colors: { primary: lightTheme.colors.primary } }}
            icon="share"
            label={i18n.t('menu.selectContact')}
            style={styles.drawerItems}
            active={currentRoute === 'Share'}
            onPress={this.checkIfUserIsConnected}
          />
          <Drawer.Item
            theme={{ colors: { primary: lightTheme.colors.primary } }}
            icon="lock-open"
            label={i18n.t('menu.code')}
            style={styles.drawerItems}
            active={currentRoute === 'Code'}
            onPress={() => this.navigate('Code')}
          />
          <Drawer.Item
            theme={{ colors: { primary: lightTheme.colors.primary } }}
            icon="message-alert-outline"
            label={i18n.t('menu.feedback')}
            style={styles.drawerItems}
            active={currentRoute === 'Feedback'}
            onPress={() => this.navigate('Feedback')}
          />
        </Drawer.Section>
        <Drawer.Section title={i18n.t('menu.title')}>
          <Drawer.Item
            theme={{ colors: { primary: lightTheme.colors.primary } }}
            icon="white-balance-sunny"
            label={i18n.t('menu.day')}
            active={dataStore.theme === 'day'}
            style={styles.drawerItems}
            onPress={this.changeTheme('day')}
          />
          <Drawer.Item
            theme={{ colors: { primary: lightTheme.colors.primary } }}
            icon="brightness-3"
            label={i18n.t('menu.night')}
            active={dataStore.theme === 'night'}
            style={styles.drawerItems}
            onPress={this.changeTheme('night')}
          />
        </Drawer.Section>
      </ScrollView>
    )
  }
}

export default withTheme(Menu)
