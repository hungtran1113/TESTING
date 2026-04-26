@UC03
Feature: Chức năng Tạo mới Issue trên Jira (Thành viên 2)

  Background:
    Given Tôi đã nạp Cookies vào trình duyệt
    # Chú ý: Đường dẫn này dùng chung với cấu hình board SCRUM của bạn
    And Tôi truy cập vào trang dự án Jira của nhóm

  Scenario: Tạo Issue thành công với dữ liệu hợp lệ
    When Tôi nhấn nút Create trên thanh điều hướng
    And Tôi nhập Summary là "Test Issue tự động bằng Playwright"
    And Tôi nhấn nút xác nhận Create trên form
    Then Hệ thống phải hiển thị thông báo tạo Issue thành công

  #Scenario: Báo lỗi khi để trống trường Summary
  #  When Tôi nhấn nút Create trên thanh điều hướng
  #  And Tôi để trống trường Summary
  #  And Tôi nhấn nút xác nhận Create trên form
  #  Then Hệ thống phải hiển thị cảnh báo lỗi "Summary is required"