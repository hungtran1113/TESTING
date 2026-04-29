@UC04
Feature: Chức năng Chỉnh sửa thông tin Issue

  # Chạy 1 lần cho tất cả các kịch bản bên dưới
  Background:
    Given Tôi đã nạp Cookies vào trình duyệt
    And Tôi đang xem chi tiết một Issue hiện có

  @TC04_01
  Scenario: Chỉnh sửa Story Point với dữ liệu sai định dạng
    When Tôi nhập "ABC" vào trường Story point estimate
    Then Hệ thống phải báo lỗi định dạng số không hợp lệ

  @TC04_02
  Scenario: Chỉnh sửa trạng thái, tiêu đề và Story Point
    When Tôi đổi tiêu đề Summary thành "Tiêu đề Issue đã được cập nhật tự động bằng Playwright"
    And Tôi đổi Trạng thái thành "In Progress"
    # Gọi cái lệnh quay số ngẫu nhiên vừa tạo ở đây:
    And Tôi nhập Story point ngẫu nhiên từ 1 đến 20
    Then Các thông tin vừa cập nhật phải hiển thị chính xác trên màn hình

  @TC04_03
  Scenario: Cập nhật Mô tả, Người phụ trách và Nhãn
    When Tôi cập nhật Description thành "Đây là mô tả chi tiết được viết hoàn toàn tự động bằng Playwright."
    And Tôi thêm Label là "Automation-Test"
    # QUAN TRỌNG: Hãy đổi email dưới đây thành email thật của một thành viên trong dự án của bạn
    And Tôi gán Issue cho Assignee là "email_cua_thanh_vien_khac@gmail.com"
    Then Các thông tin vừa cập nhật phải hiển thị chính xác trên màn hình

  @TC04_04
  Scenario: Tạo Subtask mới từ Issue hiện tại
    When Tôi tạo một Subtask với tiêu đề "Công việc con số 1: Viết tài liệu kiểm thử"
    Then Các thông tin vừa cập nhật phải hiển thị chính xác trên màn hình

  @TC04_05
  Scenario: Chỉnh sửa Summary thành rỗng (Empty) và kiểm tra thông báo lỗi
    When Tôi xóa trống trường Summary của Issue
    Then Hệ thống phải hiển thị cảnh báo lỗi bắt buộc nhập Summary