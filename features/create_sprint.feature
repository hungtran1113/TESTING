@UC05
Feature: Quản lý Sprint (Create & Edit Sprint)

  Background:
    Given Tôi đã ở trong trang Backlog của dự án

  @TC_SPR_01
  Scenario: TC_SPR_01 - Tạo Sprint thành công
    When Tôi nhấn nút "Create sprint"
    Then Sprint mới xuất hiện với tên mặc định tiếp theo

  @TC_SPR_02
  Scenario: TC_SPR_02 - Báo lỗi khi tên Sprint rỗng
    When Tôi nhấn "Edit sprint"
    And Tôi xóa sạch nội dung tại ô Name
    And Tôi nhấn Save hoặc Enter
    Then Hệ thống báo lỗi "Sprint name is required"

  @TC_SPR_03
  Scenario: TC_SPR_03 - Cảnh báo lỗi logic thời gian
    When Tôi nhấn "Edit sprint"
    And Tôi chọn ngày bắt đầu "05/20/2026" và ngày kết thúc "05/15/2026" sớm hơn
    And Tôi nhấn "Update"
    Then Thông báo lỗi logic thời gian không hợp lệ