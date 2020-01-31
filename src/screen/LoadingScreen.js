import React, { Component } from 'react'
import { Linking, View } from 'react-native'
import { withTheme, ActivityIndicator, Appbar } from 'react-native-paper'
import QuickActions from 'react-native-quick-actions'
import queryString from 'query-string'

/**
 * This class is used to dispatch route when one is :
 * - launching the App from the notification area, if the timer is running in background
 * - launching the App from the Quick Action area (longpress), from the "Desktop"
 * - otherwise, it just redirects to the Home
 *
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 2.0
 */
class LoadingScreen extends Component {
  static navigationOptions = {
    headerShown: false
  }

  async componentDidMount() {
    const { navigation } = this.props
    const initialURL = await Linking.getInitialURL()
    if (initialURL && initialURL.startsWith('rnbreastfeeding://rnbreastfeeding/chrono')) {
      const { timerId, timer } = queryString.parse(initialURL.substring(40), { ignoreQueryPrefix: true, parseNumbers: true })
      navigation.navigate('AddEntry', { timerId, timer })
    } else {
      const data = await QuickActions.popInitialAction()
      data && data.userInfo.url === 'AddEntry' ? navigation.navigate('AddEntry') : navigation.navigate('Home')
    }
  }

  render = () => (
    <View style={{ flex: 1, backgroundColor: this.props.theme.colors.background }}>
      <Appbar.Header>
        <Appbar.Content title={''} />
      </Appbar.Header>
      <View style={{ flex: 1, justifyContent: 'center' }}></View>
    </View>
  )
}

export default withTheme(LoadingScreen)
