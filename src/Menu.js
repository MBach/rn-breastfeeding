import React, { Component } from 'react'
import { View } from 'react-native'
import { withTheme, Drawer, Title } from 'react-native-paper'
import { inject, observer } from 'mobx-react'
import styles from './styles'
import i18n from './locales/i18n'

@inject('dataStore')
@observer
class Menu extends Component {
  changeTheme = theme => {
    dataStore.theme = theme
    this.props.screenProps.updateTheme(theme)
    this.props.navigation.closeDrawer()
  }

  render() {
    const { navigation } = this.props
    const { routes } = navigation.state
    let route = routes[routes.length - 1].routes
    let currentRoute
    if (route.length > 0) {
      currentRoute = route[route.length - 1].routeName
    }
    const { colors } = this.props.theme

    return (
      <View style={{ flex: 1, backgroundColor: colors.background, color: colors.primaryTextColor }}>
        <Drawer.Section>
          <Title style={{ paddingLeft: 12, paddingVertical: 16, color: colors.primary }}>{i18n.t('navigation.title')}</Title>
        </Drawer.Section>
        <Drawer.Section>
          <Drawer.Item
            icon="home"
            label={i18n.t('navigation.home')}
            active={currentRoute === 'Home'}
            style={styles.drawerItems}
            onPress={() => {
              navigation.navigate('Home')
              navigation.closeDrawer()
            }}
          />
          <Drawer.Item
            icon="add"
            label={i18n.t('navigation.addEntry')}
            active={currentRoute === 'AddEntry'}
            style={styles.drawerItems}
            onPress={() => {
              navigation.navigate('AddEntry')
              navigation.closeDrawer()
            }}
          />
        </Drawer.Section>
        <Drawer.Section title={i18n.t('menu.share')}>
          <Drawer.Item icon="share" label={i18n.t('menu.selectContact')} style={styles.drawerItems} onPress={() => {}} />
        </Drawer.Section>
        <Drawer.Section title={i18n.t('menu.title')}>
          <Drawer.Item icon="wb-sunny" label={i18n.t('menu.day')} style={styles.drawerItems} onPress={() => this.changeTheme('day')} />
          <Drawer.Item
            icon="brightness-3"
            label={i18n.t('menu.night')}
            style={styles.drawerItems}
            onPress={() => this.changeTheme('night')}
          />
        </Drawer.Section>
      </View>
    )
  }
}

export default withTheme(Menu)
