import React, { Component } from 'react'
import { Animated, AppState, Easing, FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  withTheme,
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  Chip,
  Dialog,
  FAB,
  List,
  Portal,
  Snackbar,
  TouchableRipple,
  Subheading,
  Paragraph
} from 'react-native-paper'
import auth from '@react-native-firebase/auth'
import { inject, observer } from 'mobx-react'
import moment from 'moment'

import { isNotRunning } from '../config'
import i18n from '../locales/i18n'

const styles = StyleSheet.create({
  cardLastEntry: {
    margin: 8
  },
  fab: {
    margin: 16,
    alignSelf: 'center'
  },
  absFab: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20
  },
  list: {
    flex: 1,
    borderBottomWidth: 1
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  chipMargins: {
    marginRight: 8,
    marginTop: 8
  },
  chipText: {
    fontSize: 13
  },
  containerDialog: {
    maxHeight: '75%'
  },
  popupButtonsContainer: {
    flexDirection: 'row',
    minHeight: 30,
    justifyContent: 'space-between',
    marginHorizontal: 20
  }
})

/**
 * This class is the Home Screen.
 * It contains the last entry on top and a FlatList of events grouped by day. One can create an entry by clicking on the + button at the bottom.
 *
 * @author Matthieu BACHELIER
 * @since 2019-02
 * @version 2.0
 */
@inject('dataStore')
@observer
class HomeScreen extends Component {
  static navigationOptions = {
    headerShown: false
  }

  constructor(props) {
    super(props)
    this.state = {
      fetching: true,
      groupedRecords: [],
      appState: AppState.currentState,
      currentGroup: null,
      newGroup: null,
      editGroupDialog: false,
      editLastEntry: false,
      opacity: new Animated.Value(1),
      showSnackbar: false,
      snackBarMessage: ''
    }
    this.autoRefresh = null
  }

  async componentDidMount() {
    AppState.addEventListener('change', this.refreshLastEntry)
    if (!isNotRunning(dataStore.timers)) {
      this.createAnimation()
    }

    this.autoRefresh = setInterval(() => {
      this.forceUpdate()
    }, 1000 * 60)

    // Used when one has successfully linked his account from another one by using a code
    const { params } = this.props.navigation.state
    if (params && params.accountLinked) {
      this.setState({ showSnackbar: true, snackBarMessage: i18n.t('home.accountLinked') })
    }
    dataStore
      .isAccountLinked()
      .then(res => {
        if (res) {
          dataStore.fetchCloudData().then(() => {
            this.setState({ fetching: false, groupedRecords: dataStore.groupedRecords })
          })
        } else {
          this.setState({ fetching: false, groupedRecords: dataStore.groupedRecords })
        }
      })
      .catch(err => this.setState({ fetching: false, groupedRecords: dataStore.groupedRecords }))

    if (auth().currentUser && auth().currentUser.photoURL) {
      this.props.navigation.setParams({ userPhoto: auth().currentUser.photoURL })
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.refreshLastEntry)
    clearInterval(this.autoRefresh)
  }

  createAnimation = () =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.state.opacity, {
          toValue: 0.05,
          duration: 2000,
          ease: Easing.ease,
          useNativeDriver: true
        }),
        Animated.timing(this.state.opacity, {
          toValue: 1,
          duration: 2000,
          ease: Easing.ease,
          useNativeDriver: true
        })
      ])
    ).start()

  refreshLastEntry = nextAppState => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      dataStore.groupedRecords
    }
    this.setState({ appState: nextAppState })
  }

  hideDialog = dialog => () => this.setState({ [dialog]: false })

  ///

  renderChip = (timerId, time) =>
    time > 0 && (
      <Chip style={styles.chipMargins}>
        <Text style={styles.chipText}>{i18n.t(timerId) + ' ' + i18n.getMinAndSeconds(time)}</Text>
      </Chip>
    )

  renderLastEntry(groups) {
    const lastGroup = groups[0]
    const lastEntry = lastGroup.group[0]
    const date = moment.unix(lastEntry.date).format(i18n.uses24HourClock ? 'HH:mm' : 'hh:mm A')
    return (
      <Card style={styles.cardLastEntry} onPress={() => this.setState({ editLastEntry: true })}>
        <Card.Title title={i18n.t('home.lastEntry', { date })} subtitle={i18n.humanize(lastEntry.date)} />
        <Card.Content style={styles.rowWrap}>
          {this.renderChip('left', lastEntry.timers['left'])}
          {this.renderChip('right', lastEntry.timers['right'])}
          {this.renderChip('bottle', lastEntry.timers['bottle'])}
          {lastEntry.bottle > 0 && (
            <Chip style={styles.chipMargins}>
              <Text style={styles.chipText}>{`${i18n.t('bottle')} ${lastEntry.bottle}mL`}</Text>
            </Chip>
          )}
          {lastEntry.vitaminD && (
            <Chip style={styles.chipMargins} icon="brightness-5">
              <Text style={styles.chipText}>{i18n.t('vitaminD')}</Text>
            </Chip>
          )}
        </Card.Content>
      </Card>
    )
  }

  renderItem = ({ item }) => {
    const { colors, palette } = this.props.theme
    return (
      <TouchableRipple
        style={{ borderBottomColor: palette.separator, ...styles.list }}
        onPress={() => this.setState({ currentGroup: { ...item }, newGroup: { ...item }, editGroupDialog: true })}
        rippleColor={palette.rippleColor}
      >
        <List.Section title={i18n.formatLongDay(item.day)}>
          <List.Item
            title={i18n.formatItem(item.group.length)}
            left={() => <List.Icon icon="pencil" color={colors.text} style={{ opacity: 0.75 }} />}
            right={() => item.hasVitaminD && <List.Icon color={colors.text} style={{ opacity: 0.5 }} icon="brightness-5" />}
          />
        </List.Section>
      </TouchableRipple>
    )
  }

  /// Dialogs

  editGroupDialog = () => {
    const { colors, palette } = this.props.theme
    let { newGroup } = this.state
    if (!newGroup) {
      return false
    }
    let data
    if (newGroup.group.length === 0) {
      data = <List.Item title={i18n.t('home.groupedEntries.noData')} />
    } else {
      data = newGroup.group.map((entry, index) => {
        let description = []
        if (entry.timers['left'] > 0) {
          description.push(i18n.t('left') + `:  ${i18n.getMin(entry.timers['left'])}`)
        }
        if (entry.timers['right'] > 0) {
          description.push(i18n.t('right') + `: ${i18n.getMin(entry.timers['right'])}`)
        }
        if (entry.timers['bottle'] > 0) {
          description.push(i18n.t('bottle') + `: ${i18n.getMin(entry.timers['bottle'])}`)
        }
        if (entry.bottle > 0) {
          description.push(i18n.t('bottle') + `: ${entry.bottle}mL`)
        }
        return (
          <List.Item
            key={index}
            title={i18n.formatTime(entry.date)}
            description={description.join(', ')}
            right={() => (
              <TouchableRipple
                accessibilityLabel={i18n.t('a11y.deleteData', { date: i18n.formatTime(entry.date) })}
                onPress={() => {
                  newGroup.group = [...newGroup.group.filter(item => item.date !== entry.date)]
                  this.setState({ newGroup })
                }}
              >
                <List.Icon color={colors.text} icon="delete" />
              </TouchableRipple>
            )}
          />
        )
      })
    }
    return (
      <Portal>
        <Dialog visible={this.state.editGroupDialog} onDismiss={this.hideDialog('editGroupDialog')}>
          <Dialog.Title>{moment.unix(newGroup.day).format('dddd')}</Dialog.Title>
          <Dialog.ScrollArea style={styles.containerDialog}>
            <ScrollView>{data}</ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={styles.popupButtonsContainer}>
            <Button accessibilityLabel={i18n.t('cancel')} color={palette.buttonColor} onPress={this.hideDialog('editGroupDialog')}>
              {i18n.t('cancel')}
            </Button>
            <Button
              accessibilityLabel={i18n.t('ok')}
              color={palette.buttonColor}
              onPress={() => {
                dataStore.updateGroup(this.state.currentGroup, newGroup)
                this.setState({ editGroupDialog: false, groupedRecords: dataStore.groupedRecords })
              }}
            >
              {i18n.t('ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }

  renderFab = isStopped => {
    const { colors } = this.props.theme
    if (isStopped) {
      return (
        <View style={styles.absFab}>
          <FAB
            accessibilityLabel={i18n.t('a11y.goToAdd')}
            style={[styles.fab, { backgroundColor: colors.primary }]}
            icon="plus"
            onPress={() =>
              this.props.navigation.navigate('AddEntry', {
                autoRefresh: () => {
                  this.createAnimation()
                  this.forceUpdate()
                }
              })
            }
          />
        </View>
      )
    } else {
      return (
        <Animated.View style={styles.absFab}>
          <FAB
            accessibilityLabel={i18n.t('a11y.timerRunning')}
            style={[styles.fab, { opacity: this.state.opacity, backgroundColor: colors.primary }]}
            icon={'timer'}
            onPress={() => this.props.navigation.navigate('AddEntry')}
          />
        </Animated.View>
      )
    }
  }

  renderProfileIcon = () => {
    if (auth().currentUser && !auth().currentUser.isAnonymous) {
      return (
        <Appbar.Action
          accessibilityLabel={i18n.t('a11y.loggedInIcon')}
          icon={() => (
            <Image
              style={{ flex: 1, backgroundColor: this.props.theme.colors.primaryDarkColor, borderRadius: 16, margin: -4 }}
              source={{ uri: auth().currentUser.photoURL }}
            />
          )}
        />
      )
    }
  }

  renderEntries = () => {
    const { groupedRecords, fetching } = this.state
    if (fetching) {
      return <ActivityIndicator color={this.props.theme.colors.primary} />
    } else {
      if (groupedRecords.length > 0) {
        return (
          <>
            {this.renderLastEntry(groupedRecords)}
            <FlatList
              data={groupedRecords}
              extraData={groupedRecords}
              extractData={groupedRecords.length}
              keyExtractor={item => `${item.key}`}
              renderItem={this.renderItem}
            />
          </>
        )
      } else {
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Subheading>{i18n.t('home.noEntry')}</Subheading>
            <Paragraph>{i18n.t('home.add')}</Paragraph>
          </View>
        )
      }
    }
  }

  render = () => {
    const { colors } = this.props.theme
    const { showSnackbar, snackBarMessage } = this.state
    return (
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <Appbar.Header>
          <Appbar.Action accessibilityLabel={i18n.t('a11y.menuIcon')} icon="menu" onPress={() => this.props.navigation.toggleDrawer()} />
          <Appbar.Content title={i18n.t('navigation.home')} />
          {this.renderProfileIcon()}
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {this.renderEntries()}
          {this.renderFab(isNotRunning(dataStore.timers))}
          {this.editGroupDialog()}
          <Snackbar visible={showSnackbar} onDismiss={() => this.setState({ showSnackbar: false })}>
            {snackBarMessage}
          </Snackbar>
        </View>
      </View>
    )
  }
}

export default withTheme(HomeScreen)
