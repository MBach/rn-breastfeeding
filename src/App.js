import React, { Component } from 'react'
import { Platform, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { createStackNavigator, createDrawerNavigator, createAppContainer } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'
import { Provider as PaperProvider, Portal } from 'react-native-paper'

import { Provider } from 'mobx-react'
import { create } from 'mobx-persist'
import i18n, { loadLocale } from './locales/i18n'

import AddEntryScreen from './screen/AddEntryScreen'
import HomeScreen from './screen/HomeScreen'
import ShareScreen from './screen/ShareScreen'
import stores from './stores'
import { darkTheme, lightTheme } from './styles'
import Menu from './Menu'

const uriPrefix = 'rnbreastfeeding://rnbreastfeeding'

const RootStack = createStackNavigator(
  {
    Home: { screen: HomeScreen, path: '/home' },
    AddEntry: { screen: AddEntryScreen, path: '/chrono' },
    Share: { screen: ShareScreen, path: '/share' }
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

const getTheme = key => {
  if (key === 'day') {
    return lightTheme
  } else {
    return darkTheme
  }
}

/**
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 2.0
 */
export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      theme: null
    }
  }

  updateTheme = key => {
    const theme = getTheme(key)
    this.setState({ theme }, () => Platform.OS === 'android' && StatusBar.setBackgroundColor(theme.palette.primaryDarkColor))
  }

  async componentDidMount() {
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
      this.updateTheme(res.theme)
      StatusBar.setBarStyle('light-content')
    }
  }

  render = () => {
    const { theme } = this.state
    if (theme) {
      return (
        <Provider {...stores}>
          <PaperProvider theme={theme}>
            <Portal.Host>
              <AppContainer uriPrefix={uriPrefix} screenProps={{ ...theme.colors, updateTheme: this.updateTheme }} />
            </Portal.Host>
          </PaperProvider>
        </Provider>
      )
    } else {
      return false
    }
  }
}
