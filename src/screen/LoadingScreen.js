import { Component } from 'react'
import { Linking } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'

/**
 * This class is used to dispatch route when one is :
 * - launching the App from the notification area, if the timer is running in background
 * - launching the App from the Quick Action area (longpress), from the "Desktop"
 * - otherwise, it just redirects to the Home
 *
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 1.0
 */
export default class LoadingScreen extends Component {
  static navigationOptions = {
    header: null
  }

  goTo = routeName => {
    this.props.navigation.dispatch(
      StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName })]
      })
    )
  }

  async componentDidMount() {
    const url = await Linking.getInitialURL()
    if (url === 'rnbreastfeeding://rnbreastfeeding/chrono') {
      this.goTo('AddEntry')
    } else {
      const data = await QuickActions.popInitialAction()
      //data && data.userInfo.url === 'AddEntry' ? this.goTo('AddEntry') : this.goTo('Home')
    }
  }

  render = () => null
}
