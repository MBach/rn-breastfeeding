import { StyleSheet } from 'react-native'
import { DefaultTheme } from 'react-native-paper'

export const palette = {
  primaryColor: '#c51162',
  primaryLight: '#fd558f',
  primaryDarkColor: '#8e0038',
  primaryTextColor: '#ffffff',
  secondaryColor: '#546e7a',
  secondaryLight: '#819ca9',
  secondaryDarkColor: '#29434e',
  secondaryTextColor: '#ffffff',
  rippleColor: 'rgba(142, 0, 56, .32)'
}

export const theme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.primaryColor,
    accent: palette.primaryColor
  }
}

const styles = StyleSheet.create({
  // home
  fab: {
    position: 'absolute',
    bottom: 16,
    margin: 16,
    right: 0
  },
  list: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc'
  },
  // add entry
  mainContainer: {
    flex: 1,
    padding: 16
  },
  dateContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxHeight: 70
  },
  date: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 3,
    borderBottomColor: '#cccccc'
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  timer: {
    fontSize: 36,
    fontWeight: 'bold',
    borderBottomWidth: 3,
    borderBottomColor: '#cccccc'
  },
  buttonsContainer: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    maxHeight: '30%'
  },
  buttons: {
    minHeight: 40,
    margin: 16,
    borderRadius: 40,
    width: '40%'
  },
  timerStopped: {
    backgroundColor: palette.primaryColor
  },
  timerRunning: {
    backgroundColor: palette.secondaryColor
  },
  chipTimer: {
    flexGrow: 1,
    marginHorizontal: 4,
    marginTop: 16,
    textAlign: 'center'
  }
})

export default styles
