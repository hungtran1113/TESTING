@UC01
Feature: Chức năng Tạo mới Không gian làm việc - Space (Thành viên 1)

  Background: 
    Given Tôi đã nạp Cookies vào trình duyệt

  Scenario: Tạo Space mới thành công từ thanh Sidebar qua 2 bước
    When Tôi truy cập vào trang chủ Jira
    And Tôi nhấn nút dấu cộng tạo Space trên menu
    And Tôi chọn template "Scrum"
    And Tôi điền thông tin dự án Team-managed với tên ngẫu nhiên
    And Tôi nhấn nút Next để sang bước 2
    And Tôi thiết lập Role là "Administrator" và hoàn tất
    Then Hệ thống chuyển hướng vào trang chi tiết của Space mới