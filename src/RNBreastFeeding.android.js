import { NativeModules } from 'react-native'

const { RNBreastFeedingModule } = NativeModules
const { addTime, changeTo, pauseResumeTimer, stopTimers } = RNBreastFeedingModule
const RNBreastFeeding = { addTime, changeTo, pauseResumeTimer, stopTimers }

export default RNBreastFeeding
