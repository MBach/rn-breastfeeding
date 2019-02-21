import { StyleSheet } from 'react-native'
import { DarkTheme, DefaultTheme } from 'react-native-paper'

const lightPalette = {
  primaryColor: '#c51162',
  primaryLight: '#fd558f',
  primaryDarkColor: '#8e0038',
  primaryTextColor: '#ffffff',
  secondaryColor: '#546e7a',
  secondaryLight: '#819ca9',
  secondaryDarkColor: '#29434e',
  secondaryTextColor: '#ffffff',
  rippleColor: 'rgba(142, 0, 56, .32)',
  separator: '#cccccc',
  headerTextColor: '#ffffff',
  sectionTextColor: '#717171',
  buttonColor: '#c51162'
}

const darkPalette = {
  primaryColor: '#880e4f',
  primaryLight: '#bc477b',
  primaryDarkColor: '#560027',
  secondaryColor: '#546e7a',
  secondaryLight: '#819ca9',
  secondaryDarkColor: '#29434e',
  secondaryTextColor: '#ffffff',
  rippleColor: 'rgba(142, 0, 56, .32)',
  separator: '#444444',
  headerTextColor: '#dddddd',
  sectionTextColor: '#9B9B9B',
  buttonColor: '#c51162'
}

export const lightTheme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: lightPalette.primaryColor,
    secondary: lightPalette.secondaryColor,
    accent: lightPalette.primaryColor
  },
  palette: lightPalette
}

export const darkTheme = {
  ...DarkTheme,
  roundness: 2,
  colors: {
    ...DarkTheme.colors,
    primary: darkPalette.primaryColor,
    secondary: darkPalette.secondaryColor,
    accent: darkPalette.primaryColor
  },
  palette: darkPalette
}

const styles = StyleSheet.create({
  // home
  cardLastEntry: {
    margin: 8
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    margin: 16,
    alignSelf: 'center'
  },
  list: {
    flex: 1,
    borderBottomWidth: 1
  },
  chipMarginRight: {
    marginRight: 8
  },
  chipText: {
    fontSize: 13
  },
  popupButtonsContainer: {
    flexDirection: 'row',
    minHeight: 30,
    justifyContent: 'space-between',
    marginHorizontal: 20
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
    borderBottomWidth: 3
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  timer: {
    fontSize: 36,
    fontWeight: 'bold',
    borderBottomWidth: 3
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
  chipTimer: {
    flexGrow: 1,
    marginHorizontal: 4,
    marginTop: 16,
    textAlign: 'center'
  }
})

export default styles
