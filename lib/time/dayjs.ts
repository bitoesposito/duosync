/**
 * Day.js Configuration
 * 
 * Timezone and date/time utilities setup
 */

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)

export default dayjs
