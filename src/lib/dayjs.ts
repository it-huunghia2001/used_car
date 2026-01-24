import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/vi";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

// Set múi giờ mặc định là Việt Nam
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

export default dayjs;
