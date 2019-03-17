import React, { Component } from 'react'
import { Platform, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { createStackNavigator, createAppContainer } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'
import { Provider as PaperProvider, Portal } from 'react-native-paper'
import { Provider } from 'mobx-react'
import { create } from 'mobx-persist'
import moment from 'moment'
import SunCalc from 'suncalc'

import AddEntryScreen from './screen/AddEntryScreen'
import HomeScreen from './screen/HomeScreen'
import LoadingScreen from './screen/LoadingScreen'
import stores from './stores'
import { darkTheme, lightTheme } from './styles'

const uriPrefix = 'rnbreastfeeding://rnbreastfeeding'

// Add an App shortcut with a long press
QuickActions.setShortcutItems([
  {
    type: 'Chrono',
    title: 'Ajouter une saisie',
    icon: 'ic_timer_48dp',
    userInfo: {
      url: 'AddEntry'
    }
  }
])

const Stack = createStackNavigator(
  {
    Loading: { screen: LoadingScreen, path: '/' },
    Home: { screen: HomeScreen, path: '/home' },
    AddEntry: { screen: AddEntryScreen, path: '/chrono' }
  },
  {
    initialRouteName: 'Loading',
    defaultNavigationOptions: {
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold'
      }
    }
  }
)

const AppContainer = createAppContainer(Stack)

const getTheme = (key, dataStore) => {
  if (key === 'day') {
    return lightTheme
  } else if (key === 'night') {
    return darkTheme
  } else {
    const m = moment()
    const times = SunCalc.getTimes(m.toDate(), dataStore.coords.latitude, dataStore.coords.longitude)
    if (m.isAfter(times.dawn) && m.isBefore(times.dusk)) {
      return lightTheme
    } else {
      return darkTheme
    }
  }
}

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      theme: null
    }
  }

  updateTheme = key => {
    const theme = getTheme(key, stores.dataStore)
    this.setState({ theme }, () => Platform.OS === 'android' && StatusBar.setBackgroundColor(theme.palette.primaryDarkColor))
  }

  async componentDidMount() {
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
