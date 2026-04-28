@UC03
Feature: Chức năng Tạo mới Issue trên Jira (Thành viên 2)

  Background:
    Given Tôi đã nạp Cookies vào trình duyệt
    And Tôi truy cập vào trang dự án Jira của nhóm

  @TC03_01
  Scenario: TC01 (Success) - Tạo Issue với dữ liệu hợp lệ (Mặc định)
    When Tôi nhấn nút Create trên thanh điều hướng
    And Tôi nhập Summary là "Test Issue tự động bằng Playwright"
    And Tôi nhấn nút xác nhận Create trên form
    Then Hệ thống phải hiển thị thông báo tạo Issue thành công

  @TC03_02
  Scenario: TC02 (Success) - Tạo Issue với Summary ngắn (1 ký tự)
    When Tôi nhấn nút Create trên thanh điều hướng
    And Tôi nhập Summary là "A"
    And Tôi nhấn nút xác nhận Create trên form
    Then Hệ thống phải hiển thị thông báo tạo Issue thành công

  @TC03_03
  Scenario: TC03 (Success) - Tạo Issue với Summary là ký tự đặc biệt
    When Tôi nhấn nút Create trên thanh điều hướng
    And Tôi nhập Summary là "@#$%^&*()_+"
    And Tôi nhấn nút xác nhận Create trên form
    Then Hệ thống phải hiển thị thông báo tạo Issue thành công

  @TC03_04
  Scenario: TC04 (Fail) - Báo lỗi khi để trống trường Summary
    When Tôi nhấn nút Create trên thanh điều hướng
    And Tôi để trống trường Summary
    And Tôi nhấn nút xác nhận Create trên form
    Then Hệ thống phải hiển thị cảnh báo lỗi "Summary is required"

  @TC03_05
  Scenario: TC05 (Fail) - Báo lỗi khi nhập Summary quá dài (Vượt quá 255 ký tự)
    When Tôi nhấn nút Create trên thanh điều hướng
    And Tôi nhập Summary vượt quá 255 ký tự
    And Tôi nhấn nút xác nhận Create trên form
    Then Hệ thống phải hiển thị cảnh báo lỗi "Summary is too long"