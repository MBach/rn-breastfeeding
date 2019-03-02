import React, { Component } from 'react'
import { Platform, StatusBar } from 'react-native'
import { createStackNavigator, createAppContainer } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'
import { Provider as PaperProvider, Portal } from 'react-native-paper'
import { Provider } from 'mobx-react'
import moment from 'moment'
import SunCalc from 'suncalc'

import AddEntryScreen from './screen/AddEntryScreen'
import HomeScreen from './screen/HomeScreen'
import LoadingScreen from './screen/LoadingScreen'
import stores from './stores'
import { darkTheme, lightTheme } from './styles'
import { pos } from './config'

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

export default class App extends Component {
  constructor(props) {
    super(props)
    const times = SunCalc.getTimes(new Date(), pos.lat, pos.lng)
    const m = moment()
    this.state = {
      theme: m.isAfter(times.dawn) && m.isBefore(times.dusk) ? lightTheme : darkTheme
    }
  }
  componentDidMount() {
    StatusBar.setBarStyle('light-content')
    Platform.OS === 'android' && StatusBar.setBackgroundColor(this.state.theme.palette.primaryDarkColor)
  }

  render = () => (
    <Provider {...stores}>
      <PaperProvider theme={this.state.theme}>
        <Portal.Host>
          <AppContainer uriPrefix={uriPrefix} screenProps={{ ...this.state.theme.colors }} />
        </Portal.Host>
      </PaperProvider>
    </Provider>
  )
}
