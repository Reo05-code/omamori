# frozen_string_literal: true

module Api
  module V1
    class RiskAssessmentSerializer
      def initialize(risk_assessment)
        @risk_assessment = risk_assessment
      end

      def as_json
        {
          id: @risk_assessment.id,
          logged_at: @risk_assessment.safety_log&.logged_at&.iso8601,
          score: @risk_assessment.score,
          level: @risk_assessment.level,
          details: @risk_assessment.details || {}
        }
      end
    end
  end
end
