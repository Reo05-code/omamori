# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  subject(:user) { build(:user) }

  # ============================================
  # Factory のテスト
  # ============================================
  describe "Factory" do
    it "有効なファクトリを持つこと" do
      expect(user).to be_valid
    end

    it "admin trait が機能すること" do
      expect(build(:user, :admin).role).to eq("admin")
    end

    it "with_avatar trait が機能すること" do
      expect(build(:user, :with_avatar).avatar_url).to be_present
    end
  end

  # ============================================
  # バリデーション
  # ============================================
  describe "Validations" do
    # --- name ---
    describe "name" do
      it { is_expected.to validate_presence_of(:name) }
      it { is_expected.to validate_length_of(:name).is_at_most(50) }

      it "50文字は有効" do
        user.name = "a" * 50
        expect(user).to be_valid
      end

      it "51文字は無効" do
        user.name = "a" * 51
        expect(user).not_to be_valid
      end
    end

    # --- email ---
    describe "email" do
      it { is_expected.to validate_presence_of(:email) }

      it "重複は無効" do
        create(:user, email: "duplicate@example.com")
        user.email = "duplicate@example.com"
        expect(user).not_to be_valid
      end

      it "形式不正は無効" do
        user.email = "invalid-email"
        expect(user).not_to be_valid
      end

      it "形式正しい場合は有効" do
        user.email = "valid@example.com"
        expect(user).to be_valid
      end
    end

    # --- role ---
    describe "role" do
      it { is_expected.to validate_presence_of(:role) }

      it "worker/admin は有効" do
        expect(build(:user, role: :worker)).to be_valid
        expect(build(:user, role: :admin)).to be_valid
      end

      it "不正値は ArgumentError" do
        expect { user.role = :invalid_role }.to raise_error(ArgumentError)
      end
    end

    # --- phone_number ---
    describe "phone_number" do
      it { is_expected.to validate_presence_of(:phone_number) }

      it "10桁・11桁は有効" do
        expect(build(:user, phone_number: "0312345678")).to be_valid
        expect(build(:user, phone_number: "09012345678")).to be_valid
      end

      it "9桁・12桁・ハイフン・文字入りは無効" do
        invalid_numbers = ["090123456", "090123456789", "090-1234-5678", "090abcd5678"]
        invalid_numbers.each do |num|
          user.phone_number = num
          expect(user).not_to be_valid
        end
      end
    end

    # --- avatar_url ---
    describe "avatar_url" do
      it "空白・空文字は有効" do
        expect(build(:user, avatar_url: nil)).to be_valid
        expect(build(:user, avatar_url: "")).to be_valid
      end

      it "http/https は有効" do
        expect(build(:user, avatar_url: "http://example.com/avatar.jpg")).to be_valid
        expect(build(:user, avatar_url: "https://example.com/avatar.jpg")).to be_valid
      end

      it "ftp/不正 URL は無効" do
        expect(build(:user, avatar_url: "ftp://example.com/avatar.jpg")).not_to be_valid
        expect(build(:user, avatar_url: "not-a-valid-url")).not_to be_valid
      end
    end

    # --- password ---
    describe "password" do
      it "nil は無効" do
        user.password = user.password_confirmation = nil
        expect(user).not_to be_valid
      end

      it "6文字以上は有効、5文字以下は無効" do
        expect(build(:user, password: "123456", password_confirmation: "123456")).to be_valid
        expect(build(:user, password: "12345", password_confirmation: "12345")).not_to be_valid
      end
    end
  end

  # ============================================
  # Enum のテスト
  # ============================================
  describe "Enum" do
    it { is_expected.to define_enum_for(:role).with_values(worker: 0, admin: 1) }

    it "worker?/admin? は正しく動作" do
      expect(build(:user, role: :worker).worker?).to be true
      expect(build(:user, role: :worker).admin?).to be false
      expect(build(:user, role: :admin).admin?).to be true
      expect(build(:user, role: :admin).worker?).to be false
    end

    it "worker!/admin! で変更可能" do
      user = create(:user, role: :admin)

      user.worker!
      expect(user.reload.role).to eq("worker")

      user.admin!
      expect(user.reload.role).to eq("admin")
    end
  end

  # ============================================
  # Devise モジュールのテスト
  # ============================================
  describe "Devise modules" do
    %i[database_authenticatable registerable recoverable rememberable validatable].each do |mod|
      it "#{mod} が有効であること" do
        expect(User.devise_modules).to include(mod)
      end
    end
  end

  # ============================================
  # DeviseTokenAuth
  # ============================================
  describe "DeviseTokenAuth" do
    it "DeviseTokenAuth::Concerns::User が include されていること" do
      expect(User.ancestors).to include(DeviseTokenAuth::Concerns::User)
    end
  end
end
