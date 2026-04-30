@UC02
Feature: Phân quyền thành viên

  Background:
    # Câu này sẽ tự động chạy trước TẤT CẢ các kịch bản bên dưới
    Given Tôi đã ở trong Space vừa tạo

  @TC02_01
  Scenario: TC01 - Cấp quyền truy cập cho Thành viên 2 vào Space mới tạo
    When Tôi bấm nút "Add people" trên màn hình
    And Tôi nhập email thành viên là "dogianam158@gmail.com"
    And Tôi bấm xác nhận thêm người
    Then Hệ thống thông báo thành viên mới đã được thêm thành công
    
  @TC02_02
  Scenario: TC2 - Nhập email sai định dạng
    When Tôi bấm nút "Add people" trên màn hình
    And Tôi gõ chuỗi sai định dạng "abc@xyz" vào ô email
    Then Hệ thống phải hiển thị cảnh báo lỗi thêm thành viên
  
  @TC02_03
  Scenario: TC3 - Bỏ trống thông tin email khi mời
    When Tôi bấm nút "Add people" trên màn hình
    And Tôi để trống ô nhập email
    Then Hệ thống phải hiển thị cảnh báo lỗi thêm thành viên

  @TC02_04 @no-retry
  Scenario: TC4 - Thêm thành viên đã tồn tại trong dự án
    When Tôi bấm nút "Add people" trên màn hình
    And Tôi nhập email thành viên là "dogianam158@gmail.com"
    Then Hệ thống hiển thị gợi ý người dùng có sẵn thay vì tạo lời mời mới

  @TC02_05
  Scenario: TC5 - Hủy bỏ thao tác thêm thành viên
    When Tôi bấm nút "Add people" trên màn hình
    And Tôi nhập email thành viên là "test_cancel@gmail.com"
    And Tôi bấm nút "Cancel" trên màn hình
    Then Hộp thoại Add people phải được đóng lại