import React, { useEffect, useState } from 'react'
import { Dimensions, I18nManager, Platform, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { createAppContainer, createDrawerNavigator, createStackNavigator, createSwitchNavigator } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'
import { Provider as PaperProvider, Portal } from 'react-native-paper'
import auth, { firebase } from '@react-native-firebase/auth'
import { GoogleSignin } from 'react-native-google-signin'

import { Provider } from 'mobx-react'
import { create } from 'mobx-persist'
import i18n, { loadLocale } from './locales/i18n'

import { AddEntryScreen, CodeScreen, FeedbackScreen, HomeScreen, LoadingScreen, ShareScreen } from './screen'
import stores from './stores'
import { darkTheme, lightTheme } from './styles'
import Menu from './Menu'

const { width, height } = Dimensions.get('screen')
const uriPrefix = 'rnbreastfeeding://rnbreastfeeding'

const RootStack = createStackNavigator(
  {
    Home: { screen: HomeScreen, path: '/home' },
    AddEntry: { screen: AddEntryScreen, path: '/chrono' },
    Share: { screen: ShareScreen, path: '/share' },
    Code: { screen: CodeScreen, path: '/code' },
    Feedback: { screen: FeedbackScreen, path: '/feedback' }
  },
  {
    defaultNavigationOptions: {
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold'
      }
    }
  }
)

const DrawerNavigator = createDrawerNavigator(
  {
    RootStack: RootStack
  },
  {
    drawerPosition: I18nManager.isRTL ? 'right' : 'left',
    drawerWidth: Math.min(width, height) * 0.8,
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    contentComponent: Menu
  }
)

const SwitchNavigator = createSwitchNavigator(
  {
    Loading: LoadingScreen,
    Drawer: DrawerNavigator
  },
  {
    initialRouteName: 'Loading'
  }
)

const AppContainer = createAppContainer(SwitchNavigator)

/**
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 2.0
 */
export default function App() {
  const [initilizing, setInitilizing] = useState(true)
  const [theme, setTheme] = useState(null)

  useEffect(() => {
    init()
  }, [theme])

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged)
    GoogleSignin.configure({ webClientId: '954958868925-kdbiotink1d0un16n5j0c81pj5ksbbo0.apps.googleusercontent.com' })
    GoogleSignin.signInSilently()
      .then(res => {
        if (res) {
          const credential = firebase.auth.GoogleAuthProvider.credential(res.idToken, res.accessToken)
          auth()
            .signInWithCredential(credential)
            .then(res2 => {
              console.log('signInSilently', res2)
            })
            .catch(err => {
              console.log('cannot sign-in with credential', err)
            })
        }
      })
      .catch(err => {
        // No previous attempt found, don't sign-in anonymously
      })
    return subscriber
  }, [])

  const onAuthStateChanged = user => {
    if (initilizing) setInitilizing(false)
  }

  const getTheme = key => {
    if (key === 'day') {
      return lightTheme
    } else {
      return darkTheme
    }
  }

  const updateTheme = key => {
    const theme = getTheme(key)
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(theme.palette.primaryDarkColor)
    setTheme(theme)
  }

  const init = async () => {
    await loadLocale()

    // Add an App shortcut with a long press
    QuickActions.setShortcutItems([
      {
        type: 'Chrono',
        title: i18n.t('navigation.addEntry'),
        icon: 'ic_timer_48dp',
        userInfo: {
          url: 'AddEntry'
        }
      }
    ])
    const hydrate = create({ storage: AsyncStorage, jsonify: true })
    const res = await hydrate('dataStore', dataStore)
    if (res) {
      dataStore.hydrateComplete()
      updateTheme(res.theme)
      StatusBar.setBarStyle('light-content')
    }
  }

  if (theme) {
    return (
      <Provider {...stores}>
        <PaperProvider theme={theme}>
          <Portal.Host>
            <AppContainer uriPrefix={uriPrefix} screenProps={{ ...theme.colors, updateTheme: updateTheme }} />
          </Portal.Host>
        </PaperProvider>
      </Provider>
    )
  } else {
    return false
  }
}
