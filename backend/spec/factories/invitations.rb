# frozen_string_literal: true

FactoryBot.define do
  factory :invitation do
    inviter factory: %i[user]
    organization
    sequence(:invited_email) { |n| "invitee#{n}@example.com" }
    role { :worker }

    after(:build) do |invitation|
      # inviter が新規オブジェクトならバリデーションをスキップして保存
      if invitation.inviter.respond_to?(:new_record?) && invitation.inviter.new_record?
        # 保存前に、未永続の invitation が inviter.sent_invitations に残っている場合は除去する
        invitation.inviter.sent_invitations.delete(invitation) if invitation.inviter.respond_to?(:sent_invitations)

        invitation.inviter.save!(validate: false)
      end

      # organization が未永続であれば保存
      if invitation.organization.respond_to?(:new_record?) && invitation.organization.new_record?
        invitation.organization.save!(validate: false)
      end

      # inviter に admin membership がなければ作成する
      unless invitation.organization.memberships.exists?(user: invitation.inviter)
        create(:membership, organization: invitation.organization, user: invitation.inviter, role: :admin)
      end
    end
  end
end
