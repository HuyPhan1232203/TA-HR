# FE Development Guide (TA Backend)

Tài liệu này là tài liệu chính cho FE theo code backend hiện tại.

## 1. Scope hệ thống

Module đang dùng:

- Auth + RBAC
- Departments
- Employees
- Attendance + Shift Config + Shift Assignment
- My Attendance (self-service)
- Holiday calendar
- Overtime request + approval + comp-time allocation
- Employee salary rates
- Payroll periods + payrolls + reports + transfer batch export
- Audit logs

Module `Production` đã loại bỏ.

## 2. Quy ước chung

- Authorization header: `Bearer <token>`
- Response envelope:

```json
{
  "success": true,
  "message": "Thao tác thành công.",
  "data": {}
}
```

- Enum trả về dạng số (không trả `ToString`).
- FE xử lý status chính: `200`, `400`, `401`, `403`, `404`, `409`.

## 3. Auth + RBAC

API chính:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/my-permissions`
- `GET /api/permissions`
- `GET /api/roles`
- `POST /api/roles`
- `PUT /api/roles/{roleId}`

### Rule gán role cho account employee

API:

- `POST /api/employees/{employeeId}/account`

Request:

```json
{
  "username": "nv001",
  "password": "123456",
  "roleIds": []
}
```

Rule backend:

- Nếu `roleIds` rỗng/null: tự gán role `employee`.
- Nếu `password` rỗng/null: tự sinh `<username>@123`.
- Nếu `roleIds` có dữ liệu: backend validate tất cả role tồn tại.

## 4. Employees

API:

- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/{id}`
- `DELETE /api/employees/{id}`

### Field ngân hàng đã hỗ trợ

- `bankAccountNumber`
- `bankAccountName`
- `bankBranchName`
- `bankPartnerEmail`

Các field này dùng cho export chuyển khoản payroll.

### Salary type

Hiện chỉ hỗ trợ `FixedMonthly` (`1`).

## 5. Attendance

### 5.1 Admin attendance

API:

- `GET /api/attendances`
- `POST /api/attendances`
- `DELETE /api/attendances/{id}`

Rule thời gian:

- `checkIn`, `checkOut` input format `HH:mm`.
- Response attendance cũng trả `HH:mm` cho check-in/check-out.

Regex FE nên dùng:

- `^([01]\d|2[0-3]):[0-5]\d$`

### 5.2 Self attendance

API:

- `POST /api/my-attendance/check-in`
- `POST /api/my-attendance/check-out`
- `GET /api/my-attendance/attendances?fromDate=&toDate=`

### 5.3 Late/Early request

API:

- `POST /api/my-attendance/adjustment-requests`
- `GET /api/my-attendance/adjustment-requests`
- `GET /api/attendance-adjustment-requests`
- `POST /api/attendance-adjustment-requests/{id}/approve`
- `POST /api/attendance-adjustment-requests/{id}/reject`

## 6. Holiday calendar

API:

- `GET /api/holidays?fromDate=&toDate=`
- `POST /api/holidays`
- `DELETE /api/holidays/{id}`

Holiday có cờ `isPaidLeave` để ảnh hưởng công chuẩn kỳ lương.

## 7. Overtime workflow (tách khỏi check-in/check-out)

API employee:

- `POST /api/my-attendance/overtime-requests`
- `GET /api/my-attendance/overtime-requests`

API manager/HR:

- `GET /api/overtime-requests?status=&fromDate=&toDate=`
- `POST /api/overtime-requests/{id}/approve`
- `POST /api/overtime-requests/{id}/reject`

Approve request cần:

- `compensationPayrollPeriodId` (kỳ lương dùng để bù giờ).

Ý nghĩa nghiệp vụ:

- Tăng ca không cộng trực tiếp từ check-in/check-out.
- Chỉ khi đơn tăng ca được duyệt mới tạo `comp-time allocation` vào kỳ lương được chọn.

## 8. Payroll period config + công thức tính lương

### 8.1 Config kỳ lương

API:

- `POST /api/payroll-periods`

Field mới:

- `workingDays`: danh sách ngày làm việc trong tuần (`1=Mon ... 7=Sun`), ví dụ T2-T7 = `[1,2,3,4,5,6]`
- `standardHoursPerDay`: số giờ chuẩn/ngày, ví dụ `8`

### 8.2 Công thức thực thi trong backend

Khi `POST /api/payrolls/generate`, backend tính:

- `StandardWorkingDays` = số ngày theo `workingDays` trong khoảng kỳ lương, trừ các ngày `holiday.isPaidLeave = true`
- `StandardHoursMonth` = `StandardWorkingDays × standardHoursPerDay`
- `ActualHours` = tổng giờ chấm công đã duyệt, có chặn theo ngày: `min(workingHours, standardHoursPerDay)`
- `CompHours` = tổng giờ bù từ overtime đã duyệt và gán vào kỳ lương
- `PayableHours` = `min(StandardHoursMonth, ActualHours + CompHours)`

Lương tháng thực nhận:

- Nếu `StandardHoursMonth > 0`:
  - `Salary = MonthlySalary × (PayableHours / StandardHoursMonth)`
- Nếu `StandardHoursMonth = 0`:
  - `Salary = MonthlySalary`

Tức là cùng bản chất với công thức trừ giờ thiếu:

- `HourRate = MonthlySalary / StandardHoursMonth`
- `MissingHours = StandardHoursMonth - PayableHours`
- `Salary = MonthlySalary - (MissingHours × HourRate)`

## 9. Salary rates

API:

- `GET /api/employee-salary-rates/{employeeId}`
- `POST /api/employee-salary-rates`
- `PUT /api/employee-salary-rates/{id}`
- `DELETE /api/employee-salary-rates/{id}`

Rule:

- Chỉ cho phép `FixedMonthly`.
- `MonthlySalary > 0` bắt buộc.
- `DailyRate`, `HourlyRate` không dùng.

## 10. Export chuyển khoản theo template

API:

- `POST /api/payrolls/transfer-batch?year=2026&month=6`
- `POST /api/payrolls/{periodId}/transfer-batch`

Request:

```json
{
  "sourceAccount": "03001017000323",
  "description": "Luong thang 06/2026",
  "transactionType": 2,
  "feeType": 1
}
```

Ghi chú:

- Backend sẽ trả file `.xlsx` đúng format template.
- Backend tự dùng template mặc định trên server, FE không truyền path.
- Backend chặn export nếu nhân viên còn thiếu thông tin ngân hàng bắt buộc (`bankAccountNumber`, `bankAccountName`, `bankBranchName`).
- Với endpoint `transfer-batch?year=&month=`:
  - nếu không tìm thấy kỳ lương: trả `404`
  - nếu trùng nhiều kỳ trong cùng tháng: trả `409`, FE gọi endpoint theo `periodId`.

## 11. FE rollout thứ tự khuyến nghị

1. Login + permission store + route guard.
2. Employee CRUD + tạo account employee.
3. Shift config + shift assignment.
4. Attendance admin + self attendance.
5. Late/Early request + approval.
6. Holiday management.
7. Overtime request + approval + chọn kỳ bù giờ.
8. Payroll period config (workingDays + standardHoursPerDay).
9. Generate/confirm/lock/paid payroll.
10. Export transfer batch và gửi file cho kế toán/ngân hàng.
