module Api
  module V1
    # Lightweight serializer for Organization
    class OrganizationSerializer
      def initialize(organization)
        @organization = organization
      end

      def as_json(*)
        {
          id: @organization.id,
          name: @organization.name
        }
      end
    end
  end
end
