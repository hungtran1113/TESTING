@UC06
Feature: Quản lý Bình luận (Add Comment)

  Background:
    Given Tôi mở chi tiết Issue

  @TC_CMT_01
  Scenario: TC_CMT_01 - Thêm bình luận hợp lệ
    When Tôi nhập nội dung "Test tự động" vào ô Comment
    And Tôi nhấn "Save"
    Then Bình luận hiển thị đúng nội dung kèm nhãn thời gian "Just now"

  @TC_CMT_02
  Scenario: TC_CMT_02 - Vô hiệu hóa nút Save khi rỗng
    When Tôi click vào ô "Add a comment"
    And Tôi không nhập bất kỳ ký tự nào
    Then Nút "Save" bị vô hiệu hóa (Disabled), không thể nhấn thực hiện

  @TC_CMT_03
  Scenario: TC_CMT_03 - Không gợi ý tag người dùng sai
    When Tôi nhập nội dung có chứa ký tự "@" và tên không có trong dự án là "Unknown"
    Then Hệ thống không hiển thị gợi ý thành viên và coi đó là văn bản thuần