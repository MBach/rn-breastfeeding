import React, { Component } from 'react'
import { Platform, StatusBar } from 'react-native'
import { createStackNavigator, createAppContainer } from 'react-navigation'
import { Provider as PaperProvider, Portal } from 'react-native-paper'
import { Provider } from 'mobx-react'
import AddEntryScreen from './screen/AddEntryScreen'
import HomeScreen from './screen/HomeScreen'
import stores from './stores'
import { palette, theme } from './styles'

const AppNavigator = createAppContainer(
  createStackNavigator(
    {
      Home: HomeScreen,
      AddEntry: AddEntryScreen
    },
    {
      initialRouteName: 'Home',
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
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(palette.primaryDarkColor)
    }
  }

  render() {
    return (
      <PaperProvider theme={theme}>
        <Portal.Host>
          <Provider {...stores}>
            <AppNavigator />
          </Provider>
        </Portal.Host>
      </PaperProvider>
    )
  }
}
