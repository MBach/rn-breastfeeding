import { NativeModules } from 'react-native'

const { RNBreastFeedingModule } = NativeModules
const { addTime, changeTo, pauseResumeTimer, setTheme, stopTimers } = RNBreastFeedingModule
const RNBreastFeeding = { addTime, changeTo, pauseResumeTimer, setTheme, stopTimers }

export default RNBreastFeeding
