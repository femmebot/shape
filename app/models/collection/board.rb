# == Schema Information
#
# Table name: collections
#
#  id                             :bigint(8)        not null, primary key
#  anyone_can_join                :boolean          default(FALSE)
#  anyone_can_view                :boolean          default(FALSE)
#  archive_batch                  :string
#  archived                       :boolean          default(FALSE)
#  archived_at                    :datetime
#  breadcrumb                     :jsonb
#  cached_attributes              :jsonb
#  cached_test_scores             :jsonb
#  collection_type                :integer          default("collection")
#  cover_type                     :integer          default("cover_type_default")
#  end_date                       :datetime
#  font_color                     :string
#  hide_submissions               :boolean          default(FALSE)
#  icon                           :string
#  master_template                :boolean          default(FALSE)
#  name                           :string
#  num_columns                    :integer          default(4)
#  processing_status              :integer
#  propagate_background_image     :boolean          default(FALSE)
#  propagate_font_color           :boolean          default(FALSE)
#  search_term                    :string
#  shared_with_organization       :boolean          default(FALSE)
#  show_icon_on_cover             :boolean
#  start_date                     :datetime
#  submission_box_type            :integer
#  submissions_enabled            :boolean          default(TRUE)
#  test_closed_at                 :datetime
#  test_launched_at               :datetime
#  test_show_media                :boolean          default(TRUE)
#  test_status                    :integer
#  type                           :string
#  unarchived_at                  :datetime
#  created_at                     :datetime         not null
#  updated_at                     :datetime         not null
#  challenge_admin_group_id       :integer
#  challenge_participant_group_id :integer
#  challenge_reviewer_group_id    :integer
#  cloned_from_id                 :bigint(8)
#  collection_to_test_id          :bigint(8)
#  created_by_id                  :integer
#  default_group_id               :integer
#  idea_id                        :integer
#  joinable_group_id              :bigint(8)
#  organization_id                :bigint(8)
#  question_item_id               :integer
#  roles_anchor_collection_id     :bigint(8)
#  submission_box_id              :bigint(8)
#  submission_template_id         :integer
#  survey_response_id             :integer
#  template_id                    :integer
#  test_collection_id             :bigint(8)
#
# Indexes
#
#  index_collections_on_archive_batch               (archive_batch)
#  index_collections_on_breadcrumb                  (breadcrumb) USING gin
#  index_collections_on_cached_test_scores          (cached_test_scores) USING gin
#  index_collections_on_cloned_from_id              (cloned_from_id)
#  index_collections_on_created_at                  (created_at)
#  index_collections_on_idea_id                     (idea_id)
#  index_collections_on_organization_id             (organization_id)
#  index_collections_on_roles_anchor_collection_id  (roles_anchor_collection_id)
#  index_collections_on_submission_box_id           (submission_box_id)
#  index_collections_on_submission_template_id      (submission_template_id)
#  index_collections_on_template_id                 (template_id)
#  index_collections_on_test_status                 (test_status)
#  index_collections_on_type                        (type)
#
# Foreign Keys
#
#  fk_rails_...  (organization_id => organizations.id)
#

# NOTE: this model exists somewhat as a legacy, right now it is just for 16-wide boards.
# It used to be that Collections either acted like a board, and had 16 columns (STI type = Board),
# or they followed "collection_card.order" in a flowing grid (STI type = nil).
# We should be able to eventually deprecate this.
class Collection
  class Board < Collection
    # Re-define association to use `ordered_row_col` scope,
    # so cards are in correct order according to row and col
    has_many :collection_cards,
             -> { active.ordered_row_col },
             class_name: 'CollectionCard',
             foreign_key: :parent_id,
             inverse_of: :parent

    # also re-declared here to make use of new scope defined above
    has_many :items_and_linked_items,
             through: :collection_cards,
             source: :item

    before_create :set_as_foamcore, if: :collection_type_collection?

    private

    def set_as_foamcore
      self.collection_type = :foamcore
    end
  end
end
