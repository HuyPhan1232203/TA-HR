# Tài Liệu FE Tổng Hợp (Attendance + Payroll)

Tài liệu này là bản tổng hợp chính cho FE, bám theo backend hiện tại trong `backend/src/HR.Api`.

## 1. Phạm vi hệ thống

Các module đang active:

- Auth / RBAC
- Departments
- Employees
- Attendance + Shift Config + Shift Assignment
- Attendance Self-service + Approval Workflow
- Employee Salary Rates
- Payroll Periods + Payrolls + Payroll Reports
- Audit Logs

Không còn module `Production` (Products, Operations, ProductOperationRates, ProductionOutputs).

## 2. Quy ước bắt buộc cho FE

### 2.1 Auth header

```http
Authorization: Bearer <access-token>
```

### 2.2 Envelope response

```json
{
  "success": true,
  "message": "Thao tác thành công.",
  "data": {}
}
```

### 2.3 HTTP status cần xử lý

- `200`: thành công
- `400`: validation lỗi
- `401`: chưa đăng nhập / token sai
- `403`: không đủ quyền
- `404`: không tìm thấy
- `409`: conflict nghiệp vụ

### 2.4 Enum trả về dạng số

FE map enum theo số, không kỳ vọng `ToString()`.

## 3. Luồng triển khai FE tối ưu

### Bước 1: Auth + Permission bootstrap

API:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/my-permissions`

FE cần lưu:

- `accessToken`
- `currentUser` (`accountId`, `employeeId`, ...)
- `permissions: string[]`

### Bước 2: Master data

API:

- `GET/POST/PUT/DELETE /api/departments`
- `GET/POST/PUT/DELETE /api/employees`

### Bước 3: Tạo account cho employee

API:

- `POST /api/employees/{employeeId}/account`

Contract bắt buộc:

- `roleIds` là bắt buộc, FE phải chọn ít nhất 1 role.
- `password` có thể bỏ trống (`null` hoặc rỗng), backend tự sinh `<username>@123`.

Request mẫu:

```json
{
  "username": "nv001",
  "password": "123456",
  "roleIds": ["role-guid-employee"]
}
```

### Bước 4: Shift config + gán ca theo nhân viên

API:

- `GET /api/attendance-shift-configs`
- `POST /api/attendance-shift-configs`
- `DELETE /api/attendance-shift-configs/{id}`
- `GET /api/employees/{employeeId}/shift-assignments`
- `POST /api/employees/{employeeId}/shift-assignments`

Khuyến nghị FE:

- Cache danh sách ca làm sau login.
- Dùng sessions của ca để tự tính công phía FE.

### Bước 5: Attendance admin

API:

- `GET /api/attendances?employeeId=&fromDate=&toDate=`
- `POST /api/attendances`
- `DELETE /api/attendances/{id}`

Contract thời gian bắt buộc:

- `checkIn` / `checkOut` dùng format `HH:mm`.
- Không gửi ISO datetime cho create attendance.

Regex FE nên validate:

- `^([01]\d|2[0-3]):[0-5]\d$`

### Bước 6: Attendance self-service

API:

- `POST /api/my-attendance/check-in`
- `POST /api/my-attendance/check-out`
- `POST /api/my-attendance/adjustment-requests`
- `GET /api/my-attendance/adjustment-requests`

Enum request:

- `requestType`: `1 = LateArrival`, `2 = EarlyLeave`

### Bước 7: Approval workflow (HR/Manager/Admin)

API:

- `GET /api/attendance-adjustment-requests?status=&fromDate=&toDate=`
- `POST /api/attendance-adjustment-requests/{id}/approve`
- `POST /api/attendance-adjustment-requests/{id}/reject`

Enum status:

- `1 = Pending`, `2 = Approved`, `3 = Rejected`

Rule:

- Chỉ xử lý được đơn `Pending`.
- Khi reject, `reviewNote` bắt buộc.

### Bước 8: Payroll flow

API:

- Salary rates: `GET/POST/PUT/DELETE /api/employee-salary-rates`
- Payroll periods: `GET/POST /api/payroll-periods`, `POST /{id}/lock`, `POST /{id}/paid`, `DELETE /{id}`
- Payrolls: `POST /api/payrolls/generate`, `GET /api/payrolls/{periodId}`, `GET /api/payrolls/{periodId}/employees/{employeeId}`, `POST /api/payrolls/{payrollId}/confirm`, `POST /api/payrolls/{payrollId}/items`
- Reports: `GET /api/payroll-reports/periods/{periodId}`

Flow chuẩn:

1. Tạo kỳ lương.
2. Chốt dữ liệu attendance.
3. Generate payroll.
4. Điều chỉnh items (nếu cần).
5. Confirm payroll.
6. Lock kỳ lương.
7. Mark paid.

## 4. Permission quan trọng cho route guard FE

- `accounts.*`
- `roles.*`
- `permissions.read`
- `hr.departments.*`
- `hr.employees.*`
- `attendance.*`
- `attendance.self.*`
- `attendance.request.*`
- `payroll.salary-rates.*`
- `payroll.periods.*`
- `payroll.*`
- `payroll.reports.read`
- `system.audit-logs.read`

## 5. RBAC gán role ngắn gọn (cho FE)

- Lấy quyền: `GET /api/permissions`
- Lấy role: `GET /api/roles`
- Tạo/cập nhật role:
  - `POST /api/roles`
  - `PUT /api/roles/{roleId}`
- Tạo account cho employee:
  - `POST /api/employees/{employeeId}/account`
  - `roleIds` bắt buộc
- Verify sau khi gán:
  - login account vừa tạo
  - gọi `GET /api/auth/my-permissions`
  - đối chiếu quyền với menu/action FE

## 6. Calendar dashboard (tuỳ chọn mở rộng)

Hiện tại FE có thể dùng:

- `GET /api/attendances?employeeId=&fromDate=&toDate=`

Nếu cần tối ưu dashboard theo tháng, có thể đề xuất backend endpoint aggregate:

- `GET /api/attendances/dashboard?employeeId=&year=2026&month=5`

Mục tiêu response:

- `summary` theo tháng
- `days[]` để render lịch
- `employeeChart[]` cho biểu đồ theo nhân viên

## 7. Checklist triển khai FE

1. Dựng API client + interceptor Bearer token.
2. Làm auth store (`login`, `me`, `my-permissions`).
3. Dựng route/menu guard theo permission.
4. Triển khai màn employees + create employee account (role bắt buộc).
5. Triển khai shift config + shift assignment.
6. Triển khai attendance admin theo format `HH:mm`.
7. Triển khai self-service + approval workflow.
8. Triển khai payroll flow.
9. Kiểm thử E2E tối thiểu với 3 role: `employee`, `reviewer`, `hr/admin`.

---

Nếu backend đổi contract, cập nhật file này trước rồi mới triển khai FE để tránh lệch luồng.
