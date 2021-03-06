Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # we turn this off because it gets confused about our "resolutions" in package.json
  config.webpacker.check_yarn_integrity = false

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = (ENV['CODESHIP'] || ENV['CYPRESS']).present?

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable/disable caching. By default caching is disabled.
  if Rails.root.join('tmp', 'caching-dev.txt').exist?
    config.action_controller.perform_caching = true

    # see: https://github.com/petergoldstein/dalli/issues/746
    # issue with using `fetch_multi` and `dalli_store` on localhost
    config.cache_store = :mem_cache_store
    config.public_file_server.headers = {
      'Cache-Control' => "public, max-age=#{2.days.seconds.to_i}",
    }

    # allows you to test cloud memcache in dev if set in ENV
    if ENV['MEMCACHEDCLOUD_SERVERS']
      config.cache_store = :dalli_store,
                           ENV['MEMCACHEDCLOUD_SERVERS'].split(','),
                           { username: ENV['MEMCACHEDCLOUD_USERNAME'], password: ENV['MEMCACHEDCLOUD_PASSWORD'] }
    end
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  # Store uploaded files on the local file system (see config/storage.yml for options)
  # config.active_storage.service = :local

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  config.action_mailer.perform_caching = false

  config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Highlight code that triggered database queries in logs.
  config.active_record.verbose_query_logs = true

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  # ActiveJob just used for ActionMailer.deliver_later
  # inline will print emails in rails server log
  config.active_job.queue_adapter = :inline

  # http://guides.rubyonrails.org/action_mailer_basics.html#previewing-emails
  config.action_mailer.preview_path = "#{Rails.root}/lib/mailer_previews"
end
