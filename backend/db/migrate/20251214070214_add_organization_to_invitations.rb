class AddOrganizationToInvitations < ActiveRecord::Migration[7.2]
  def change
    add_reference :invitations, :organization, null: true, foreign_key: true
  end
end
