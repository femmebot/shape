class Api::V1::SurveyResponsesController < Api::V1::BaseController
  skip_before_action :check_api_authentication!
  # deserializable_resource :survey_response, class: DeserializableSurveyResponse, only: %i[create]
  before_action :load_test_collection

  def create
    @survey_response = @collection.create_uniq_survey_response
    if @survey_response
      render jsonapi: @survey_response
    else
      render_api_errors @survey_response.errors
    end
  end

  private

  def load_test_collection
    # NOTE: not sure why DeserializableSurveyResponse wasn't happy here (`no id for nil` 500 error),
    # had to just use json_api_params
    id = json_api_params['data']['attributes']['test_collection_id']
    @collection = Collection::TestCollection.find(id)
    # TODO: also reject when this collection is not "live/public"
    head(401) unless @collection.present?
  end
end
