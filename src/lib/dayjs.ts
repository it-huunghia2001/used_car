import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime"; // 1. Thêm cái này
import "dayjs/locale/vi";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);
dayjs.extend(relativeTime);

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime); // 2. Kích hoạt cái này
dayjs.locale("vi");

dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

export default dayjs;
