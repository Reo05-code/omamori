# frozen_string_literal: true

class ApplicationRecord < ActiveRecord::Base
  # テーブルを持たない抽象クラスを宣言
  primary_abstract_class
end
