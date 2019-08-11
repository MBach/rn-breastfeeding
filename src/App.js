import React, { useEffect, useState } from 'react'
import { Platform, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { createStackNavigator, createDrawerNavigator, createAppContainer } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'
import { Provider as PaperProvider, Portal } from 'react-native-paper'
import auth from '@react-native-firebase/auth'
import { GoogleSignin } from 'react-native-google-signin'

import { Provider } from 'mobx-react'
import { create } from 'mobx-persist'
import i18n, { loadLocale } from './locales/i18n'

import { AddEntryScreen, FeedbackScreen, HomeScreen, ShareScreen } from './screen'
import stores from './stores'
import { darkTheme, lightTheme } from './styles'
import Menu from './Menu'

const uriPrefix = 'rnbreastfeeding://rnbreastfeeding'

const RootStack = createStackNavigator(
  {
    Home: { screen: HomeScreen, path: '/home' },
    AddEntry: { screen: AddEntryScreen, path: '/chrono' },
    Share: { screen: ShareScreen, path: '/share' },
    Feedback: { screen: FeedbackScreen, path: '/feedback' }
  },
  {
    initialRouteName: 'Home',
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
    contentComponent: Menu,
    contentOptions: {
      style: {
        backgroundColor: 'green'
      }
    }
  }
)

const AppContainer = createAppContainer(DrawerNavigator)

/**
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 2.0
 */
export default function App() {
  const [initilizing, setInitilizing] = useState(true)
  const [user, setUser] = useState()
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
          const credential = auth().GoogleAuthProvider.credential(res.idToken, res.accessToken)
          auth()
            .signInWithCredential(credential)
            .then(res2 => {
              console.log('signInSilently', res2)
            })
            .catch(err => {
              console.warn('cannot sign-in with credential', err)
            })
        }
      })
      .catch(err => {
        // No previous attempt found, about to sign in anonymously
        if (err.userInfo === null) {
          auth()
            .signInAnonymously()
            .then(res => {
              console.log('signInAnonymously', res)
            })
            .catch(err => {
              console.warn('cannot sign-in anonymously', err)
            })
        }
      })
    return subscriber
  }, [])

  const onAuthStateChanged = user => {
    console.warn('user', user)
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
