import { Component } from 'react'
import { NavigationActions, StackActions } from 'react-navigation'
import QuickActions from 'react-native-quick-actions'

export default class LoadingScreen extends Component {
  static navigationOptions = {
    header: null
  }

  componentDidMount() {
    QuickActions.popInitialAction().then(data => {
      if (data && data.userInfo.url === 'AddEntry') {
        this.props.navigation.dispatch(
          StackActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({ routeName: 'AddEntry' })]
          })
        )
      } else {
        this.props.navigation.dispatch(
          StackActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({ routeName: 'Home' })]
          })
        )
      }
    })
  }

  render = () => null
}
