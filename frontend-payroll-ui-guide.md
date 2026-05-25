# Hướng dẫn cho Frontend tích hợp giao diện HRM Payroll

Tài liệu này dùng để đội FE dựng giao diện cho backend hiện có trong `backend/`.

## 1. Môi trường chạy

Chạy backend:

```bash
cd backend
docker compose up --build -d
```

Sau khi chạy:

- API base URL: `http://localhost:8088`
- Swagger UI: `http://localhost:8088/swagger`
- Swagger JSON: `http://localhost:8088/swagger/v1/swagger.json`

## 2. Format response chung

Tất cả API đang trả theo format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Khi lỗi:

```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

FE nên chuẩn hóa một API client dùng chung:

1. Nếu HTTP `401` -> đá về màn login.
2. Nếu HTTP `403` -> hiện màn không đủ quyền.
3. Nếu `success = false` -> toast/message từ `message`.
4. Nếu `success = true` -> lấy dữ liệu từ `data`.

## 3. Đăng nhập và phân quyền

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

Response trả về:

- `accessToken`
- `accountId`
- `username`
- `fullName`
- `employeeId`
- `roles`

Sau login, FE truyền:

```http
Authorization: Bearer <access-token>
```

### Current user

```http
GET /api/auth/me
```

### My permissions

```http
GET /api/auth/my-permissions
```

### Change password

```http
POST /api/auth/change-password
```

```json
{
  "currentPassword": "Admin@123",
  "newPassword": "Admin@1234"
}
```

FE nên lưu:

- token
- thông tin user
- danh sách `permissions` lấy từ `GET /api/auth/my-permissions` hoặc `GET /api/auth/me`

Để làm guard menu/button theo permission.

**Gợi ý tách quyền cho FE:**

- `*.read`: dùng cho dropdown, tra cứu, chọn dữ liệu trong các form nghiệp vụ
- `*.manage`: dùng để hiện menu/trang quản lý master data
- `*.create/update/delete`: dùng để bật từng nút thao tác cụ thể trong trang quản lý

## 4. Permission-based UI

Nên ẩn/disable action theo permission, ví dụ:

| Chức năng | Permission gợi ý |
| --- | --- |
| Xem nhân viên | `hr.employees.read` |
| Tạo chấm công | `attendance.create` |
| Vào màn quản lý tài khoản | `accounts.manage` |
| Vào màn quản lý vai trò | `roles.manage` |
| Vào màn quản lý permission | `permissions.manage` |
| Vào màn quản lý sản phẩm | `production.products.manage` |
| Vào màn quản lý công đoạn | `production.operations.manage` |
| Vào màn quản lý đơn giá công đoạn | `production.rates.manage` |
| Tạo đơn giá công đoạn | `production.rates.create` |
| Tạo kỳ lương | `payroll.periods.create` |
| Generate payroll | `payroll.generate` |
| Confirm payroll | `payroll.confirm` |
| Thêm dòng điều chỉnh lương | `payroll.adjust` |

Tên permission thực tế FE nên lấy từ `GET /api/auth/my-permissions` hoặc `GET /api/auth/me`.

## 5. Enum FE cần map

### SalaryCalculationType

| Value | Name | Gợi ý label |
| --- | --- | --- |
| 1 | `FixedMonthly` | Lương tháng cố định |
| 2 | `DailyWage` | Lương theo công |
| 3 | `HourlyWage` | Lương theo giờ |
| 4 | `ProductBased` | Lương sản phẩm |
| 5 | `Mixed` | Lương hỗn hợp |

### WorkTimeType

| Value | Name | Gợi ý label |
| --- | --- | --- |
| 1 | `Regular` | Giờ hành chính |
| 2 | `OvertimeNormal` | OT ngày thường |
| 3 | `OvertimeNight` | OT ban đêm |
| 4 | `OvertimeSunday` | OT chủ nhật |
| 5 | `OvertimeHoliday` | OT ngày lễ |

### PayrollItemType

| Value | Name | Gợi ý label |
| --- | --- | --- |
| 1 | `AttendanceSalary` | Lương công |
| 2 | `ProductSalary` | Lương sản phẩm |
| 3 | `OvertimeSalary` | Lương OT |
| 4 | `Allowance` | Phụ cấp |
| 5 | `Bonus` | Thưởng |
| 6 | `Deduction` | Khấu trừ |
| 7 | `Insurance` | Bảo hiểm |
| 8 | `Tax` | Thuế |

## 6. Màn hình FE nên làm

## 6.1 Auth

- Login
- Profile góc phải / current user
- Change password
- Logout

## 6.2 Master data

- Departments
- Employees
- Products
- Operations
- Product Operations
- Product Operation Rates
- Employee Salary Rates

## 6.3 Attendance

- Danh sách chấm công
- Form nhập chấm công

## 6.4 Payroll

- Danh sách kỳ lương
- Tạo kỳ lương
- Generate payroll
- Danh sách payroll theo kỳ
- Chi tiết payroll theo nhân viên
- Thêm item điều chỉnh
- Confirm payroll
- Lock kỳ lương
- Mark paid

## 6.5 Reports

- Payroll reports

## 7. Gợi ý flow màn hình

### Flow nhập dữ liệu và tính lương

1. Khai báo `Products`
2. Trong từng `Product`, thêm `Operation` cho chính sản phẩm đó
3. Trong từng `ProductOperation`, khai báo `ProductOperationRates` theo `WorkTimeType` và khoảng thời gian hiệu lực
4. Khai báo `EmployeeSalaryRates`
5. Nhập `Attendances`
6. Tạo `PayrollPeriod`
7. Generate payroll
8. Xem payroll detail
9. Thêm item điều chỉnh nếu cần
10. Confirm từng payroll
11. Lock kỳ lương
12. Mark paid

**Lưu ý:** backend không còn seed sẵn dữ liệu mẫu về nhân viên, sản phẩm, công đoạn hay đơn giá. FE nên giả định database mới chỉ có seed RBAC mặc định.

## 8. API chính cho FE

## 8.1 Employees

```http
GET  /api/employees
POST /api/employees
PUT  /api/employees/{id}
DELETE /api/employees/{id}
```

Payload tạo nhân viên:

```json
{
  "code": "EMP001",
  "fullName": "Nguyen Van A",
  "departmentId": "guid-or-null",
  "positionName": "Worker",
  "salaryCalculationType": 5
}
```

## 8.1a Departments

```http
GET  /api/departments
POST /api/departments
PUT  /api/departments/{id}
DELETE /api/departments/{id}
```

## 8.1b Accounts

```http
GET  /api/accounts
POST /api/accounts
PUT  /api/accounts/{id}
```

Payload tạo/cập nhật account có thể truyền thêm:

```json
{
  "username": "emp001",
  "fullName": "Nguyen Van A",
  "password": "Password@123",
  "roleIds": ["guid"],
  "employeeId": "guid-or-null"
}
```

`employeeId` dùng để liên kết 1 tài khoản với 1 nhân viên.

## 8.2 Products

```http
GET  /api/products
GET  /api/products/{productId}/operations
POST /api/products/{productId}/operations
GET  /api/products/{productId}/operations/{operationId}/rates
DELETE /api/products/{productId}/operations/{operationId}
POST /api/products
PUT  /api/products/{id}
DELETE /api/products/{id}
```

```json
{
  "code": "4012",
  "name": "Tui Black",
  "unit": "cai"
}
```

Thêm công đoạn có sẵn vào sản phẩm:

```json
{
  "operationId": "guid"
}
```

Hoặc tạo mới công đoạn và gán ngay vào sản phẩm trong cùng 1 request:

```json
{
 "code": "OP-SEW-BODY",
 "name": "May than tui voi xop"
}
```

**Lưu ý FE:**

- `GET /api/products/{productId}/operations` trả về công đoạn đã được gán cho sản phẩm, không còn suy ra từ bảng đơn giá.
- `POST /api/products/{productId}/operations` là endpoint chính cho màn sản phẩm: có thể gán công đoạn có sẵn hoặc tạo mới rồi gán luôn.
- Khi tạo mới trong sản phẩm, `code` công đoạn có thể trùng với sản phẩm khác; backend xem đây là 2 công đoạn khác nhau nếu thuộc 2 sản phẩm khác nhau.
- Trong cùng một sản phẩm, `code` công đoạn phải duy nhất. Nếu sản phẩm đã có công đoạn mã `01` thì không thể thêm hoặc đổi thêm một công đoạn khác cũng thành `01`.
- Phải có công đoạn trong sản phẩm trước khi cho phép tạo `ProductOperationRates`.
- `DELETE /api/products/{productId}/operations/{operationId}` sẽ bị chặn nếu mapping đó đã phát sinh đơn giá.
- UI nên thể hiện theo cây: `Product -> Operations của Product -> Rates của từng Operation`.

## 8.3 Operations

```http
GET  /api/operations
POST /api/operations
PUT  /api/operations/{id}
DELETE /api/operations/{id}
```

```json
{
  "code": "OP-SEW-BODY",
  "name": "May than tui voi xop"
}
```

Endpoint này dùng khi cần quản lý danh mục công đoạn gốc độc lập. Với màn quản lý sản phẩm, nên ưu tiên dùng `POST /api/products/{productId}/operations` để người dùng có cảm giác "thêm công đoạn cho sản phẩm" trong một bước.

## 8.4 Product Operation Rates

```http
GET  /api/product-operation-rates
POST /api/product-operation-rates
PUT  /api/product-operation-rates/{id}
DELETE /api/product-operation-rates/{id}
```

```json
{
  "productId": "guid",
  "operationId": "guid",
  "workTimeType": 1,
  "unitPrice": 500,
  "effectiveFrom": "2026-05-01",
  "effectiveTo": null
}
```

**Lưu ý FE:**

- Chỉ cho tạo đơn giá khi `productId + operationId` đã tồn tại trong `ProductOperations`.
- Không cho người dùng tạo 2 rate active bị chồng ngày cho cùng `productId + operationId + workTimeType`.
- Nên lọc/group theo `product`, `operation`, `workTimeType`.

## 8.5 Employee Salary Rates

```http
GET  /api/employee-salary-rates/{employeeId}
POST /api/employee-salary-rates
PUT    /api/employee-salary-rates/{id}
DELETE /api/employee-salary-rates/{id}
```

Rule khi nhập:

- `FixedMonthly`: nhập `monthlySalary`
- `DailyWage`: nhập `dailyRate`
- `HourlyWage`: nhập `hourlyRate`
- `ProductBased`: có thể để `monthlySalary`, `dailyRate`, `hourlyRate` là `null`
- `Mixed`: cần ít nhất một trong ba giá trị trên lớn hơn `0`
- FE có thể chỉ cho người dùng nhập `effectiveFrom`; backend sẽ tự:
  - đóng dòng liền trước tại `effectiveFrom - 1 ngày`
  - tự giới hạn `effectiveTo` đến trước dòng kế tiếp nếu có
- Nếu đã có dòng cùng `effectiveFrom`, FE nên chuyển sang flow cập nhật thay vì tạo mới

```json
{
  "employeeId": "guid",
  "calculationType": 5,
  "monthlySalary": null,
  "dailyRate": 250000,
  "hourlyRate": 35000,
  "effectiveFrom": "2026-05-01",
  "effectiveTo": null
}
```

## 8.6 Attendances

```http
GET  /api/attendances?employeeId=&fromDate=&toDate=
POST /api/attendances
DELETE /api/attendances/{id}
```

```json
{
  "employeeId": "guid",
  "workDate": "2026-05-13",
  "shiftCode": "A",
  "checkIn": "2026-05-13T08:00:00Z",
  "checkOut": "2026-05-13T17:00:00Z",
  "workingHours": 8,
  "workingDayValue": 1,
  "overtimeHours": 2
}
```

**Lưu ý FE:** gửi `checkIn`, `checkOut` dạng UTC ISO string với `Z`.

## 8.7 Payroll Periods

```http
GET  /api/payroll-periods
POST /api/payroll-periods
DELETE /api/payroll-periods/{id}
POST /api/payroll-periods/{id}/lock
POST /api/payroll-periods/{id}/paid
```

```json
{
  "name": "Ky luong thang 05/2026",
  "fromDate": "2026-05-01",
  "toDate": "2026-05-31"
}
```

**Quy ước nghiệp vụ:**

1. Chỉ lock được kỳ lương đang `Open`.
2. Chỉ mark paid được kỳ lương đã `Locked`.
3. Không xóa kỳ lương nếu kỳ đó đã phát sinh payroll.

## 8.8 Payrolls

```http
POST /api/payrolls/generate
GET  /api/payrolls/{periodId}
GET  /api/payrolls/{periodId}/employees/{employeeId}
POST /api/payrolls/{payrollId}/confirm
POST /api/payrolls/{payrollId}/items
```

Generate:

```json
{
  "payrollPeriodId": "guid"
}
```

**Quy ước nghiệp vụ:**

1. Chỉ generate cho kỳ `Draft` hoặc `Open`.
2. Nếu đã có payroll trong kỳ thì chỉ được generate lại khi tất cả payroll vẫn ở trạng thái `Calculated`.
3. Chỉ confirm payroll khi kỳ lương đang `Open`.
4. Chỉ thêm item điều chỉnh khi payroll đang `Calculated`.

Thêm item điều chỉnh:

```json
{
  "type": 4,
  "name": "Phu cap com",
  "quantity": 20,
  "unitPrice": 30000,
  "amount": 600000
}
```

## 9. Cấu trúc dữ liệu FE nên dùng

Gợi ý type:

```ts
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};
```

```ts
export type SessionUser = {
  accountId: string;
  username: string;
  fullName: string;
  employeeId: string | null;
  accessToken: string;
  roles: string[];
};

export type MyPermissionsResponse = {
  accountId: string;
  permissions: string[];
};
```

```ts
export type PayrollDetail = {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeCode: string;
  employeeFullName: string;
  attendanceSalary: number;
  productSalary: number;
  overtimeSalary: number;
  allowanceAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  grossSalary: number;
  netSalary: number;
  status: string;
  items: PayrollItem[];
};
```

```ts
export type PayrollItem = {
  id: string;
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sourceType?: string | null;
  sourceId?: string | null;
};
```

## 10. Bố cục UI gợi ý

### Sidebar

- Dashboard
- Nhân sự
- Chấm công
- Sản lượng
- Kỳ lương
- Bảng lương
- Báo cáo
- Hệ thống

### Payroll detail page

Nên chia 3 khối:

1. **Thông tin nhân viên + kỳ lương**
2. **Tổng hợp tiền**
   - AttendanceSalary
   - ProductSalary
   - OvertimeSalary
   - AllowanceAmount
   - BonusAmount
   - DeductionAmount
   - GrossSalary
   - NetSalary
3. **Bảng PayrollItems**
   - loại dòng
   - diễn giải
   - số lượng
   - đơn giá
   - thành tiền
   - source

## 11. Rule FE cần tôn trọng

1. Khi kỳ lương đã `Locked` hoặc `Paid`, không cho mở form tạo/sửa attendance trong ngày thuộc kỳ đó.
2. Với luồng làm lương, FE nên đi theo thứ tự: generate -> điều chỉnh -> confirm payroll -> lock kỳ -> mark paid.
3. Luôn xem Swagger là nguồn tham chiếu cuối cho contract thực tế.
4. Với field ngày:
   - `DateOnly` -> dùng `YYYY-MM-DD`
   - `DateTime` -> dùng ISO UTC, ví dụ `2026-05-13T08:00:00Z`

## 12. Checklist để FE bắt đầu nhanh

1. Dựng API client + interceptor Bearer token
2. Dựng auth store
3. Dựng permission guard
4. Làm master data screens trước
5. Làm attendance + production
6. Làm payroll periods + payroll detail
7. Sau cùng hoàn thiện report và quản trị hệ thống

## 13. Tài liệu liên quan

- `README.md`
- `docs/account-authorization.md`
- Swagger UI: `http://localhost:8088/swagger`
