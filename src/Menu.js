import React, { Component } from 'react'
import { PermissionsAndroid, Platform, View } from 'react-native'
import { withTheme, Drawer, Title } from 'react-native-paper'
import RNAndroidLocationEnabler from 'react-native-android-location-enabler'
import { inject, observer } from 'mobx-react'
import styles from './styles'
import i18n from './locales/i18n'

@inject('dataStore')
@observer
class Menu extends Component {
  state = {
    active: 'home'
  }

  changeTheme = theme => {
    dataStore.theme = theme
    this.props.screenProps.updateTheme(theme)
    this.props.navigation.closeDrawer()
  }

  askLocation = async () => {
    if (Platform.OS !== 'android') {
      return
    }
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    if (res === 'granted' || res === true) {
      try {
        const res2 = await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 })
        if (res2 === 'already-enabled' || res2 === 'enabled') {
          navigator.geolocation.getCurrentPosition(
            position => {
              dataStore.coords = { latitude: position.coords.latitude, longitude: position.coords.longitude }
              this.changeTheme('auto')
            },
            error => console.log('error', error),
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 1000 }
          )
        }
      } catch (error) {
        console.log('error', error)
      }
    } else {
      // res === never_ask_again
    }
  }

  render() {
    return (
      <View>
        <Title style={{ paddingLeft: 12, paddingVertical: 16 }}>{i18n.t('navigation.title')}</Title>
        <Drawer.Section>
          <Drawer.Item
            icon="home"
            label={i18n.t('navigation.home')}
            active={this.state.active === 'home'}
            style={styles.drawerItems}
            onPress={() => {
              this.props.navigation.navigate('Home')
              this.setState({ active: 'home' })
              this.props.navigation.closeDrawer()
            }}
          />
          <Drawer.Item
            icon="add"
            label={i18n.t('navigation.addEntry')}
            active={this.state.active === 'addEntry'}
            style={styles.drawerItems}
            onPress={() => {
              this.props.navigation.navigate('AddEntry')
              this.setState({ active: 'addEntry' })
              this.props.navigation.closeDrawer()
            }}
          />
        </Drawer.Section>
        <Drawer.Section title={i18n.t('home.mode.title')}>
          <Drawer.Item icon="wb-sunny" label={i18n.t('home.mode.day')} style={styles.drawerItems} onPress={() => this.changeTheme('day')} />
          <Drawer.Item
            icon="brightness-3"
            label={i18n.t('home.mode.night')}
            style={styles.drawerItems}
            onPress={() => this.changeTheme('night')}
          />
          <Drawer.Item icon="autorenew" label={i18n.t('home.mode.auto')} style={styles.drawerItems} onPress={this.askLocation} />
        </Drawer.Section>
      </View>
    )
  }
}

export default withTheme(Menu)
