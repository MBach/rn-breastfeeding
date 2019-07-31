import React, { Component } from 'react'
import { Animated, AppState, Dimensions, Easing, FlatList, Image, ScrollView, Text, View } from 'react-native'
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
  TouchableRipple
} from 'react-native-paper'
import { GoogleSignin, statusCodes } from 'react-native-google-signin'
import auth, { firebase } from '@react-native-firebase/auth'
import database from '@react-native-firebase/database'
import { inject, observer } from 'mobx-react'
import moment from 'moment'

import i18n from '../locales/i18n'
import { getMin, getMinAndSeconds, isNotRunning } from '../config'
import styles from '../styles'

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
    header: null
  }

  constructor(props) {
    super(props)
    this.state = {
      appState: AppState.currentState,
      currentGroup: null,
      editGroupDialog: false,
      editLastEntry: false,
      opacity: new Animated.Value(1),
      showSnackbar: false,
      snackBarMessage: '',
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    }
    this.autoRefresh = null
  }

  componentDidMount() {
    AppState.addEventListener('change', this.refreshLastEntry)
    if (!isNotRunning(dataStore.timers)) {
      this.createAnimation()
    }

    this.autoRefresh = setInterval(() => {
      this.forceUpdate()
    }, 1000 * 60)

    if (dataStore.user && dataStore.user.id) {
      this.props.navigation.setParams({ userPhoto: dataStore.user.photo })
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.refreshLastEntry)
    clearInterval(this.autoRefresh)
  }

  signIn = async () => {
    if (dataStore.user && dataStore.user.id) {
      console.warn('already signed in 1', dataStore.user.id)
      return
    }
    try {
      // debug mode
      await GoogleSignin.configure({ webClientId: '954958868925-kdbiotink1d0un16n5j0c81pj5ksbbo0.apps.googleusercontent.com' })
      const { accessToken, idToken } = await GoogleSignin.signIn()
      const credential = firebase.auth.GoogleAuthProvider.credential(idToken, accessToken)
      const res = await firebase.auth().signInWithCredential(credential)
      if (res && res.additionalUserInfo) {
        const { picture, email, sub } = res.additionalUserInfo.profile
        dataStore.user = { photo: picture, email, id: sub }
        this.setState(
          { showSnackbar: true, snackBarMessage: i18n.t('home.greeting', { name: res.additionalUserInfo.profile.name }) },
          this.migrateDataToFirebase
        )
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('statusCodes.SIGN_IN_CANCELLED')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('statusCodes.IN_PROGRESS')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('statusCodes.PLAY_SERVICES_NOT_AVAILABLE')
      } else {
        console.log(error)
      }
    }
  }

  migrateDataToFirebase = async () => {
    if (!dataStore.migrated) {
      const uid = auth().currentUser.uid
      for (const r of dataStore.records) {
        const ref = database().ref(`/users/${uid}/inputs/${r.date}`)
        await ref.set({ ...r })
      }
      dataStore.migrated = true
    }
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

  onLayout = () =>
    this.setState({
      isLandscape: Dimensions.get('window').width > Dimensions.get('window').height
    })

  refreshLastEntry = nextAppState => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      dataStore.groupedRecords
    }
    this.setState({ appState: nextAppState })
  }

  hideDialog = dialog => () => this.setState({ [dialog]: false })

  editGroup = item => {
    this.setState({ currentGroup: { ...item }, editGroupDialog: true })
  }

  update = data => {
    dataStore.updateGroup(data)
    this.setState({ editGroupDialog: false })
  }

  ///

  renderChip = (timerId, time) =>
    time > 0 && (
      <Chip style={styles.chipMargins}>
        <Text style={styles.chipText}>{i18n.t(timerId) + ' ' + getMinAndSeconds(time)}</Text>
      </Chip>
    )

  renderLastEntry(groupedRecords) {
    if (groupedRecords.length > 0) {
      const lastGroup = groupedRecords[0]
      const lastEntry = lastGroup.group[0]
      return (
        <Card
          style={[styles.cardLastEntry, this.state.isLandscape ? { flex: 1, minWidth: '50%', maxWidth: '50%' } : false]}
          onPress={() => this.setState({ editLastEntry: true })}
        >
          <Card.Title title={i18n.formatLastEntry(lastEntry.date)} subtitle={i18n.humanize(lastEntry.date)} />
          <Card.Content style={styles.rowWrap}>
            {this.renderChip('left', lastEntry.timers['left'])}
            {this.renderChip('right', lastEntry.timers['right'])}
            {this.renderChip('bottle', lastEntry.timers['bottle'])}
            {lastEntry.vitaminD && (
              <Chip style={styles.chipMargins} icon="brightness-5">
                <Text style={styles.chipText}>{i18n.t('vitaminD')}</Text>
              </Chip>
            )}
          </Card.Content>
        </Card>
      )
    } else {
      return (
        <Card style={[styles.cardLastEntry, this.state.isLandscape ? { flex: 1, minWidth: '50%', maxWidth: '50%' } : false]}>
          <Card.Title title={i18n.t('home.noEntry')} subtitle={i18n.t('home.add')} />
        </Card>
      )
    }
  }

  renderItem = ({ item }) => {
    const { colors, palette } = this.props.theme
    return (
      <TouchableRipple
        style={{ borderBottomColor: palette.separator, ...styles.list }}
        onPress={() => this.editGroup(item)}
        rippleColor={palette.rippleColor}
      >
        <List.Section title={i18n.formatLongDay(item.day)}>
          <List.Item
            title={i18n.formatItem(item.group.length)}
            left={() => <List.Icon icon="edit" color={colors.text} style={{ opacity: 0.75 }} />}
            right={() => item.hasVitaminD && <List.Icon color={colors.text} style={{ opacity: 0.5 }} icon="brightness-5" />}
          />
        </List.Section>
      </TouchableRipple>
    )
  }

  /// Dialogs

  editGroupDialog = () => {
    const { colors, palette } = this.props.theme
    let { currentGroup } = this.state
    if (!currentGroup) {
      return false
    }
    let data
    if (currentGroup.group.length === 0) {
      data = <List.Item title={i18n.t('home.groupedEntries.noData')} />
    } else {
      data = currentGroup.group.map((entry, index) => {
        let description = []
        if (entry.timers['left'] > 0) {
          description.push(i18n.t('left') + `:  ${getMin(entry.timers['left'])}`)
        }
        if (entry.timers['right'] > 0) {
          description.push(i18n.t('right') + `: ${getMin(entry.timers['right'])}`)
        }
        if (entry.timers['bottle'] > 0) {
          description.push(i18n.t('bottle') + `: ${getMin(entry.timers['bottle'])}`)
        }
        return (
          <List.Item
            key={index}
            title={i18n.formatTime(entry.date)}
            description={description.join(', ')}
            right={() => (
              <TouchableRipple
                onPress={() => {
                  currentGroup.group = [...currentGroup.group.filter(item => item.date !== entry.date)]
                  this.setState({ currentGroup })
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
          <Dialog.Title>{moment.unix(currentGroup.day).format('dddd')}</Dialog.Title>
          <Dialog.ScrollArea style={styles.containerDialog}>
            <ScrollView>{data}</ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={styles.popupButtonsContainer}>
            <Button color={palette.buttonColor} onPress={this.hideDialog('editGroupDialog')}>
              {i18n.t('cancel')}
            </Button>
            <Button color={palette.buttonColor} onPress={() => this.update(currentGroup)}>
              {i18n.t('ok')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }

  renderSnackBar = () => {
    return (
      <Snackbar visible={this.state.showSnackbar} onDismiss={() => this.setState({ showSnackbar: false })}>
        {this.state.snackBarMessage}
      </Snackbar>
    )
  }

  renderFab = isStopped => {
    const { colors } = this.props.theme
    if (isStopped) {
      const extraFab = this.state.isLandscape ? { left: '20%' } : { left: 0, right: 0 }
      return (
        <View style={[styles.absFab, extraFab]}>
          <FAB
            style={[styles.fab, { backgroundColor: colors.primary }]}
            icon={'add'}
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
      const extraFab = this.state.isLandscape ? { left: '20%' } : { left: 0, right: 0 }
      return (
        <Animated.View style={[styles.absFab, extraFab]}>
          <FAB
            style={[styles.fab, { opacity: this.state.opacity, backgroundColor: colors.primary }]}
            icon={'timer'}
            onPress={() => this.props.navigation.navigate('AddEntry')}
          />
        </Animated.View>
      )
    }
  }

  renderProfileIcon = () => {
    if (dataStore.user && dataStore.user.id) {
      console.log('dataStore.user.photo', dataStore.user.photo)
      return (
        <Appbar.Action
          icon={() => (
            <Image
              style={{ width: 32, height: 32, backgroundColor: this.props.theme.colors.primaryDarkColor, borderRadius: 16 }}
              source={{ uri: dataStore.user.photo }}
            />
          )}
          onPress={() => console.warn('already signed in 2')}
        />
      )
    } else {
      return <Appbar.Action icon="account-circle" onPress={this.signIn} />
    }
  }

  render = () => {
    const { colors } = this.props.theme
    const groupedRecords = dataStore.groupedRecords
    return (
      <View
        onLayout={this.onLayout}
        style={[
          { backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
          this.state.isLandscape ? { flexDirection: 'row' } : false
        ]}
      >
        <Appbar.Header>
          <Appbar.Action icon="menu" onPress={() => this.props.navigation.toggleDrawer()} />
          <Appbar.Content title={i18n.t('navigation.home')} />
          {this.renderProfileIcon()}
        </Appbar.Header>
        {dataStore.hydrated && !dataStore.updating && this.renderLastEntry(groupedRecords)}
        {dataStore.hydrated && !dataStore.updating ? (
          <FlatList
            data={groupedRecords}
            extractData={groupedRecords.length}
            keyExtractor={item => `${item.key}`}
            renderItem={this.renderItem}
          />
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
        {this.renderFab(isNotRunning(dataStore.timers))}
        {this.editGroupDialog()}
        {this.renderSnackBar()}
      </View>
    )
  }
}

export default withTheme(HomeScreen)
