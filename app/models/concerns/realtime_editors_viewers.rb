module RealtimeEditorsViewers
  extend ActiveSupport::Concern

  def received_changes(data, user = nil, include_all_collaborators: true)
    publish_to_channel(
      current_editor: user ? user.as_json : {},
      data: data,
      include_all_collaborators: include_all_collaborators,
    )
  end

  # Track viewers by user_id
  def started_viewing(user = nil, dont_notify: false)
    if user && !viewing?(user)
      Cache.set_add(viewing_cache_key, collaborator_json_stringified(user))
    end
    received_changes(num_viewers_changed: true) unless dont_notify
  end

  def stopped_viewing(user = nil, dont_notify: false)
    Cache.set_scan_and_remove(viewing_cache_key, 'id', user.id) if user
    received_changes(num_viewers_changed: true) unless dont_notify
  end

  def stream_name
    viewing_cache_key
  end

  def publish_error
    ActionCable.server.broadcast stream_name, {}, code: :unprocessable_entity
  end

  def num_viewers
    Cache.set_members(viewing_cache_key).size
  end

  def channel_collaborators
    # NOTE: collaborators are users that are viewing the given collection who can have editor or viewer permission
    Cache.set_members(viewing_cache_key).map { |m| JSON.parse(m) }
  end

  def viewing?(user)
    viewing_user = Cache.scan_for_value(viewing_cache_key, 'id', user.id)
    viewing_user.present?
  end

  def viewing_cache_key
    "#{self.class.base_class.name}_#{id}_viewing_v2"
  end

  private

  def publish_to_channel(merge_data = {})
    include_all_collaborators = merge_data.delete :include_all_collaborators
    defaults = {
      current_editor: {},
      record_id: id.to_s,
      record_type: jsonapi_type_name,
    }
    data = defaults
    if include_all_collaborators
      data = data.merge!(
        collaborators: channel_collaborators,
        num_viewers: num_viewers,
      )
    end
    data = data.merge!(merge_data)
    ActionCable.server.broadcast stream_name, data
  end

  def collaborator_json_stringified(user)
    user_hash = user.as_json
    user_hash[:can_edit_collection] = can_edit?(user)
    user_hash[:timestamp] = Time.now
    user_hash.to_json
  end
end
