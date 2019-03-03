import { Component } from 'react'
import { Linking } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'

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
      data && data.userInfo.url === 'AddEntry' ? this.goTo('AddEntry') : this.goTo('Home')
    }
  }

  render = () => null
}
