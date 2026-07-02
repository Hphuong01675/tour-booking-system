# Selenium Java Automation

Project test automation cho website local `http://localhost:5173/` bằng Selenium WebDriver, TestNG và Page Object Model.

## Cấu trúc chính

- `src/main/java/org/example/selenium/base`: lớp nền dùng chung cho test và page object.
- `src/main/java/org/example/selenium/config`: cấu hình `baseUrl`, `browser`, `headless`.
- `src/main/java/org/example/selenium/factory`: khởi tạo WebDriver cho Chrome/Edge.
- `src/test/java/org/example/selenium/pages/auth`: Page Object cho chức năng đăng nhập.
- `src/test/java/org/example/selenium/tests`: test case automation.
- `src/test/java/org/example/selenium/listeners`: listener ghi ExtentReports, log, screenshot, bug report.
- `src/test/resources/test-data`: dữ liệu test và mapping manual-to-automation.
- `src/test/resources/suites`: suite `smoke`, `regression`, `negative`, `functional`, `security-negative`, `regression-bug`.

## Chạy test

Chạy smoke suite mặc định:

```bash
mvn clean test
```

Chạy với URL local khác:

```bash
mvn clean test -DbaseUrl=http://localhost:5173/
```

Chạy headless:

```bash
mvn clean test -Dheadless=true
```

Chạy browser khác:

```bash
mvn clean test -Dbrowser=EDGE
```

Chạy suite cụ thể:

```bash
mvn clean test -DsuiteXmlFile=src/test/resources/suites/regression.xml
```

## Kết quả sau khi chạy

- Extent report: `target/extent-report/ExtentReport.html`
- TestNG/Surefire report: `target/surefire-reports`
- Screenshot khi fail: `target/screenshots`
- Automation log: `target/logs/automation.log`
- Bug report CSV khi fail: `target/reports/bug_report.csv`

## Test đã triển khai

Các test đã triển khai thật và chạy trong smoke suite:

```text
AUTH_001 - Login successfully with valid credentials
GUE_003 - View tour detail as guest
GUE_004 - Search tour on home page
ADM_001 - Search and filter voucher by status
ADM_007 - Search tour by name
ADM_008 - Filter tours by open status
ADM_009 - Filter tours by hard difficulty
ADM_014 - Search user by email
```

Data nằm tại:

```text
src/test/resources/test-data/auth-login.csv
```

Test method:

```java
test_AUTH_001_login_successfully_with_valid_credentials
test_GUE_003_view_tour_detail_as_guest
test_GUE_004_search_tour_on_home_page
test_ADM_001_search_and_filter_voucher_by_status
test_ADM_007_search_tour_by_name
test_ADM_008_filter_tours_by_open_status
test_ADM_009_filter_tours_by_hard_difficulty
test_ADM_014_search_user_by_email
```

Assertion chính:

```java
Assert.assertFalse(loginPage.getCurrentUrl().contains("/login"));
```

Nghĩa là sau khi login thành công, URL không còn ở trang `/login`.

Các test đã viết thêm nhưng cần đợi hết khóa đăng nhập do website báo thử lại sau 15 phút:

```text
OPE_003 - Required fields are marked on create tour form
GUI_001 - Guide profile identity fields are disabled
GUI_004 - Invalid short phone number shows validation error
```

Chạy nhóm đã verify:

```bash
mvn test -DsuiteXmlFile=src/test/resources/suites/easy.xml
```

Chạy operator/guide sau khi hết khóa login:

```bash
mvn test -DsuiteXmlFile=src/test/resources/suites/role-extra.xml
```

## Các test case còn lại trong tài liệu

File kế hoạch có 53 test case. Những case thuộc Admin, Customer, Guide và Operator cần thêm thông tin ổn định trước khi viết automation thật:

- Tài khoản theo từng role.
- Route chính xác của từng màn hình.
- Selector ổn định hoặc `data-testid`.
- Seed data cho voucher, tour, booking, guide assignment, invoice, QR/check-in.
- Quy tắc expected result cuối cùng cho các thao tác có side effect như tạo voucher, booking, phân công hướng dẫn viên.

Không nên viết các test này bằng selector đoán hoặc dữ liệu không cố định vì sẽ tạo test flaky và không chứng minh được pass/fail thật.
