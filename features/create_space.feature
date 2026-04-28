@UC01
Feature: Chức năng Tạo mới Không gian làm việc - Space (Thành viên 1)

  Background: 
    Given Tôi đã nạp Cookies vào trình duyệt

  @TC01
  Scenario: TC01 (Success) - Tạo Space mới với mẫu Scrum (Mặc định)
    When Tôi truy cập vào trang chủ Jira
    And Tôi nhấn nút dấu cộng tạo Space trên menu
    And Tôi chọn template "Scrum"
    And Tôi điền thông tin dự án Team-managed với tên ngẫu nhiên
    And Tôi nhấn nút Next để sang bước 2
    And Tôi thiết lập Role là "Administrator" và hoàn tất
    Then Hệ thống chuyển hướng vào trang chi tiết của Space mới

  @TC02
  Scenario: TC02 (Success) - Tạo Space mới với mẫu Kanban
    When Tôi truy cập vào trang chủ Jira
    And Tôi nhấn nút dấu cộng tạo Space trên menu
    And Tôi chọn template "Kanban"
    And Tôi điền thông tin dự án Team-managed với tên ngẫu nhiên
    And Tôi nhấn nút Next để sang bước 2
    And Tôi thiết lập Role là "Administrator" và hoàn tất
    Then Hệ thống chuyển hướng vào trang chi tiết của Space mới

  @TC03
  Scenario: TC03 (Success) - Tạo Space mới với mẫu Bug tracking
    When Tôi truy cập vào trang chủ Jira
    And Tôi nhấn nút dấu cộng tạo Space trên menu
    And Tôi chọn template "Bug tracking"
    And Tôi điền thông tin dự án Team-managed với tên ngẫu nhiên
    And Tôi nhấn nút Next để sang bước 2
    And Tôi thiết lập Role là "Administrator" và hoàn tất
    Then Hệ thống chuyển hướng vào trang chi tiết của Space mới

  @TC04
  Scenario: TC04 (Fail) - Báo lỗi khi để trống Tên dự án
    When Tôi truy cập vào trang chủ Jira
    And Tôi nhấn nút dấu cộng tạo Space trên menu
    And Tôi chọn template "Scrum"
    And Tôi để trống ô Tên dự án
    Then Hệ thống phải hiển thị lỗi yêu cầu nhập Tên dự án

  @TC05
  Scenario: TC05 (Fail) - Báo lỗi khi nhập Key dự án có chứa ký tự đặc biệt
    When Tôi truy cập vào trang chủ Jira
    And Tôi nhấn nút dấu cộng tạo Space trên menu
    And Tôi chọn template "Scrum"
    And Tôi nhập tên dự án là "Test Project" và Key là "@#$%"
    Then Hệ thống phải hiển thị lỗi Key không hợp lệ