# frozen_string_literal: true

require "rails_helper"

RSpec.describe User do
  subject(:user) { build(:user) }

  # ============================================
  # Factory のテスト
  # ============================================
  describe "Factory" do
    it "有効なファクトリを持つこと" do
      expect(user).to be_valid
    end

    it "with_avatar trait が機能すること" do
      expect(build(:user, :with_avatar).avatar_url).to be_present
    end
  end

  # ============================================
  # バリデーション のテスト
  # ============================================
  describe "Validations" do
    # --- name ---
    # name は API 経由で必須でないため、空白を許容する
    it { is_expected.to allow_value(nil).for(:name) }
    it { is_expected.to allow_value("").for(:name) }
    it { is_expected.to validate_length_of(:name).is_at_most(50) }

    # --- email ---
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).scoped_to(:provider).case_insensitive }

    # --- phone_number ---
    # phone_number はフロント側で任意扱いのため、空白許容とする
    it { is_expected.to allow_value("0312345678").for(:phone_number) }
    it { is_expected.to allow_value("09012345678").for(:phone_number) }
    it { is_expected.not_to allow_value("090123456").for(:phone_number) }
    it { is_expected.not_to allow_value("090123456789").for(:phone_number) }
    it { is_expected.not_to allow_value("090-1234-5678").for(:phone_number) }
    it { is_expected.not_to allow_value("090abcd5678").for(:phone_number) }

    # --- avatar_url ---
    it { is_expected.to allow_value(nil).for(:avatar_url) }
    it { is_expected.to allow_value("").for(:avatar_url) }
    it { is_expected.to allow_value("http://example.com/avatar.jpg").for(:avatar_url) }
    it { is_expected.to allow_value("https://example.com/avatar.jpg").for(:avatar_url) }
    it { is_expected.not_to allow_value("ftp://example.com/avatar.jpg").for(:avatar_url) }
    it { is_expected.not_to allow_value("not-a-valid-url").for(:avatar_url) }

    # --- password ---
    it { is_expected.to validate_presence_of(:password) }
    it { is_expected.to validate_length_of(:password).is_at_least(8) }

    # パスワード強度検証（8文字以上 + 大文字・小文字・数字必須）
    describe "password strength validation" do
      it "8文字以上で大文字・小文字・数字を含むパスワードは有効" do
        user.password = "Password123"
        user.password_confirmation = "Password123"
        expect(user).to be_valid
      end

      it "7文字（8文字未満）のパスワードは無効" do
        user.password = "Pass123"
        user.password_confirmation = "Pass123"
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include("は8文字以上で入力してください")
      end

      it "大文字を含まないパスワードは無効" do
        user.password = "password123"
        user.password_confirmation = "password123"
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include("は大文字・小文字・数字を含む必要があります")
      end

      it "小文字を含まないパスワードは無効" do
        user.password = "PASSWORD123"
        user.password_confirmation = "PASSWORD123"
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include("は大文字・小文字・数字を含む必要があります")
      end

      it "数字を含まないパスワードは無効" do
        user.password = "PasswordABC"
        user.password_confirmation = "PasswordABC"
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include("は大文字・小文字・数字を含む必要があります")
      end

      it "空白のパスワードは無効" do
        user.password = ""
        user.password_confirmation = ""
        expect(user).not_to be_valid
      end
    end

    # --- settings store_accessor ---
    it { is_expected.to validate_inclusion_of(:notification_enabled).in_array([true, false]).allow_nil }
    it { is_expected.to validate_inclusion_of(:dark_mode).in_array(%w[on off]).allow_nil }

    # 境界値・エッジケース
    describe "boundary cases" do
      it "50文字の name は有効" do
        user.name = "a" * 50
        expect(user).to be_valid
      end

      it "51文字の name は無効" do
        user.name = "a" * 51
        expect(user).not_to be_valid
      end

      it "email 重複は無効" do
        create(:user, email: "duplicate@example.com")
        user.email = "duplicate@example.com"
        expect(user).not_to be_valid
      end

      it "不正な email 形式は無効" do
        user.email = "invalid-email"
        expect(user).not_to be_valid
      end
    end
  end

  # ============================================
  # Devise モジュールのテスト
  # ============================================
  describe "Devise modules" do
    %i[database_authenticatable registerable recoverable rememberable validatable].each do |mod|
      it "#{mod} が有効であること" do
        expect(described_class.devise_modules).to include(mod)
      end
    end
  end

  # ============================================
  # DeviseTokenAuth
  # ============================================
  describe "DeviseTokenAuth" do
    it "DeviseTokenAuth::Concerns::User が include されていること" do
      expect(described_class.ancestors).to include(DeviseTokenAuth::Concerns::User)
    end
  end

  # ============================================
  # Settings (JSONB) & Store Accessor のテスト
  # ============================================
  describe "Settings (store_accessor)" do
    it "デフォルトで settings は空のハッシュとして存在すること" do
      u = create(:user)
      expect(u.settings).to eq({})
    end

    it "store_accessor による読み書きができること" do
      u = create(:user)
      expect(u.notification_enabled).to be_nil
      u.notification_enabled = true
      u.dark_mode = "on"
      expect(u.notification_enabled).to be(true)
      expect(u.dark_mode).to eq("on")
    end

    it "保存後も settings の値が保持されること" do
      u = create(:user)
      u.notification_enabled = false
      u.dark_mode = "off"
      u.save!
      expect(u.reload.notification_enabled).to be(false)
      expect(u.reload.dark_mode).to eq("off")
    end
  end
end
