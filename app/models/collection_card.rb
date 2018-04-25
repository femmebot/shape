class CollectionCard < ApplicationRecord
  include Archivable

  belongs_to :parent, class_name: 'Collection'
  belongs_to :collection, optional: true
  belongs_to :item, optional: true
  # this really is only appropriate for CollectionCard::Primary but defined globally here
  accepts_nested_attributes_for :collection, :item

  before_validation :assign_order, if: :assign_order?
  before_create :assign_default_height_and_width

  validates :parent, :order, presence: true
  validate :single_item_or_collection_is_present

  validate :parent_is_not_readonly, on: :create

  delegate :can_edit?, to: :parent, allow_nil: true
  delegate :can_view?, to: :parent, allow_nil: true

  scope :ordered, -> { order(order: :asc) }

  amoeba do
    enable
    exclude_association :collection
    exclude_association :item
    exclude_association :parent
  end

  def duplicate!(for_user:, parent: self.parent, shallow: false, update_order: false)
    if record.is_a? Collection::SharedWithMeCollection
      errors.add(:collection, 'cannot be a SharedWithMeCollection for duplication')
      return self
    end
    cc = amoeba_dup
    # defaults to self.parent, unless one is passed in
    cc.parent = parent
    # place card at end
    cc.order = parent.collection_cards.count

    unless shallow || link?
      cc.collection = collection.duplicate!(for_user: for_user) if collection.present?
      cc.item = item.duplicate!(for_user: for_user) if item.present?
    end

    return cc unless cc.save

    # TODO: better way to get the correct breadcrumb upon initial duplication?
    cc.record.recalculate_breadcrumb!
    cc.increment_card_orders! if update_order

    cc
  end

  def record
    return item if item.present?
    return collection if collection.present?
  end

  def record_type
    return nil if record.blank?
    record.class.base_class.name.underscore.to_sym
  end

  def primary?
    is_a? CollectionCard::Primary
  end

  def link?
    is_a? CollectionCard::Link
  end

  def copy_into_new_link_card
    amoeba_dup.becomes!(CollectionCard::Link)
  end

  # Increment the order by 1 of all cards >= specified order
  # - Defaults to use this card's order
  # - Useful when inserting a new card to increment card order after this card
  def increment_card_orders!(starting_at_order = order)
    greater_than_or_equal = CollectionCard.arel_table[:order].gteq(starting_at_order)

    update_ids = parent.collection_cards
                       .where(greater_than_or_equal)
                       .where.not(id: id)
                       .pluck(:id)

    return true if update_ids.blank?

    CollectionCard.increment_counter(:order, update_ids)
  end

  # Decrement the order by 1 of all cards with >= specified order
  # - Defaults to use this card's order
  # - Useful when removing a card from the collection
  def decrement_card_orders!(starting_at_order = order)
    greater_than_or_equal = CollectionCard.arel_table[:order].gteq(starting_at_order)

    update_ids = parent.collection_cards
                       .where(greater_than_or_equal)
                       .where.not(id: id)
                       .pluck(:id)

    return true if update_ids.blank?

    CollectionCard.decrement_counter(:order, update_ids)
  end

  # gets called by child STI classes
  def after_archive_card
    decrement_card_orders!
    cover = parent.cached_cover
    if cover['card_ids'].include?(id)
      # regenerate parent collection cover if archived card was relevant
      parent.cache_cover!
    else
      # touch parent to bust cache
      parent.touch
    end
  end

  def self.with_record(record)
    if record.is_a?(Item)
      where(item_id: record.id)
    elsif record.is_a?(Collection)
      where(collection_id: record.id)
    else
      []
    end
  end

  def should_update_parent_collection_cover?
    collection = try(:parent)
    return unless collection.present? && collection.base_collection_type?
    cover = collection.cached_cover
    cover.blank? ||
      cover['card_ids'].blank? ||
      cover['text'].blank? ||
      cover['image_url'].blank? ||
      cover['card_ids'].include?(id) ||
      cover['card_order'].nil? ||
      order <= cover['card_order']
  end

  private

  def assign_default_height_and_width
    self.height ||= 1
    self.width ||= 1
  end

  def assign_order?
    order.blank? && parent.present?
  end

  def assign_order
    self.order = parent.collection_cards.maximum(:order) || 0
  end

  def resourceable_class
    # Use top-level class since this is an STI model
    CollectionCard
  end

  def single_item_or_collection_is_present
    return unless item.present? && collection.present?

    errors.add(:base, 'Only one of Item or Collection can be assigned')
  end

  def parent_is_not_readonly
    return if parent.blank?

    errors.add(:parent, 'is read-only so you can\'t save this card') if parent.read_only?
  end
end
