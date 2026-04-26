@UC04
Feature: Chức năng Chỉnh sửa thông tin Issue (Thành viên 2)

  Scenario: Chỉnh sửa Story Point với dữ liệu sai định dạng
    Given Tôi đã nạp Cookies vào trình duyệt
    And Tôi đang xem chi tiết một Issue hiện có
    When Tôi nhập "ABC" vào trường Story point estimate
    Then Hệ thống phải báo lỗi định dạng số không hợp lệ