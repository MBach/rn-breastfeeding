import React, { Component } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'
import { withTheme, Drawer, Title } from 'react-native-paper'
import { GoogleSignin } from 'react-native-google-signin'
import auth from '@react-native-firebase/auth'
import { inject, observer } from 'mobx-react'
import i18n from './locales/i18n'
import { signIn } from './hooks/SignIn'

const styles = StyleSheet.create({
  drawerItems: {
    marginLeft: -4,
    paddingLeft: 16,
    paddingVertical: 2,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24
  }
})

/**
 * @author Matthieu BACHELIER
 * @since 2019-07
 * @version 1.0
 */
@inject('dataStore')
@observer
class Menu extends Component {
  async componentDidMount() {
    await GoogleSignin.configure({ webClientId: '954958868925-kdbiotink1d0un16n5j0c81pj5ksbbo0.apps.googleusercontent.com' })
    /*GoogleSignin.signInSilently()
      .then(res => {
        if (res) {
          console.warn('signInSilently', res.idToken)
          auth()
            .signInWithCustomToken(res.idToken)
            .then(res2 => {
              console.warn('res2', res2)
            })
          console.warn('signInSilently', auth().currentUser)
        }
      })
      .catch(err => {
        // No previous attempt found, about to sign in anonymously
        if (err.userInfo === null) {
          auth()
            .signInAnonymously()
            .then(res => {
              console.warn('signInAnonymously', res)
            })
        }
      })*/
    console.warn('Menu', auth().currentUser)

    const url = await Linking.getInitialURL()
    // Open the App from the notification area
    if (url === 'rnbreastfeeding://rnbreastfeeding/chrono') {
      this.goTo('AddEntry')
    } else {
      // Open the App from the QuickAction
      const data = await QuickActions.popInitialAction()
      data && data.userInfo.url === 'AddEntry' ? this.goTo('AddEntry') : this.goTo('Home')
    }
  }

  goTo = routeName => {
    this.props.navigation.dispatch(
      StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName })]
      })
    )
  }

  changeTheme = theme => () => {
    dataStore.theme = theme
    this.props.screenProps.updateTheme(theme)
    this.props.navigation.closeDrawer()
  }

  navigate = route => () => {
    this.props.navigation.closeDrawer()
    this.props.navigation.navigate(route)
  }

  checkIfUserIsConnected = () => {
    if (auth().currentUser.isAnonymous) {
      this.props.navigation.closeDrawer()
      setTimeout(signIn, 700)
    } else {
      this.navigate('Share')
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
      <View style={{ flex: 1, backgroundColor: colors.background, color: colors.primaryTextColor }}>
        <Drawer.Section>
          <Title style={{ paddingLeft: 12, paddingVertical: 16, color: colors.primary }}>{i18n.t('navigation.title')}</Title>
        </Drawer.Section>
        <Drawer.Section>
          <Drawer.Item
            icon="home"
            label={i18n.t('navigation.home')}
            active={currentRoute === 'Home'}
            style={styles.drawerItems}
            onPress={this.navigate('Home')}
          />
          <Drawer.Item
            icon="add"
            label={i18n.t('navigation.addEntry')}
            active={currentRoute === 'AddEntry'}
            style={styles.drawerItems}
            onPress={this.navigate('AddEntry')}
          />
        </Drawer.Section>
        <Drawer.Section title={i18n.t('menu.share')}>
          <Drawer.Item
            icon="share"
            label={i18n.t('menu.selectContact')}
            style={styles.drawerItems}
            active={currentRoute === 'Share'}
            onPress={this.checkIfUserIsConnected}
          />
          <Drawer.Item
            icon="feedback"
            label={i18n.t('menu.feedback')}
            style={styles.drawerItems}
            active={currentRoute === 'Feedback'}
            onPress={this.navigate('Feedback')}
          />
        </Drawer.Section>
        <Drawer.Section title={i18n.t('menu.title')}>
          <Drawer.Item
            icon="wb-sunny"
            label={i18n.t('menu.day')}
            active={dataStore.theme === 'day'}
            style={styles.drawerItems}
            onPress={this.changeTheme('day')}
          />
          <Drawer.Item
            icon="brightness-3"
            label={i18n.t('menu.night')}
            active={dataStore.theme === 'night'}
            style={styles.drawerItems}
            onPress={this.changeTheme('night')}
          />
        </Drawer.Section>
      </View>
    )
  }
}

export default withTheme(Menu)
