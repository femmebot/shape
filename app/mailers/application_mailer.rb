class ApplicationMailer < ActionMailer::Base
  include Roadie::Rails::Automatic
  include ApplicationHelper

  default from: 'Shape <hello@shape.space>'
  layout 'mailer'

  def mail(**args)
    if args[:users].present? && ENV['SHAPE_APP'] == 'staging'
      products_group_user_ids = Group.find(::IDEO_PRODUCTS_GROUP_ID).user_ids
      args[:to] = args[:users].select { |u| products_group_user_ids.include?(u.id) }.map(&:email)
    end
    if args[:to].empty?
      # could happen if we deleted users above
      # -- OR --
      # in a worker that emails all admins, and there are no admins left
      return
    end
    args.delete :users
    super(args)
  rescue ActiveRecord::RecordNotFound
    logger.error 'Products group not found.'
  end
end
