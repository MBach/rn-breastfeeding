import React, { Component } from 'react'
import { Platform, StatusBar } from 'react-native'
import { createStackNavigator, createAppContainer } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'
import { Provider as PaperProvider, Portal } from 'react-native-paper'
import { Provider } from 'mobx-react'
import AddEntryScreen from './screen/AddEntryScreen'
import HomeScreen from './screen/HomeScreen'
import LoadingScreen from './screen/LoadingScreen'
import stores from './stores'
import { palette, theme } from './styles'

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

const AppNavigator = createAppContainer(
  createStackNavigator(
    {
      Loading: LoadingScreen,
      Home: HomeScreen,
      AddEntry: AddEntryScreen
    },
    {
      initialRouteName: 'Loading',
      defaultNavigationOptions: {
        headerStyle: {
          backgroundColor: palette.primaryColor
        },
        headerTintColor: palette.primaryTextColor,
        headerTitleStyle: {
          fontWeight: 'bold'
        }
      }
    }
  )
)

export default class App extends Component {
  componentDidMount() {
    StatusBar.setBarStyle('light-content')
    Platform.OS === 'android' && StatusBar.setBackgroundColor(palette.primaryDarkColor)
  }

  render = () => (
    <Provider {...stores}>
      <PaperProvider theme={theme}>
        <Portal.Host>
          <AppNavigator />
        </Portal.Host>
      </PaperProvider>
    </Provider>
  )
}
